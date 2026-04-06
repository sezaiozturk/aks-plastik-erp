const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

router.get('/', async (req, res) => {
  try {
    const records = await prisma.financeRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { id: true, code: true } } },
    })
    res.json(records)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const record = await prisma.financeRecord.findUnique({
      where: { id: req.params.id },
      include: { order: true },
    })
    if (!record) return res.status(404).json({ error: 'Record not found' })
    res.json(record)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { type, category, amount, currency, date, reference, description, orderId } = req.body
    const code = `FIN-${String(Date.now()).slice(-6)}`
    const record = await prisma.financeRecord.create({
      data: {
        code,
        type,
        category: category || 'General',
        amount: parseFloat(amount) || 0,
        currency: currency || 'USD',
        date,
        reference: reference || '',
        description: description || '',
        orderId: orderId || null,
      },
      include: { order: { select: { id: true, code: true } } },
    })
    res.status(201).json(record)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { type, category, amount, currency, date, reference, description, orderId } = req.body
    const record = await prisma.financeRecord.update({
      where: { id: req.params.id },
      data: {
        type,
        category: category || 'General',
        amount: parseFloat(amount) || 0,
        currency: currency || 'USD',
        date,
        reference: reference || '',
        description: description || '',
        orderId: orderId || null,
      },
      include: { order: { select: { id: true, code: true } } },
    })
    res.json(record)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}, async (req, res) => {
  try {
    await prisma.financeRecord.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
