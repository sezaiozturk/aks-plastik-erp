const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        salesRep: { select: { id: true, name: true } },
        items: { include: { product: { select: { stockNo: true, currency: true } } } },
      },
    })
    // Patch in raw fields the stale client doesn't select automatically
    const raw = await prisma.$queryRaw`SELECT id, "shipmentType", "paymentMethod" FROM "Order"`
    const rawMap = {}
    raw.forEach(r => { rawMap[r.id] = r })
    orders.forEach(o => {
      if (rawMap[o.id]) {
        o.shipmentType = rawMap[o.id].shipmentType || ''
        o.paymentMethod = rawMap[o.id].paymentMethod || ''
      }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true, employee: true, items: { include: { product: true } } },
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { customerId, employeeId, salesRepId, status, notes, items, shipmentType, paymentMethod } = req.body
    const code = `ORD-${String(Date.now()).slice(-6)}`

    const totalAmount = (items || []).reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 1
      const price = parseFloat(item.unitPrice) || 0
      const vatRate = parseFloat(item.vat) || 0
      return sum + qty * price * (1 + vatRate / 100)
    }, 0)

    const order = await prisma.order.create({
      data: {
        code,
        ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
        ...(employeeId ? { employee: { connect: { id: employeeId } } } : {}),
        ...(salesRepId ? { salesRep: { connect: { id: salesRepId } } } : {}),
        status: status || 'Processing',
        vat: 0,
        totalAmount,
        notes: notes || '',
        items: {
          create: (items || []).map((item) => ({
            productName: item.productName,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            currency: item.currency || 'USD',
            vat: parseFloat(item.vat) || 0,
            ...(item.productId ? { product: { connect: { id: item.productId } } } : {}),
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        salesRep: { select: { id: true, name: true } },
        items: { include: { product: { select: { stockNo: true, currency: true } } } },
      },
    })
    // Set new fields via raw SQL until Prisma client is regenerated
    await prisma.$executeRawUnsafe(
      `UPDATE "Order" SET "shipmentType" = $1, "paymentMethod" = $2 WHERE id = $3`,
      shipmentType || '', paymentMethod || '', order.id
    )
    order.shipmentType = shipmentType || ''
    order.paymentMethod = paymentMethod || ''
    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { customerId, employeeId, salesRepId, status, notes, items, shipmentType, paymentMethod } = req.body

    // Sales Managers can only set status to 'Confirmed'
    if (req.user.department === 'Sales Manager' && status) {
      const current = await prisma.order.findUnique({ where: { id: req.params.id }, select: { status: true } })
      if (status !== 'Confirmed' && status !== current?.status) {
        return res.status(403).json({ error: 'Sales Managers can only change status to Confirmed' })
      }
    }

    const totalAmount = (items || []).reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 1
      const price = parseFloat(item.unitPrice) || 0
      const vatRate = parseFloat(item.vat) || 0
      return sum + qty * price * (1 + vatRate / 100)
    }, 0)

    // Delete existing items and recreate
    await prisma.orderItem.deleteMany({ where: { orderId: req.params.id } })

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        customer: customerId ? { connect: { id: customerId } } : { disconnect: true },
        employee: employeeId ? { connect: { id: employeeId } } : { disconnect: true },
        salesRep: salesRepId ? { connect: { id: salesRepId } } : { disconnect: true },
        status: status || 'Processing',
        vat: 0,
        totalAmount,
        notes: notes || '',
        items: {
          create: (items || []).map((item) => ({
            productName: item.productName,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            currency: item.currency || 'USD',
            vat: parseFloat(item.vat) || 0,
            ...(item.productId ? { product: { connect: { id: item.productId } } } : {}),
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        salesRep: { select: { id: true, name: true } },
        items: { include: { product: { select: { stockNo: true, currency: true } } } },
      },
    })
    // Set new fields via raw SQL until Prisma client is regenerated
    await prisma.$executeRawUnsafe(
      `UPDATE "Order" SET "shipmentType" = $1, "paymentMethod" = $2 WHERE id = $3`,
      shipmentType || '', paymentMethod || '', order.id
    )
    order.shipmentType = shipmentType || ''
    order.paymentMethod = paymentMethod || ''
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res, next) => {
  const allowed = req.user.role === 'admin' || req.user.department === 'Sales Manager'
  if (!allowed) return res.status(403).json({ error: 'Access required' })
  next()
}, async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
