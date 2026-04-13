const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

const QUOTATION_INCLUDE = {
  include: { supplier: { select: { id: true, name: true } } },
  orderBy: { createdAt: 'asc' },
}

// ── Requests ──────────────────────────────────────────────────────────────────
router.get('/requests', async (req, res) => {
  try {
    const requests = await prisma.purchasingRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { quotations: QUOTATION_INCLUDE },
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/requests', async (req, res) => {
  try {
    const { title, description, department, requestedBy, priority, category, estimatedAmount, currency, budgetCode, notes } = req.body
    const code = `PR-${String(Date.now()).slice(-6)}`
    const request = await prisma.purchasingRequest.create({
      data: {
        code,
        title,
        description: description || '',
        department: department || '',
        requestedBy: requestedBy || '',
        priority: priority || 'Medium',
        category: category || 'General',
        estimatedAmount: parseFloat(estimatedAmount) || 0,
        currency: currency || 'TRY',
        budgetCode: budgetCode || '',
        notes: notes || '',
      },
      include: { quotations: QUOTATION_INCLUDE },
    })
    res.json(request)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/requests/:id', async (req, res) => {
  try {
    const data = { ...req.body }
    delete data.id
    delete data.code
    delete data.quotations
    delete data.createdAt
    delete data.updatedAt
    if (data.estimatedAmount !== undefined) data.estimatedAmount = parseFloat(data.estimatedAmount) || 0
    if (data.invoiceAmount !== undefined) data.invoiceAmount = parseFloat(data.invoiceAmount) || 0
    const request = await prisma.purchasingRequest.update({
      where: { id: req.params.id },
      data,
      include: { quotations: QUOTATION_INCLUDE },
    })
    res.json(request)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/requests/:id', async (req, res) => {
  try {
    await prisma.purchasingRequest.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Suppliers ─────────────────────────────────────────────────────────────────
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
    res.json(suppliers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/suppliers', async (req, res) => {
  try {
    const { name, category, contactName, contactPhone, contactEmail, address, country, currency, status, notes } = req.body
    const code = `SUP-${String(Date.now()).slice(-5)}`
    const supplier = await prisma.supplier.create({
      data: {
        code,
        name,
        category: category || 'General',
        contactName: contactName || '',
        contactPhone: contactPhone || '',
        contactEmail: contactEmail || '',
        address: address || '',
        country: country || '',
        currency: currency || 'TRY',
        status: status || 'Active',
        notes: notes || '',
      },
    })
    res.json(supplier)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/suppliers/:id', async (req, res) => {
  try {
    const data = { ...req.body }
    delete data.id
    delete data.code
    delete data.createdAt
    delete data.updatedAt
    delete data.quotations
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data })
    res.json(supplier)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/suppliers/:id', async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Quotations ────────────────────────────────────────────────────────────────
router.post('/requests/:id/quotations', async (req, res) => {
  try {
    const { supplierId, supplierName, quotationNo, quotationDate, amount, currency, vat, deliveryDays, paymentTerms, warranty, notes } = req.body
    const quotation = await prisma.purchasingQuotation.create({
      data: {
        requestId: req.params.id,
        supplierId: supplierId || null,
        supplierName: supplierName || '',
        quotationNo: quotationNo || '',
        quotationDate: quotationDate || null,
        amount: parseFloat(amount) || 0,
        currency: currency || 'TRY',
        vat: parseFloat(vat) || 20,
        deliveryDays: deliveryDays ? parseInt(deliveryDays) : null,
        paymentTerms: paymentTerms || '',
        warranty: warranty || '',
        notes: notes || '',
      },
      include: { supplier: { select: { id: true, name: true } } },
    })
    res.json(quotation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/quotations/:id/select', async (req, res) => {
  try {
    const q = await prisma.purchasingQuotation.findUnique({ where: { id: req.params.id } })
    if (!q) return res.status(404).json({ error: 'Not found' })
    await prisma.purchasingQuotation.updateMany({
      where: { requestId: q.requestId },
      data: { selected: false },
    })
    const updated = await prisma.purchasingQuotation.update({
      where: { id: req.params.id },
      data: { selected: true },
      include: { supplier: { select: { id: true, name: true } } },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/quotations/:id', async (req, res) => {
  try {
    await prisma.purchasingQuotation.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
