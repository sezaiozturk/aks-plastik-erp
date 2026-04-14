const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = Router()

function buildEmployeeData(body) {
  const {
    // Identity
    firstName, lastName, tckn, birthDate, birthPlace,
    gender, maritalStatus, motherName, fatherName,
    registryProvince, registryDistrict,
    // Contact
    phone, email, address, emergencyContact, emergencyPhone,
    // Job
    personnelNo, department, position, title,
    hireDate, exitDate, workType, workLocation, supervisorId,
    status,
    // Salary & Finance
    salary, netSalary, salaryType, iban, bankName,
    premium, bonus, sideRights,
    // SGK & Legal
    sgkNo, insuranceType, occupationCode, disabilityStatus, retirementStatus,
    // Education
    educationLevel, graduationDept, foreignLanguage, certificates, militaryStatus,
    // Documents
    docIdCopy, docResidency, docDiploma, docHealthReport,
    docCriminalRecord, docEmploymentContract, docSgkDeclaration,
    // Operational
    shift, leaveRights, performanceNotes,
    // System
    userRole, companyConnection,
  } = body

  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  const name = [first, last].filter(Boolean).join(' ') || 'Unknown'
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  return {
    name,
    initials,
    status: status || 'Active',
    // Identity
    firstName: first || null,
    lastName: last || null,
    tckn: tckn || null,
    birthDate: birthDate || null,
    birthPlace: birthPlace || null,
    gender: gender || null,
    maritalStatus: maritalStatus || null,
    motherName: motherName || null,
    fatherName: fatherName || null,
    registryProvince: registryProvince || null,
    registryDistrict: registryDistrict || null,
    // Contact
    phone: phone || null,
    email: email || null,
    address: address || null,
    emergencyContact: emergencyContact || null,
    emergencyPhone: emergencyPhone || null,
    // Job
    personnelNo: personnelNo || null,
    department: department || 'General',
    position: position || '',
    title: title || null,
    hireDate: hireDate || null,
    exitDate: exitDate || null,
    workType: workType || null,
    workLocation: workLocation || null,
    supervisorId: supervisorId || null,
    // Salary & Finance
    salary: parseFloat(salary) || 0,
    netSalary: netSalary ? parseFloat(netSalary) : null,
    salaryType: salaryType || null,
    iban: iban || null,
    bankName: bankName || null,
    premium: premium ? parseFloat(premium) : null,
    bonus: bonus ? parseFloat(bonus) : null,
    sideRights: sideRights || null,
    // SGK & Legal
    sgkNo: sgkNo || null,
    insuranceType: insuranceType || null,
    occupationCode: occupationCode || null,
    disabilityStatus: disabilityStatus || null,
    retirementStatus: retirementStatus || null,
    // Education
    educationLevel: educationLevel || null,
    graduationDept: graduationDept || null,
    foreignLanguage: foreignLanguage || null,
    certificates: certificates || null,
    militaryStatus: militaryStatus || null,
    // Documents
    docIdCopy: !!docIdCopy,
    docResidency: !!docResidency,
    docDiploma: !!docDiploma,
    docHealthReport: !!docHealthReport,
    docCriminalRecord: !!docCriminalRecord,
    docEmploymentContract: !!docEmploymentContract,
    docSgkDeclaration: !!docSgkDeclaration,
    // Operational
    shift: shift || null,
    leaveRights: leaveRights || null,
    performanceNotes: performanceNotes || null,
    // System
    userRole: userRole || null,
    companyConnection: companyConnection || null,
    isManager: !!body.isManager,
  }
}

router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: { supervisor: { select: { id: true, name: true } } },
    })
    res.json(employees)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: { supervisor: { select: { id: true, name: true } } },
    })
    if (!employee) return res.status(404).json({ error: 'Employee not found' })
    res.json(employee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const data = buildEmployeeData(req.body)
    const code = `EMP-${String(Date.now()).slice(-5)}`
    const employee = await prisma.employee.create({
      data: { code, ...data },
      include: { supervisor: { select: { id: true, name: true } } },
    })
    res.status(201).json(employee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const data = buildEmployeeData(req.body)
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data,
      include: { supervisor: { select: { id: true, name: true } } },
    })
    res.json(employee)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /employees/setmanager — set one employee as dept manager, clear others
router.post('/setmanager', async (req, res) => {
  try {
    const { employeeId, department } = req.body
    if (!employeeId || !department) return res.status(400).json({ error: 'employeeId and department are required' })
    await prisma.employee.updateMany({
      where: { department },
      data: { isManager: false },
    })
    await prisma.employee.update({
      where: { id: employeeId },
      data: { isManager: true },
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}, async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
