const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const { authenticate, adminOnly, JWT_SECRET } = require('../middleware/auth')

const prisma = new PrismaClient()
const router = Router()

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// POST login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department || null, employeeId: user.employeeId || null },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department || null, employeeId: user.employeeId || null },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST forgot password — sends reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid revealing whether email exists
    if (!user) return res.json({ success: true })

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Invalidate any existing tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    })

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    // Send reset email
    const resetCode = token.slice(0, 8).toUpperCase()
    try {
      await smtpTransport.sendMail({
        from: process.env.SMTP_FROM || 'Plan-S Field Hub <no-reply@fieldhub.com>',
        to: user.email,
        subject: 'Password Reset — Plan-S Field Hub',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password. Use the code below to set a new password:</p>
            <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${resetCode}</span>
            </div>
            <p>This code expires in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #888; font-size: 12px; margin-top: 32px;">Plan-S Field Hub</p>
          </div>
        `,
      })
    } catch (mailErr) {
      console.warn('SMTP send failed, logging reset code to console instead.')
      console.log(`[PASSWORD RESET] Code for ${user.email}: ${resetCode}`)
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Failed to process request. Please try again.' })
  }
})

// POST reset password — verifies code and sets new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ error: 'Invalid reset code' })

    // Find a valid, unused token that starts with the provided code
    const tokens = await prisma.passwordResetToken.findMany({
      where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    const matched = tokens.find(
      (t) => t.token.slice(0, 8).toUpperCase() === code.toUpperCase()
    )

    if (!matched) {
      return res.status(400).json({ error: 'Invalid or expired reset code' })
    }

    // Mark token as used and update password
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: matched.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      }),
    ])

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET current user
router.get('/me', authenticate, async (req, res) => {
  res.json(req.user)
})

// PATCH change own password
router.patch('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET sales team users (any authenticated user — used for order sales rep dropdown)
router.get('/salesteam', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { department: { contains: 'sales', mode: 'insensitive' } },
      select: { id: true, name: true, department: true },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET all users (admin only)
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, phone: true, role: true, department: true, employeeId: true, createdAt: true },
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create user (admin only)
router.post('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const { email, password, name, phone, role, department, employeeId } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already exists' })

    if (employeeId) {
      const taken = await prisma.user.findUnique({ where: { employeeId } })
      if (taken) return res.status(400).json({ error: 'This employee already has a user account' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        phone: phone || null,
        role: role || 'user',
        department: role === 'user' ? (department || null) : null,
        employeeId: employeeId || null,
      },
      select: { id: true, email: true, name: true, phone: true, role: true, department: true, employeeId: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update user (admin only)
router.put('/users/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, role, password, department } = req.body
    const data = { name, email, phone: phone || null, role, department: role === 'user' ? (department || null) : null }
    if (password && password.length >= 6) {
      data.password = await bcrypt.hash(password, 10)
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true, department: true, employeeId: true, createdAt: true },
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE user (admin only)
router.delete('/users/:id', authenticate, adminOnly, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
