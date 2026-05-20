const { Router } = require('express')

const router = Router()

// POST /api/sync/customers
// Called by the frontend on startup. Triggers the endpoint server to pull
// customers from the external ERP and upsert them into the database.
// Fails silently if the endpoint server or external ERP is unreachable.
router.post('/customers', async (req, res) => {
  const endpointUrl = process.env.ENDPOINT_URL   || 'http://localhost:3002'
  const apiKey      = process.env.ENDPOINT_API_KEY || ''

  try {
    const response = await fetch(`${endpointUrl}/api/endpoint/sync/customers`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    apiKey,
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(20000),
    })

    const data = await response.json()
    res.json(data)
  } catch (err) {
    // Endpoint server may not be running — return ok so the app still loads
    res.json({ ok: false, skipped: true, reason: err.message })
  }
})

module.exports = router
