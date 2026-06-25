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

function buildCustomerData(body) {
  const {
    // Identity
    companyName, customerType, fullName,
    taxId, taxOffice, ticaretSicil, mersisNo,
    bolge, cariTip, istatistikGrup, mukellefTipi,
    // Contact
    contactName, contactPhone, contactEmail,
    contactPersonPhone, contactPersonEmail,
    contactNamePurchasing, contactPersonPhonePurchasing, contactPersonEmailPurchasing,
    contactPosition,
    // Address
    address, city, district, postalCode, country, phone, email,
    latitude, longitude,
    // Tax & e-Documents
    eInvoiceStatus, eArchiveStatus, eDispatchStatus, invoiceScenario,
    // Financial
    accountCode, accountType, currency, paymentTerm, creditLimit,
    // Bank
    bankName, iban, branchCode, accountHolder,
    // Invoicing & Payment
    invoiceType, paymentMethod, paymentTerms,
    // Optional
    industry, customerCategory, salesRepName, notes, gdprConsent,
  } = body

  const name = customerType === 'Individual' ? fullName : companyName
  const initials = (name || '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')

  return {
    name: name || '',
    initials,
    customerType: customerType || 'Company',
    fullName: fullName || null,
    taxId: taxId || null,
    taxOffice: taxOffice || null,
    ticaretSicil: ticaretSicil || null,
    mersisNo: mersisNo || null,
    bolge: bolge || null,
    cariTip: cariTip || null,
    istatistikGrup: istatistikGrup || null,
    mukellefTipi: mukellefTipi || null,
    contactName: contactName || null,
    contactPhone: contactPhone || null,
    contactEmail: contactEmail || null,
    contactPersonPhone: contactPersonPhone || null,
    contactPersonEmail: contactPersonEmail || null,
    contactNamePurchasing: contactNamePurchasing || null,
    contactPersonPhonePurchasing: contactPersonPhonePurchasing || null,
    contactPersonEmailPurchasing: contactPersonEmailPurchasing || null,
    contactPosition: contactPosition || null,
    region: city && postalCode ? `${city}, ${postalCode}` : city || '',
    address: address || null,
    city: city || null,
    district: district || null,
    postalCode: postalCode || null,
    country: country || null,
    phone: phone || null,
    email: email || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    eInvoiceStatus: !!eInvoiceStatus,
    eArchiveStatus: !!eArchiveStatus,
    eDispatchStatus: !!eDispatchStatus,
    invoiceScenario: invoiceScenario || 'Basic',
    accountCode: accountCode || null,
    accountType: accountType || 'Customer',
    currency: currency || 'TRY',
    paymentTerm: paymentTerm || null,
    creditLimit: creditLimit != null && creditLimit !== '' ? parseFloat(creditLimit) : null,
    bankName: bankName || null,
    iban: iban || null,
    branchCode: branchCode || null,
    accountHolder: accountHolder || null,
    invoiceType: invoiceType || null,
    paymentMethod: paymentMethod || null,
    paymentTerms: paymentTerms || null,
    industry: industry || null,
    customerCategory: customerCategory || null,
    salesRepName: salesRepName || null,
    notes: notes || null,
    gdprConsent: !!gdprConsent,
  }
}

// POST create customer
router.post('/', async (req, res) => {
  try {
    const code = `CX-${String(Date.now()).slice(-4)}`
    const customer = await prisma.customer.create({
      data: { code, ...buildCustomerData(req.body) },
    })
    res.status(201).json(customer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: buildCustomerData(req.body),
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
