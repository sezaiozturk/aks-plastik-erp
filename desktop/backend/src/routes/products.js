const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, stockNo, description, category, unit, currency, price, stock, minStock } = req.body
    const code = `PRD-${String(Date.now()).slice(-5)}`
    const product = await prisma.product.create({
      data: {
        code,
        stockNo: stockNo || '',
        name,
        description: description || '',
        category: category || 'General',
        unit: unit || 'pcs',
        currency: currency || 'USD',
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
      },
    })
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, stockNo, description, category, unit, currency, price, stock, minStock } = req.body
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        stockNo: stockNo || '',
        name,
        description: description || '',
        category: category || 'General',
        unit: unit || 'pcs',
        currency: currency || 'USD',
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
      },
    })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
