const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

function buildCustomerData(body) {
  const {
    // Identity
    customerType = 'Company', fullName, companyName,
    taxId, taxOffice, country,
    // Address
    address, city, district, postalCode, phone, email,
    // Tax & Docs
    eInvoiceStatus, eArchiveStatus, eDispatchStatus,
    invoiceScenario = 'Basic',
    // Financial
    accountCode, accountType = 'Customer', currency = 'TRY',
    paymentTerm, creditLimit,
    // Bank
    bankName, iban, branchCode, accountHolder,
    // Invoicing & Payment
    invoiceType, paymentMethod, paymentTerms,
    // Contact
    contactName, contactPhone, contactEmail, contactPosition,
    // Optional
    industry, customerCategory, salesRepName, notes, gdprConsent,
    // Legacy geo
    latitude, longitude,
  } = body

  const name = customerType === 'Individual' ? (fullName || '') : (companyName || '')
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return {
    name,
    initials,
    customerType,
    fullName: fullName || null,
    taxId: taxId || null,
    taxOffice: taxOffice || null,
    country: country || null,
    address: address || null,
    city: city || null,
    district: district || null,
    postalCode: postalCode || null,
    phone: phone || null,
    email: email || null,
    region: city && postalCode ? `${city}, ${postalCode}` : city || '',
    eInvoiceStatus: !!eInvoiceStatus,
    eArchiveStatus: !!eArchiveStatus,
    eDispatchStatus: !!eDispatchStatus,
    invoiceScenario: invoiceScenario || 'Basic',
    accountCode: accountCode || null,
    accountType: accountType || 'Customer',
    currency: currency || 'TRY',
    paymentTerm: paymentTerm || null,
    creditLimit: creditLimit ? parseFloat(creditLimit) : null,
    bankName: bankName || null,
    iban: iban || null,
    branchCode: branchCode || null,
    accountHolder: accountHolder || null,
    invoiceType: invoiceType || null,
    paymentMethod: paymentMethod || null,
    paymentTerms: paymentTerms || null,
    contactName: contactName || null,
    contactPhone: contactPhone || null,
    contactEmail: contactEmail || null,
    contactPosition: contactPosition || null,
    industry: industry || null,
    customerCategory: customerCategory || null,
    salesRepName: salesRepName || null,
    notes: notes || null,
    gdprConsent: !!gdprConsent,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  }
}

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
    const data = buildCustomerData(req.body)
    const code = `CX-${String(Date.now()).slice(-6)}`
    const customer = await prisma.customer.create({ data: { code, ...data } })
    res.status(201).json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const data = buildCustomerData(req.body)
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data,
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
