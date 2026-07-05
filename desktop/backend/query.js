const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const customers = await prisma.customer.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  console.log(JSON.stringify(customers.map(c => ({ id: c.id, code: c.code, name: c.name, fullName: c.fullName, type: c.customerType })), null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
