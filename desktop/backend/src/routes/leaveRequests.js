const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

// GET leave requests — if employeeId query param given, filter by it
// If supervisorId query param given, return requests of NON-MANAGER subordinates
// (manager requests are admin-only and excluded from supervisor view)
router.get('/', async (req, res) => {
  try {
    const { employeeId, supervisorId } = req.query

    let where = {}
    if (employeeId) {
      where.employeeId = employeeId
    } else if (supervisorId) {
      // Find non-manager employees supervised by this person
      // Managers' requests go to admin only, not to their supervisor
      const subordinates = await prisma.employee.findMany({
        where: { supervisorId, isManager: false },
        select: { id: true },
      })
      where.employeeId = { in: subordinates.map((s) => s.id) }
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: { employee: { select: { id: true, name: true, initials: true, department: true, isManager: true } } },
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
      include: { employee: { select: { id: true, name: true, initials: true, department: true, isManager: true } } },
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
      include: { employee: { select: { id: true, name: true, initials: true, department: true, isManager: true } } },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH — approve or reject (supervisor / admin)
// Rule: if the employee who made the request is a manager, only admin can review
router.patch('/:id/review', async (req, res) => {
  try {
    const { status } = req.body
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected' })
    }

    // Fetch the request along with the employee's manager flag
    const existing = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
      include: { employee: { select: { isManager: true } } },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    // Manager's requests can only be approved/rejected by admin
    if (existing.employee.isManager && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can review leave requests submitted by managers' })
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: req.user.name,
      },
      include: { employee: { select: { id: true, name: true, initials: true, department: true, isManager: true } } },
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
