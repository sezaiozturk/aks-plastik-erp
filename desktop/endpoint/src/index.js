require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { apiKeyAuth } = require('./middleware/apiKeyAuth')

const customersRouter = require('./routes/customers')
const productsRouter  = require('./routes/products')
const ordersRouter    = require('./routes/orders')
const financeRouter   = require('./routes/finance')
const syncRouter      = require('./routes/sync')

const app  = express()
const PORT = process.env.PORT || 3002

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

// Rate limit: 200 requests per minute per IP
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }))

// Health check — no auth required
app.get('/api/endpoint/health', (req, res) => {
  res.json({ status: 'ok', server: 'AKS ERP Endpoint', ts: new Date().toISOString() })
})

// All routes below require a valid x-api-key header
app.use('/api/endpoint', apiKeyAuth)

app.use('/api/endpoint/customers', customersRouter)
app.use('/api/endpoint/products',  productsRouter)
app.use('/api/endpoint/orders',    ordersRouter)
app.use('/api/endpoint/finance',   financeRouter)
app.use('/api/endpoint/sync',      syncRouter)

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

app.listen(PORT, () => {
  console.log(`AKS ERP Endpoint API running on http://localhost:${PORT}`)
  console.log('Routes:')
  console.log(`  GET/POST/PUT  /api/endpoint/customers`)
  console.log(`  GET/POST/PUT  /api/endpoint/products`)
  console.log(`  GET/POST/PUT  /api/endpoint/orders`)
  console.log(`  GET/POST/PUT  /api/endpoint/finance`)
  console.log(`  POST          /api/endpoint/sync/customers          ← sync all from ext. ERP`)
  console.log(`  POST          /api/endpoint/sync/customers/:erpId   ← sync one from ext. ERP`)
})
