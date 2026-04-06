const { Router } = require('express')
const { authenticate } = require('../middleware/auth')

const router = Router()

// POST /api/proxy — forwards a GET request on behalf of the client (bypasses CORS)
router.post('/', authenticate, async (req, res) => {
  const { url, headers = {}, method = 'GET', body } = req.body

  if (!url) return res.status(400).json({ error: 'url is required' })

  // Only allow http/https
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Only http/https URLs are allowed' })
  }

  try {
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: { 'Content-Type': 'application/json', ...headers },
    }
    if (body && method.toUpperCase() !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    const start = Date.now()
    const upstream = await fetch(url, fetchOptions)
    const elapsed = Date.now() - start

    const contentType = upstream.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await upstream.json()
    } else {
      data = await upstream.text()
    }

    res.json({
      status: upstream.status,
      statusText: upstream.statusText,
      elapsed,
      contentType,
      data,
    })
  } catch (err) {
    res.status(502).json({ error: `Request failed: ${err.message}` })
  }
})

module.exports = router
