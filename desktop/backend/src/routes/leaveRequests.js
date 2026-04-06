const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

// GET leave requests — if employeeId query param given, filter by it
// If supervisorId query param given, return requests of subordinates
router.get('/', async (req, res) => {
  try {
    const { employeeId, supervisorId } = req.query

    let where = {}
    if (employeeId) {
      where.employeeId = employeeId
    } else if (supervisorId) {
      // Find all employees supervised by this person
      const subordinates = await prisma.employee.findMany({
        where: { supervisorId },
        select: { id: true },
      })
      where.employeeId = { in: subordinates.map((s) => s.id) }
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: { employee: { select: { id: true, name: true, initials: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST — create leave request
router.post('/', async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, days, reason } = req.body
    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({ error: 'employeeId, startDate, endDate required' })
    }

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type: type || 'Annual',
        startDate,
        endDate,
        days: days || 1,
        reason: reason || '',
        status: 'Pending',
      },
      include: { employee: { select: { id: true, name: true, initials: true, department: true } } },
    })
    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT — update leave request (only if Pending)
router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot edit a reviewed request' })
    }

    const { type, startDate, endDate, days, reason } = req.body
    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        type: type || existing.type,
        startDate: startDate || existing.startDate,
        endDate: endDate || existing.endDate,
        days: days ?? existing.days,
        reason: reason ?? existing.reason,
      },
      include: { employee: { select: { id: true, name: true, initials: true, department: true } } },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH — approve or reject (supervisor / admin)
router.patch('/:id/review', async (req, res) => {
  try {
    const { status } = req.body
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected' })
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status, reviewedAt: new Date() },
      include: { employee: { select: { id: true, name: true, initials: true, department: true } } },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE — only if Pending
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot delete a reviewed request' })
    }
    await prisma.leaveRequest.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
