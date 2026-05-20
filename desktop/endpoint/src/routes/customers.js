const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

function makeInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

function makeCode() {
  return `CX-${String(Date.now()).slice(-6)}`
}

// GET /api/endpoint/customers
// Optional query: ?code=CX-123 | ?taxId=1234567890
router.get('/', async (req, res) => {
  try {
    const { code, taxId } = req.query
    const where = {}
    if (code)  where.code  = code
    if (taxId) where.taxId = taxId

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ count: customers.length, data: customers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/endpoint/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { orders: { select: { id: true, code: true, status: true, totalAmount: true, createdAt: true } } },
    })
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    res.json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/endpoint/customers
// Body: { name, taxId, taxOffice, address, city, district, postalCode, country, phone, email,
//         contactName, contactPhone, contactEmail }
router.post('/', async (req, res) => {
  try {
    const {
      name, taxId, taxOffice,
      address, city, district, postalCode, country,
      phone, email,
      contactName, contactPhone, contactEmail,
    } = req.body

    if (!name) return res.status(400).json({ error: '"name" is required' })

    const customer = await prisma.customer.create({
      data: {
        code:         makeCode(),
        name,
        initials:     makeInitials(name),
        region:       [city, postalCode].filter(Boolean).join(', '),
        taxId:        taxId     || null,
        taxOffice:    taxOffice || null,
        address:      address   || null,
        city:         city      || null,
        district:     district  || null,
        postalCode:   postalCode || null,
        country:      country   || null,
        phone:        phone     || null,
        email:        email     || null,
        contactName:  contactName  || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
      },
    })
    res.status(201).json(customer)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Duplicate code or unique field conflict' })
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/endpoint/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      name, taxId, taxOffice,
      address, city, district, postalCode, country,
      phone, email,
      contactName, contactPhone, contactEmail,
    } = req.body

    const data = {}
    if (name !== undefined)         { data.name = name; data.initials = makeInitials(name) }
    if (taxId !== undefined)        data.taxId        = taxId
    if (taxOffice !== undefined)    data.taxOffice    = taxOffice
    if (address !== undefined)      data.address      = address
    if (city !== undefined)         data.city         = city
    if (district !== undefined)     data.district     = district
    if (postalCode !== undefined)   data.postalCode   = postalCode
    if (country !== undefined)      data.country      = country
    if (phone !== undefined)        data.phone        = phone
    if (email !== undefined)        data.email        = email
    if (contactName !== undefined)  data.contactName  = contactName
    if (contactPhone !== undefined) data.contactPhone = contactPhone
    if (contactEmail !== undefined) data.contactEmail = contactEmail
    if (data.city || data.postalCode) {
      data.region = [data.city, data.postalCode].filter(Boolean).join(', ')
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data,
    })
    res.json(customer)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Customer not found' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
