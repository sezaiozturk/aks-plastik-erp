require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { authenticate } = require('./middleware/auth')

const authRoutes = require('./routes/auth')
const customerRoutes = require('./routes/customers')
const reportRoutes = require('./routes/reports')
const siteVisitRoutes = require('./routes/siteVisits')
const productRoutes = require('./routes/products')
const employeeRoutes = require('./routes/employees')
const orderRoutes = require('./routes/orders')
const financeRoutes = require('./routes/finance')
const roleRoutes = require('./routes/roles')
const permissionRoutes = require('./routes/permissions')
const machineRoutes = require('./routes/machines')
const statusPermissionRoutes = require('./routes/statusPermissions')
const attendanceRoutes = require('./routes/attendance')
const leaveRequestRoutes = require('./routes/leaveRequests')
const proxyRoutes = require('./routes/proxy')
const purchasingRoutes = require('./routes/purchasing')
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Public routes
app.use('/api/auth', authRoutes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Protected routes
app.use('/api/customers', authenticate, customerRoutes)
app.use('/api/reports', authenticate, reportRoutes)
app.use('/api/site-visits', authenticate, siteVisitRoutes)
app.use('/api/products', authenticate, productRoutes)
app.use('/api/employees', authenticate, employeeRoutes)
app.use('/api/orders', authenticate, orderRoutes)
app.use('/api/finance', authenticate, financeRoutes)
app.use('/api/roles', authenticate, roleRoutes)
app.use('/api/permissions', authenticate, permissionRoutes)
app.use('/api/machines', authenticate, machineRoutes)
app.use('/api/status-permissions', authenticate, statusPermissionRoutes)
app.use('/api/attendance', authenticate, attendanceRoutes)
app.use('/api/leave-requests', authenticate, leaveRequestRoutes)
app.use('/api/proxy', authenticate, proxyRoutes)
app.use('/api/purchasing', authenticate, purchasingRoutes)

app.listen(PORT, () => {
  console.log(`Field Hub API running on http://localhost:${PORT}`)
})
