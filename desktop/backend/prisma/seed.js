const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // --- Admin User ---
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@fieldhub.com' },
    update: {},
    create: {
      email: 'admin@fieldhub.com',
      password: adminPassword,
      name: 'Admin',
      role: 'admin',
    },
  })
  console.log('  Admin user seeded (admin@fieldhub.com / admin123)')

  // --- Customers ---
  const customers = [
    { code: 'DX-9921', initials: 'NV', name: 'Nova Dynamics Corp', contact: 'Sarah Mitchell', contactRole: 'Chief Systems Architect', region: 'San Francisco, CA', totalOrders: 142, activeOrders: 8, badge: 'ACTIVE', badgeType: 'active', flagged: false },
    { code: 'LX-4402', initials: 'KL', name: 'Kinetix Logistics', contact: 'David Chen', contactRole: 'Operations Lead', region: 'Chicago, IL', totalOrders: 89, activeOrders: 0, badge: 'REVIEW', badgeType: 'review', flagged: true },
    { code: 'AX-0118', initials: 'AS', name: 'Apex Solutions', contact: 'Elena Rodriguez', contactRole: 'Director of Maintenance', region: 'Austin, TX', totalOrders: 215, activeOrders: 0, badge: '0 OPEN', badgeType: 'clear', flagged: false },
    { code: 'QX-7731', initials: 'QI', name: 'Quantum Industrials', contact: 'Marcus Thorne', contactRole: 'Facility Manager', region: 'Seattle, WA', totalOrders: 54, activeOrders: 3, badge: '3 PENDING', badgeType: 'pending', flagged: false },
    { code: 'BX-2210', initials: 'BV', name: 'Blue Vantage Group', contact: 'Jordan Smyth', contactRole: 'Security Director', region: 'New York, NY', totalOrders: 312, activeOrders: 12, badge: '12 ACTIVE', badgeType: 'active', flagged: false },
    { code: 'MX-3390', initials: 'MR', name: 'MediCore Regional', contact: 'Dr. Amara Osei', contactRole: 'Head of Facilities', region: 'Houston, TX', totalOrders: 67, activeOrders: 2, badge: '2 ACTIVE', badgeType: 'active', flagged: false },
    { code: 'TX-8801', initials: 'TN', name: 'Titan Networks', contact: 'Riku Tanaka', contactRole: 'IT Infrastructure Lead', region: 'Denver, CO', totalOrders: 38, activeOrders: 5, badge: '5 ACTIVE', badgeType: 'active', flagged: false },
  ]

  const createdCustomers = {}
  for (const c of customers) {
    const customer = await prisma.customer.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    })
    createdCustomers[c.name] = customer.id
  }
  console.log(`  ${customers.length} customers seeded`)

  // --- Technicians ---
  const technicians = [
    { code: 'TECH-8821', name: 'Sarah Jenkins', initials: 'SJ', status: 'Active', specialization: 'Industrial Robotics', certification: 'Lead Cert L3', assignment: 'Automata Factory B', assignmentIcon: 'location_on', rating: 4.9 },
    { code: 'TECH-9012', name: 'David Chen', initials: 'DC', status: 'Busy', specialization: 'Electrical Grid', certification: 'High Voltage Spec', assignment: 'Maintenance In-Progress', assignmentIcon: 'sync', rating: 4.8 },
    { code: 'TECH-4451', name: 'Elena Rodriguez', initials: 'ER', status: 'Off-Duty', specialization: 'Fiber Optics', certification: 'Network Infrastructure', assignment: 'Shift ends in 2h', assignmentIcon: null, rating: 5.0 },
    { code: 'TECH-1102', name: 'Marcus Thorne', initials: 'MT', status: 'Active', specialization: 'HVAC Systems', certification: 'Climate Control Expert', assignment: 'Tech Hub HQ', assignmentIcon: 'location_on', rating: 4.7 },
    { code: 'TECH-3344', name: 'Priya Nair', initials: 'PN', status: 'Active', specialization: 'Fiber Optics', certification: 'Senior Splice Tech', assignment: 'West Ring Hub', assignmentIcon: 'location_on', rating: 4.6 },
    { code: 'TECH-7720', name: 'James Okafor', initials: 'JO', status: 'Busy', specialization: 'Industrial Robotics', certification: 'Lead Cert L2', assignment: 'Steel Mill North', assignmentIcon: 'location_on', rating: 4.8 },
    { code: 'TECH-5591', name: 'Lena Fischer', initials: 'LF', status: 'Active', specialization: 'Electrical Grid', certification: 'Grid Ops L4', assignment: 'DataCenter Alpha', assignmentIcon: 'location_on', rating: 4.9 },
    { code: 'TECH-6613', name: 'Omar Hassan', initials: 'OH', status: 'Off-Duty', specialization: 'HVAC Systems', certification: 'Refrigerant Specialist', assignment: 'Shift starts 6AM', assignmentIcon: null, rating: 4.5 },
  ]

  const createdTechs = {}
  for (const t of technicians) {
    const tech = await prisma.technician.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    })
    createdTechs[t.name] = tech.id
  }
  console.log(`  ${technicians.length} technicians seeded`)

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
