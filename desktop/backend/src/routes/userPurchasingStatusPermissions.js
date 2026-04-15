const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}

// GET /api/user-purchasing-status-permissions — returns { userId: [status1, status2, ...] }
router.get('/', async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`SELECT "userId", "status" FROM "UserPurchasingStatusPermission"`
    const map = {}
    rows.forEach(({ userId, status }) => {
      if (!map[userId]) map[userId] = []
      map[userId].push(status)
    })
    res.json(map)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/user-purchasing-status-permissions/:userId — replace all statuses for a user
router.put('/:userId', adminOnly, async (req, res) => {
  try {
    const { userId } = req.params
    const { statuses } = req.body
    await prisma.$executeRaw`DELETE FROM "UserPurchasingStatusPermission" WHERE "userId" = ${userId}`
    if (statuses?.length) {
      for (const status of statuses) {
        await prisma.$executeRaw`
          INSERT INTO "UserPurchasingStatusPermission" ("userId", "status")
          VALUES (${userId}, ${status})
          ON CONFLICT ("userId", "status") DO NOTHING
        `
      }
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
