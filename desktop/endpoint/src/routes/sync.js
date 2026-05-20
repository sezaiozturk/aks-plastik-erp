const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')
const { getCustomers, getCustomerById } = require('../services/erpClient')
const { mapErpCustomer } = require('../services/customerMapper')

const prisma = new PrismaClient()
const router = Router()

function makeInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

function makeCode() {
  return `CX-${String(Date.now()).slice(-6)}`
}

// ── POST /api/endpoint/sync/customers ────────────────────────────────────────
// Fetches all customers from the external ERP and upserts them into AKS.
// Optional body: { params: { ... } }  — forwarded as query params to the ERP.
// Returns a summary: { fetched, created, updated, skipped, errors }
router.post('/customers', async (req, res) => {
  const summary = { fetched: 0, created: 0, updated: 0, skipped: 0, errors: [] }

  try {
    const erpParams = req.body?.params || {}
    const rawData   = await getCustomers(erpParams)

    // Support both array and { data: [] } response shapes from the other ERP
    const records = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)   ? rawData.data
      : Array.isArray(rawData?.items)  ? rawData.items
      : Array.isArray(rawData?.result) ? rawData.result
      : []

    summary.fetched = records.length

    for (const erpRecord of records) {
      try {
        const mapped = mapErpCustomer(erpRecord)

        if (!mapped.name || mapped.name === 'Unknown') {
          summary.skipped++
          summary.errors.push({ erpId: mapped.erpId, reason: 'Missing name — skipped' })
          continue
        }

        // Try to match an existing customer by taxId, then by erpId stored in contact field, then by name
        let existing = null
        if (mapped.taxId) {
          existing = await prisma.customer.findFirst({ where: { taxId: mapped.taxId } })
        }
        if (!existing && mapped.erpId) {
          existing = await prisma.customer.findFirst({ where: { contact: mapped.erpId } })
        }

        if (existing) {
          // Update
          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              name:          mapped.name,
              initials:      makeInitials(mapped.name),
              region:        [mapped.city, mapped.postalCode].filter(Boolean).join(', '),
              taxId:         mapped.taxId,
              taxOffice:     mapped.taxOffice,
              address:       mapped.address,
              city:          mapped.city,
              district:      mapped.district,
              postalCode:    mapped.postalCode,
              country:       mapped.country,
              phone:         mapped.phone,
              email:         mapped.email,
              contactName:   mapped.contactName,
              contactPhone:  mapped.contactPhone,
              contactEmail:  mapped.contactEmail,
            },
          })
          summary.updated++
        } else {
          // Create
          await prisma.customer.create({
            data: {
              code:         makeCode() + `-${Math.floor(Math.random() * 900 + 100)}`,
              name:         mapped.name,
              initials:     makeInitials(mapped.name),
              contact:      mapped.erpId || '—',   // store ERP id for future matching
              region:       [mapped.city, mapped.postalCode].filter(Boolean).join(', '),
              taxId:        mapped.taxId,
              taxOffice:    mapped.taxOffice,
              address:      mapped.address,
              city:         mapped.city,
              district:     mapped.district,
              postalCode:   mapped.postalCode,
              country:      mapped.country,
              phone:        mapped.phone,
              email:        mapped.email,
              contactName:  mapped.contactName,
              contactPhone: mapped.contactPhone,
              contactEmail: mapped.contactEmail,
            },
          })
          summary.created++
        }
      } catch (rowErr) {
        summary.errors.push({ erpId: erpRecord?.id, reason: rowErr.message })
      }
    }

    res.json({ ok: true, summary })
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: 'Failed to reach the external ERP',
      detail: err.message,
      summary,
    })
  }
})

// ── POST /api/endpoint/sync/customers/:erpId ─────────────────────────────────
// Fetch a single customer by the other ERP's ID and upsert it.
router.post('/customers/:erpId', async (req, res) => {
  try {
    const erpRecord = await getCustomerById(req.params.erpId)
    const mapped    = mapErpCustomer(erpRecord)

    if (!mapped.name || mapped.name === 'Unknown') {
      return res.status(400).json({ ok: false, error: 'Customer has no usable name field' })
    }

    let existing = null
    if (mapped.taxId) {
      existing = await prisma.customer.findFirst({ where: { taxId: mapped.taxId } })
    }
    if (!existing && mapped.erpId) {
      existing = await prisma.customer.findFirst({ where: { contact: mapped.erpId } })
    }

    if (existing) {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name:         mapped.name,
          initials:     makeInitials(mapped.name),
          region:       [mapped.city, mapped.postalCode].filter(Boolean).join(', '),
          taxId:        mapped.taxId,
          taxOffice:    mapped.taxOffice,
          address:      mapped.address,
          city:         mapped.city,
          district:     mapped.district,
          postalCode:   mapped.postalCode,
          country:      mapped.country,
          phone:        mapped.phone,
          email:        mapped.email,
          contactName:  mapped.contactName,
          contactPhone: mapped.contactPhone,
          contactEmail: mapped.contactEmail,
        },
      })
      return res.json({ ok: true, action: 'updated', customer: updated })
    }

    const created = await prisma.customer.create({
      data: {
        code:         makeCode() + `-${Math.floor(Math.random() * 900 + 100)}`,
        name:         mapped.name,
        initials:     makeInitials(mapped.name),
        contact:      mapped.erpId || '—',
        region:       [mapped.city, mapped.postalCode].filter(Boolean).join(', '),
        taxId:        mapped.taxId,
        taxOffice:    mapped.taxOffice,
        address:      mapped.address,
        city:         mapped.city,
        district:     mapped.district,
        postalCode:   mapped.postalCode,
        country:      mapped.country,
        phone:        mapped.phone,
        email:        mapped.email,
        contactName:  mapped.contactName,
        contactPhone: mapped.contactPhone,
        contactEmail: mapped.contactEmail,
      },
    })
    res.status(201).json({ ok: true, action: 'created', customer: created })
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Failed to reach the external ERP', detail: err.message })
  }
})

module.exports = router
