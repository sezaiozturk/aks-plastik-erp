const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

// GET attendance records for an employee (query: ?employeeId=xxx&month=2026-04)
router.get('/', async (req, res) => {
  try {
    const { employeeId, month } = req.query
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' })

    const where = { employeeId }
    if (month) {
      where.date = { startsWith: month }
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    res.json(records)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST / PUT — upsert attendance for a date
router.post('/', async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, notes } = req.body
    if (!employeeId || !date) return res.status(400).json({ error: 'employeeId and date required' })

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      update: { checkIn: checkIn || null, checkOut: checkOut || null, notes: notes || '' },
      create: { employeeId, date, checkIn: checkIn || null, checkOut: checkOut || null, notes: notes || '' },
    })
    res.json(record)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
