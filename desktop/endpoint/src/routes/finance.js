const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

function makeCode() {
  return `FIN-${String(Date.now()).slice(-6)}`
}

// GET /api/endpoint/finance
// Optional query: ?type=income|expense | ?category=Sales Revenue | ?orderId=xxx
router.get('/', async (req, res) => {
  try {
    const { type, category, orderId } = req.query
    const where = {}
    if (type)     where.type     = type
    if (category) where.category = category
    if (orderId)  where.orderId  = orderId

    const records = await prisma.financeRecord.findMany({
      where,
      include: { order: { select: { id: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ count: records.length, data: records })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/endpoint/finance/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await prisma.financeRecord.findUnique({
      where: { id: req.params.id },
      include: { order: { select: { id: true, code: true } } },
    })
    if (!record) return res.status(404).json({ error: 'Finance record not found' })
    res.json(record)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/endpoint/finance
// Body: { type, category, amount, currency, date, reference, description, orderId }
router.post('/', async (req, res) => {
  try {
    const { type, category, amount, currency, date, reference, description, orderId } = req.body

    if (!type)   return res.status(400).json({ error: '"type" is required (income | expense)' })
    if (!amount) return res.status(400).json({ error: '"amount" is required' })
    if (!date)   return res.status(400).json({ error: '"date" is required (YYYY-MM-DD)' })

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: '"type" must be "income" or "expense"' })
    }

    const record = await prisma.financeRecord.create({
      data: {
        code:        makeCode(),
        type,
        category:    category    || 'General',
        amount:      parseFloat(amount),
        currency:    currency    || 'USD',
        date,
        reference:   reference   || '',
        description: description || '',
        orderId:     orderId     || null,
      },
    })
    res.status(201).json(record)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Duplicate code' })
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/endpoint/finance/:id
router.put('/:id', async (req, res) => {
  try {
    const { type, category, amount, currency, date, reference, description, orderId } = req.body

    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: '"type" must be "income" or "expense"' })
    }

    const data = {}
    if (type        !== undefined) data.type        = type
    if (category    !== undefined) data.category    = category
    if (amount      !== undefined) data.amount      = parseFloat(amount)
    if (currency    !== undefined) data.currency    = currency
    if (date        !== undefined) data.date        = date
    if (reference   !== undefined) data.reference   = reference
    if (description !== undefined) data.description = description
    if (orderId     !== undefined) data.orderId     = orderId

    const record = await prisma.financeRecord.update({
      where: { id: req.params.id },
      data,
    })
    res.json(record)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Finance record not found' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
