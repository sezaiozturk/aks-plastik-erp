const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: { supervisor: { select: { id: true, name: true } } },
    })
    res.json(employees)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } })
    if (!employee) return res.status(404).json({ error: 'Employee not found' })
    res.json(employee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /employees/setmanager — set one employee as dept manager, clear others
router.post('/setmanager', async (req, res) => {
  try {
    const { employeeId, department } = req.body
    if (!employeeId || !department) return res.status(400).json({ error: 'employeeId and department are required' })
    await prisma.employee.updateMany({ where: { department }, data: { isManager: false } })
    await prisma.employee.update({ where: { id: employeeId }, data: { isManager: true } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, department, position, phone, email, salary, status, hireDate, supervisorId } = req.body
    const code = `EMP-${String(Date.now()).slice(-5)}`
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')
    const employee = await prisma.employee.create({
      data: {
        code,
        name,
        initials,
        department: department || 'General',
        position: position || '',
        phone: phone || null,
        email: email || null,
        salary: parseFloat(salary) || 0,
        status: status || 'Active',
        hireDate: hireDate || null,
        supervisorId: supervisorId || null,
        isManager: false,
      },
      include: { supervisor: { select: { id: true, name: true } } },
    })
    res.status(201).json(employee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, department, position, phone, email, salary, status, hireDate, supervisorId } = req.body
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        name,
        initials,
        department: department || 'General',
        position: position || '',
        phone: phone || null,
        email: email || null,
        salary: parseFloat(salary) || 0,
        status: status || 'Active',
        hireDate: hireDate || null,
        supervisorId: supervisorId || null,
      },
      include: { supervisor: { select: { id: true, name: true } } },
    })
    res.json(employee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}, async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
