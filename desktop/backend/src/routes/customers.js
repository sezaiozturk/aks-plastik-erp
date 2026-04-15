const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

// GET all customers
router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(customers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { reports: true, siteVisits: true },
    })
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    res.json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create customer
router.post('/', async (req, res) => {
  try {
    const { companyName, address, city, postalCode, country, phone, email, contactName, contactPhone, contactEmail, latitude, longitude } = req.body
    const initials = companyName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')
    const code = `CX-${String(Date.now()).slice(-4)}`

    const customer = await prisma.customer.create({
      data: {
        code,
        name: companyName,
        initials,
        region: city && postalCode ? `${city}, ${postalCode}` : city || '',
        address,
        city,
        postalCode,
        country,
        phone,
        email,
        contactName,
        contactPhone,
        contactEmail,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    })
    res.status(201).json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { companyName, address, city, postalCode, country, phone, email, contactName, contactPhone, contactEmail, latitude, longitude } = req.body
    const initials = companyName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name: companyName,
        initials,
        region: city && postalCode ? `${city}, ${postalCode}` : city || '',
        address,
        city,
        postalCode,
        country,
        phone,
        email,
        contactName,
        contactPhone,
        contactEmail,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    })
    res.json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE customer (admin only)
router.delete('/:id', (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}, async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
