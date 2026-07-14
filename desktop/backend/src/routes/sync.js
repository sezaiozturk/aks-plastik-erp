const { Router } = require('express')
const { pullProductsFromVio } = require('../lib/productVioSync')
const { pullCustomersFromVio } = require('../lib/customerVioSync')
const { pullOrdersFromVio } = require('../lib/orderVioSync')

const router = Router()

// POST /api/sync/all
router.post('/all', async (req, res) => {
  try {
    await pullProductsFromVio()
    await pullCustomersFromVio()
    const orders = await pullOrdersFromVio(1)
    res.json({ success: true, ordersSynced: orders.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sync/products
router.post('/products', async (req, res) => {
  try {
    await pullProductsFromVio()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sync/customers
router.post('/customers', async (req, res) => {
  try {
    await pullCustomersFromVio()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sync/orders
router.post('/orders', async (req, res) => {
  try {
    const days = parseInt(req.body.days) || parseInt(req.query.days) || 1
    const orders = await pullOrdersFromVio(days)
    res.json({ success: true, count: orders.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
