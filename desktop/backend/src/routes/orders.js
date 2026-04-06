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
    const { customerId, employeeId, salesRepId, status, notes, vat, items, shipmentType, paymentMethod } = req.body
    const code = `ORD-${String(Date.now()).slice(-6)}`

    const subtotal = (items || []).reduce(
      (sum, item) => sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1),
      0
    )
    const vatRate = parseFloat(vat) || 0
    const totalAmount = subtotal * (1 + vatRate / 100)

    const order = await prisma.order.create({
      data: {
        code,
        customerId: customerId || null,
        employeeId: employeeId || null,
        salesRepId: salesRepId || null,
        status: status || 'Processing',
        vat: vatRate,
        totalAmount,
        notes: notes || '',
        shipmentType: shipmentType || '',
        paymentMethod: paymentMethod || '',
        items: {
          create: (items || []).map((item) => ({
            productName: item.productName,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            currency: item.currency || 'USD',
            productId: item.productId || null,
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
    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { customerId, employeeId, salesRepId, status, notes, vat, items, shipmentType, paymentMethod } = req.body

    // Sales Managers can only set status to 'Confirmed'
    if (req.user.department === 'Sales Manager' && status) {
      const current = await prisma.order.findUnique({ where: { id: req.params.id }, select: { status: true } })
      if (status !== 'Confirmed' && status !== current?.status) {
        return res.status(403).json({ error: 'Sales Managers can only change status to Confirmed' })
      }
    }

    const subtotal = (items || []).reduce(
      (sum, item) => sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1),
      0
    )
    const vatRate = parseFloat(vat) || 0
    const totalAmount = subtotal * (1 + vatRate / 100)

    // Delete existing items and recreate
    await prisma.orderItem.deleteMany({ where: { orderId: req.params.id } })

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        customerId: customerId || null,
        employeeId: employeeId || null,
        salesRepId: salesRepId || null,
        status: status || 'Processing',
        vat: vatRate,
        totalAmount,
        notes: notes || '',
        shipmentType: shipmentType || '',
        paymentMethod: paymentMethod || '',
        items: {
          create: (items || []).map((item) => ({
            productName: item.productName,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            currency: item.currency || 'USD',
            productId: item.productId || null,
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
