const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

function makeCode() {
  return `ORD-${String(Date.now()).slice(-6)}`
}

// GET /api/endpoint/orders
// Optional query: ?status=Draft | ?customerId=xxx
router.get('/', async (req, res) => {
  try {
    const { status, customerId } = req.query
    const where = {}
    if (status)     where.status     = status
    if (customerId) where.customerId = customerId

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        items: { include: { product: { select: { id: true, name: true, unit: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ count: orders.length, data: orders })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/endpoint/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        items: { include: { product: { select: { id: true, name: true, unit: true } } } },
      },
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/endpoint/orders
// Body: {
//   customerId, status, vat, notes, shipmentType, paymentMethod,
//   items: [{ productId, productName, quantity, unitPrice, currency, vat }]
// }
router.post('/', async (req, res) => {
  try {
    const {
      customerId, status, vat, notes, shipmentType, paymentMethod, items = [],
    } = req.body

    const totalAmount = items.reduce((sum, item) => {
      const base = (item.unitPrice || 0) * (item.quantity || 1)
      return sum + base + (base * ((item.vat || 0) / 100))
    }, 0)

    const order = await prisma.order.create({
      data: {
        code:          makeCode(),
        status:        status        || 'Draft',
        vat:           vat           != null ? parseFloat(vat) : 0,
        totalAmount,
        notes:         notes         || '',
        shipmentType:  shipmentType  || '',
        paymentMethod: paymentMethod || '',
        customerId:    customerId    || null,
        items: {
          create: items.map(item => ({
            productName: item.productName || '',
            quantity:    item.quantity    != null ? parseInt(item.quantity)    : 1,
            unitPrice:   item.unitPrice   != null ? parseFloat(item.unitPrice) : 0,
            currency:    item.currency    || 'USD',
            vat:         item.vat         != null ? parseFloat(item.vat)       : 0,
            productId:   item.productId   || null,
          })),
        },
      },
      include: {
        items: true,
        customer: { select: { id: true, name: true } },
      },
    })
    res.status(201).json(order)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Duplicate code' })
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/endpoint/orders/:id
// Updates header fields only. To update items, delete and re-POST.
router.put('/:id', async (req, res) => {
  try {
    const { status, vat, notes, shipmentType, paymentMethod, customerId } = req.body

    const data = {}
    if (status        !== undefined) data.status        = status
    if (vat           !== undefined) data.vat           = parseFloat(vat)
    if (notes         !== undefined) data.notes         = notes
    if (shipmentType  !== undefined) data.shipmentType  = shipmentType
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod
    if (customerId    !== undefined) data.customerId    = customerId

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: { items: true, customer: { select: { id: true, name: true } } },
    })
    res.json(order)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Order not found' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
