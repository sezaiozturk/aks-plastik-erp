const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

function makeCode() {
  return `PR-${String(Date.now()).slice(-6)}`
}

// GET /api/endpoint/products
// Optional query: ?code=PR-123 | ?category=General
router.get('/', async (req, res) => {
  try {
    const { code, category } = req.query
    const where = {}
    if (code)     where.code     = code
    if (category) where.category = category

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ count: products.length, data: products })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/endpoint/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/endpoint/products
// Body: { name, description, category, unit, currency, price, stock, minStock, stockNo }
router.post('/', async (req, res) => {
  try {
    const { name, description, category, unit, currency, price, stock, minStock, stockNo } = req.body
    if (!name) return res.status(400).json({ error: '"name" is required' })

    const product = await prisma.product.create({
      data: {
        code:        makeCode(),
        name,
        stockNo:     stockNo     || '',
        description: description || '',
        category:    category    || 'General',
        unit:        unit        || 'pcs',
        currency:    currency    || 'USD',
        price:       price       != null ? parseFloat(price) : 0,
        stock:       stock       != null ? parseInt(stock)   : 0,
        minStock:    minStock    != null ? parseInt(minStock) : 0,
      },
    })
    res.status(201).json(product)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Duplicate code or unique field conflict' })
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/endpoint/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, description, category, unit, currency, price, stock, minStock, stockNo } = req.body

    const data = {}
    if (name        !== undefined) data.name        = name
    if (stockNo     !== undefined) data.stockNo     = stockNo
    if (description !== undefined) data.description = description
    if (category    !== undefined) data.category    = category
    if (unit        !== undefined) data.unit        = unit
    if (currency    !== undefined) data.currency    = currency
    if (price       !== undefined) data.price       = parseFloat(price)
    if (stock       !== undefined) data.stock       = parseInt(stock)
    if (minStock    !== undefined) data.minStock    = parseInt(minStock)

    const product = await prisma.product.update({ where: { id: req.params.id }, data })
    res.json(product)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Product not found' })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
