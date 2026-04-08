import { useState } from 'react'
import { useData } from '../context/DataContext'
import InitialsAvatar from '../components/InitialsAvatar'

const ITEMS_PER_PAGE = 10

const DEPARTMENTS = ['General', 'Sales', 'Finance', 'Operations', 'IT', 'HR', 'Management', 'Logistics', 'Production', 'Maintenance']
const STATUSES    = ['Active', 'On Leave', 'Inactive', 'Terminated']
const GENDERS     = ['Male', 'Female', 'Other']
const MARITAL     = ['Single', 'Married', 'Divorced', 'Widowed']
const WORK_TYPES  = ['Full-time', 'Part-time', 'Contract', 'Intern', 'Remote']
const SALARY_TYPES = ['Monthly', 'Weekly', 'Daily', 'Hourly']
const INSURANCE_TYPES = ['SSK', 'BAĞ-KUR', 'Emekli Sandığı', 'Other']
const EDUCATION_LEVELS = ['Primary', 'High School', 'Associate', 'Bachelor', 'Master', 'PhD']
const MILITARY_STATUSES = ['Completed', 'Exempt', 'Deferred', 'Pending', 'N/A']

const emptyForm = {
  // Identity
  firstName: '', lastName: '', tckn: '', birthDate: '', birthPlace: '',
  gender: '', maritalStatus: '', motherName: '', fatherName: '',
  registryProvince: '', registryDistrict: '',
  // Contact
  phone: '', email: '', address: '', emergencyContact: '', emergencyPhone: '',
  // Job
  personnelNo: '', department: 'General', position: '', title: '',
  hireDate: '', exitDate: '', workType: '', workLocation: '', supervisorId: '',
  status: 'Active',
  // Salary & Finance
  salary: '', netSalary: '', salaryType: '', iban: '', bankName: '',
  premium: '', bonus: '', sideRights: '',
  // SGK & Legal
  sgkNo: '', insuranceType: '', occupationCode: '',
  disabilityStatus: '', retirementStatus: '',
  // Education
  educationLevel: '', graduationDept: '', foreignLanguage: '',
  certificates: '', militaryStatus: '',
  // Documents
  docIdCopy: false, docResidency: false, docDiploma: false,
  docHealthReport: false, docCriminalRecord: false,
  docEmploymentContract: false, docSgkDeclaration: false,
  // Operational
  shift: '', leaveRights: '', performanceNotes: '',
  // System
  userRole: '', companyConnection: '',
}

const TABS = [
  { id: 'identity',    label: 'Identity',       icon: 'badge'                  },
  { id: 'contact',     label: 'Contact & Job',   icon: 'contact_phone'          },
  { id: 'finance',     label: 'Salary & Finance', icon: 'account_balance_wallet' },
  { id: 'legal',       label: 'SGK & Legal',     icon: 'gavel'                  },
  { id: 'education',   label: 'Education',       icon: 'school'                 },
  { id: 'operational', label: 'Docs & System',   icon: 'folder_managed'         },
]

// ─── Field helpers ────────────────────────────────────────────────────────────
function inp(errors, field) {
  return `w-full bg-surface-container-lowest border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${
    errors[field] ? 'border-error' : 'border-theme-border'
  }`
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}

function Divider({ label }) {
  return (
    <div className="col-span-2 flex items-center gap-3 pt-1">
      <div className="flex-1 h-px bg-surface-container-high" />
      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</span>
      <div className="flex-1 h-px bg-surface-container-high" />
    </div>
  )
}

function DocCheckbox({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition text-sm ${
        checked
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-surface-container-lowest border-theme-border text-text-muted hover:bg-hover-bg'
      }`}
    >
      <span className="material-symbols-outlined text-base">
        {checked ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      {label}
    </button>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function EmployeeModal({ title, form, setForm, onClose, onSave, errors, employees, editingId }) {
  const [tab, setTab] = useState('identity')
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const setVal = (field) => (val) => setForm(f => ({ ...f, [field]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-theme-border shrink-0">
          <h2 className="text-base font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto shrink-0 border-b border-theme-border">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition -mb-px ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-5">

          {/* ── Identity ── */}
          {tab === 'identity' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name *" error={errors.firstName}>
                <input className={inp(errors, 'firstName')} value={form.firstName} onChange={set('firstName')} placeholder="First name" />
              </Field>
              <Field label="Last Name *" error={errors.lastName}>
                <input className={inp(errors, 'lastName')} value={form.lastName} onChange={set('lastName')} placeholder="Last name" />
              </Field>
              <Field label="TCKN (Turkish ID No.)">
                <input className={inp(errors, 'tckn')} value={form.tckn} onChange={set('tckn')} placeholder="11-digit ID number" maxLength={11} />
              </Field>
              <Field label="Date of Birth">
                <input type="date" className={inp(errors, 'birthDate')} value={form.birthDate} onChange={set('birthDate')} />
              </Field>
              <Field label="Place of Birth">
                <input className={inp(errors, 'birthPlace')} value={form.birthPlace} onChange={set('birthPlace')} placeholder="City / district" />
              </Field>
              <Field label="Gender">
                <select className={inp(errors, 'gender')} value={form.gender} onChange={set('gender')}>
                  <option value="">Select…</option>
                  {GENDERS.map(g => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Marital Status">
                <select className={inp(errors, 'maritalStatus')} value={form.maritalStatus} onChange={set('maritalStatus')}>
                  <option value="">Select…</option>
                  {MARITAL.map(m => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={inp(errors, 'status')} value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Divider label="Family & Registry" />
              <Field label="Mother's Name">
                <input className={inp(errors, 'motherName')} value={form.motherName} onChange={set('motherName')} placeholder="Mother's first name" />
              </Field>
              <Field label="Father's Name">
                <input className={inp(errors, 'fatherName')} value={form.fatherName} onChange={set('fatherName')} placeholder="Father's first name" />
              </Field>
              <Field label="Registry Province (Nüfus İl)">
                <input className={inp(errors, 'registryProvince')} value={form.registryProvince} onChange={set('registryProvince')} placeholder="Province" />
              </Field>
              <Field label="Registry District (Nüfus İlçe)">
                <input className={inp(errors, 'registryDistrict')} value={form.registryDistrict} onChange={set('registryDistrict')} placeholder="District" />
              </Field>
            </div>
          )}

          {/* ── Contact & Job ── */}
          {tab === 'contact' && (
            <div className="grid grid-cols-2 gap-4">
              <Divider label="Contact Information" />
              <Field label="Mobile Phone">
                <input type="tel" className={inp(errors, 'phone')} value={form.phone} onChange={set('phone')} placeholder="+90 (555) 000-0000" />
              </Field>
              <Field label="Email">
                <input type="email" className={inp(errors, 'email')} value={form.email} onChange={set('email')} placeholder="name@company.com" />
              </Field>
              <Field label="Address">
                <input className={inp(errors, 'address')} value={form.address} onChange={set('address')} placeholder="Full address" />
              </Field>
              <Field label="Emergency Contact Person">
                <input className={inp(errors, 'emergencyContact')} value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="Full name" />
              </Field>
              <Field label="Emergency Contact Phone">
                <input type="tel" className={inp(errors, 'emergencyPhone')} value={form.emergencyPhone} onChange={set('emergencyPhone')} placeholder="+90 (555) 000-0000" />
              </Field>

              <Divider label="Job Information" />
              <Field label="Personnel No.">
                <input className={inp(errors, 'personnelNo')} value={form.personnelNo} onChange={set('personnelNo')} placeholder="e.g. P-001" />
              </Field>
              <Field label="Department">
                <select className={inp(errors, 'department')} value={form.department} onChange={set('department')}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Position">
                <input className={inp(errors, 'position')} value={form.position} onChange={set('position')} placeholder="e.g. Engineer" />
              </Field>
              <Field label="Title (Ünvan)">
                <input className={inp(errors, 'title')} value={form.title} onChange={set('title')} placeholder="e.g. Senior, Director" />
              </Field>
              <Field label="Hire Date">
                <input type="date" className={inp(errors, 'hireDate')} value={form.hireDate} onChange={set('hireDate')} />
              </Field>
              <Field label="Exit Date">
                <input type="date" className={inp(errors, 'exitDate')} value={form.exitDate} onChange={set('exitDate')} />
              </Field>
              <Field label="Work Type">
                <select className={inp(errors, 'workType')} value={form.workType} onChange={set('workType')}>
                  <option value="">Select…</option>
                  {WORK_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Work Location">
                <input className={inp(errors, 'workLocation')} value={form.workLocation} onChange={set('workLocation')} placeholder="Office / Remote / Branch" />
              </Field>
              <Field label="Manager / Supervisor">
                <select className={inp(errors, 'supervisorId')} value={form.supervisorId} onChange={set('supervisorId')}>
                  <option value="">— None —</option>
                  {employees.filter(e => e.id !== editingId).map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* ── Salary & Finance ── */}
          {tab === 'finance' && (
            <div className="grid grid-cols-2 gap-4">
              <Divider label="Salary" />
              <Field label="Gross Salary (Brüt Maaş)">
                <input type="number" min="0" step="0.01" className={inp(errors, 'salary')} value={form.salary} onChange={set('salary')} placeholder="0.00" />
              </Field>
              <Field label="Net Salary (Net Maaş)">
                <input type="number" min="0" step="0.01" className={inp(errors, 'netSalary')} value={form.netSalary} onChange={set('netSalary')} placeholder="0.00" />
              </Field>
              <Field label="Salary Type (Maaş Türü)">
                <select className={inp(errors, 'salaryType')} value={form.salaryType} onChange={set('salaryType')}>
                  <option value="">Select…</option>
                  {SALARY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Premium (Prim)">
                <input type="number" min="0" step="0.01" className={inp(errors, 'premium')} value={form.premium} onChange={set('premium')} placeholder="0.00" />
              </Field>
              <Field label="Bonus">
                <input type="number" min="0" step="0.01" className={inp(errors, 'bonus')} value={form.bonus} onChange={set('bonus')} placeholder="0.00" />
              </Field>
              <Field label="Side Benefits (Yan Haklar)">
                <input className={inp(errors, 'sideRights')} value={form.sideRights} onChange={set('sideRights')} placeholder="e.g. Health insurance, meal card…" />
              </Field>

              <Divider label="Bank Information" />
              <Field label="Bank Name (Banka Adı)">
                <input className={inp(errors, 'bankName')} value={form.bankName} onChange={set('bankName')} placeholder="e.g. Garanti BBVA" />
              </Field>
              <Field label="IBAN">
                <input className={inp(errors, 'iban')} value={form.iban} onChange={set('iban')} placeholder="TR00 0000 0000 0000 0000 0000 00" />
              </Field>
            </div>
          )}

          {/* ── SGK & Legal ── */}
          {tab === 'legal' && (
            <div className="grid grid-cols-2 gap-4">
              <Divider label="SGK Information" />
              <Field label="SGK Sicil No">
                <input className={inp(errors, 'sgkNo')} value={form.sgkNo} onChange={set('sgkNo')} placeholder="SGK registration number" />
              </Field>
              <Field label="Insurance Type (Sigorta Türü)">
                <select className={inp(errors, 'insuranceType')} value={form.insuranceType} onChange={set('insuranceType')}>
                  <option value="">Select…</option>
                  {INSURANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Occupation Code (Meslek Kodu)">
                <input className={inp(errors, 'occupationCode')} value={form.occupationCode} onChange={set('occupationCode')} placeholder="e.g. 2141.01" />
              </Field>
              <Field label="Disability Status (Engellilik Durumu)">
                <input className={inp(errors, 'disabilityStatus')} value={form.disabilityStatus} onChange={set('disabilityStatus')} placeholder="None / Degree 1–3" />
              </Field>
              <Field label="Retirement Status (Emeklilik Durumu)">
                <input className={inp(errors, 'retirementStatus')} value={form.retirementStatus} onChange={set('retirementStatus')} placeholder="Active / Retired / Eligible" />
              </Field>
            </div>
          )}

          {/* ── Education ── */}
          {tab === 'education' && (
            <div className="grid grid-cols-2 gap-4">
              <Divider label="Education" />
              <Field label="Education Level (Eğitim Durumu)">
                <select className={inp(errors, 'educationLevel')} value={form.educationLevel} onChange={set('educationLevel')}>
                  <option value="">Select…</option>
                  {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Graduation Department (Mezuniyet Bölümü)">
                <input className={inp(errors, 'graduationDept')} value={form.graduationDept} onChange={set('graduationDept')} placeholder="e.g. Computer Engineering" />
              </Field>
              <Field label="Foreign Language (Yabancı Dil)">
                <input className={inp(errors, 'foreignLanguage')} value={form.foreignLanguage} onChange={set('foreignLanguage')} placeholder="e.g. English B2, German A1" />
              </Field>
              <Field label="Military Status (Askerlik Durumu)">
                <select className={inp(errors, 'militaryStatus')} value={form.militaryStatus} onChange={set('militaryStatus')}>
                  <option value="">Select…</option>
                  {MILITARY_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Certificates & Trainings (Sertifikalar)">
                  <textarea rows={3} className={inp(errors, 'certificates')} value={form.certificates} onChange={set('certificates')} placeholder="List certificates, courses, trainings…" />
                </Field>
              </div>
            </div>
          )}

          {/* ── Docs & System ── */}
          {tab === 'operational' && (
            <div className="grid grid-cols-2 gap-4">
              <Divider label="Documents Received" />
              <div className="col-span-2 grid grid-cols-2 gap-2">
                {[
                  { key: 'docIdCopy',             label: 'ID Copy (Kimlik Fotokopisi)'         },
                  { key: 'docResidency',           label: 'Residency (İkametgah)'              },
                  { key: 'docDiploma',             label: 'Diploma'                            },
                  { key: 'docHealthReport',        label: 'Health Report (Sağlık Raporu)'      },
                  { key: 'docCriminalRecord',      label: 'Criminal Record (Sabıka Kaydı)'     },
                  { key: 'docEmploymentContract',  label: 'Employment Contract (İş Sözleşmesi)'},
                  { key: 'docSgkDeclaration',      label: 'SGK Declaration (SGK Bildirgesi)'   },
                ].map(({ key, label }) => (
                  <DocCheckbox
                    key={key}
                    label={label}
                    checked={form[key]}
                    onChange={setVal(key)}
                  />
                ))}
              </div>

              <Divider label="Operational" />
              <Field label="Shift (Vardiya)">
                <input className={inp(errors, 'shift')} value={form.shift} onChange={set('shift')} placeholder="e.g. Morning / Night / Rotating" />
              </Field>
              <Field label="Leave Rights (İzin Hakları)">
                <input className={inp(errors, 'leaveRights')} value={form.leaveRights} onChange={set('leaveRights')} placeholder="e.g. 14 days / year" />
              </Field>
              <div className="col-span-2">
                <Field label="Performance Notes (Performans Notları)">
                  <textarea rows={2} className={inp(errors, 'performanceNotes')} value={form.performanceNotes} onChange={set('performanceNotes')} placeholder="Notes…" />
                </Field>
              </div>

              <Divider label="System" />
              <Field label="User Role (Kullanıcı Rolü)">
                <input className={inp(errors, 'userRole')} value={form.userRole} onChange={set('userRole')} placeholder="e.g. admin / staff" />
              </Field>
              <Field label="Company Connection (Şirket Bağlantısı)">
                <input className={inp(errors, 'companyConnection')} value={form.companyConnection} onChange={set('companyConnection')} placeholder="Branch / subsidiary" />
              </Field>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-theme-border shrink-0">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-xl py-2.5 text-sm text-text-muted hover:bg-hover-bg transition">
            Cancel
          </button>
          <button onClick={onSave} className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition">
            Save Employee
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status styles ─────────────────────────────────────────────────────────────
const statusStyle = {
  Active:     'bg-primary-fixed text-on-primary-fixed-variant',
  'On Leave': 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Inactive:   'bg-surface-container-high text-text-muted',
  Terminated: 'bg-error/10 text-error',
}

function formFromEmployee(emp) {
  return {
    firstName: emp.firstName || '', lastName: emp.lastName || '',
    tckn: emp.tckn || '', birthDate: emp.birthDate || '',
    birthPlace: emp.birthPlace || '', gender: emp.gender || '',
    maritalStatus: emp.maritalStatus || '', motherName: emp.motherName || '',
    fatherName: emp.fatherName || '', registryProvince: emp.registryProvince || '',
    registryDistrict: emp.registryDistrict || '',
    phone: emp.phone || '', email: emp.email || '', address: emp.address || '',
    emergencyContact: emp.emergencyContact || '', emergencyPhone: emp.emergencyPhone || '',
    personnelNo: emp.personnelNo || '', department: emp.department || 'General',
    position: emp.position || '', title: emp.title || '',
    hireDate: emp.hireDate || '', exitDate: emp.exitDate || '',
    workType: emp.workType || '', workLocation: emp.workLocation || '',
    supervisorId: emp.supervisorId || '', status: emp.status || 'Active',
    salary: emp.salary || '', netSalary: emp.netSalary || '',
    salaryType: emp.salaryType || '', iban: emp.iban || '',
    bankName: emp.bankName || '', premium: emp.premium || '',
    bonus: emp.bonus || '', sideRights: emp.sideRights || '',
    sgkNo: emp.sgkNo || '', insuranceType: emp.insuranceType || '',
    occupationCode: emp.occupationCode || '', disabilityStatus: emp.disabilityStatus || '',
    retirementStatus: emp.retirementStatus || '',
    educationLevel: emp.educationLevel || '', graduationDept: emp.graduationDept || '',
    foreignLanguage: emp.foreignLanguage || '', certificates: emp.certificates || '',
    militaryStatus: emp.militaryStatus || '',
    docIdCopy: !!emp.docIdCopy, docResidency: !!emp.docResidency,
    docDiploma: !!emp.docDiploma, docHealthReport: !!emp.docHealthReport,
    docCriminalRecord: !!emp.docCriminalRecord, docEmploymentContract: !!emp.docEmploymentContract,
    docSgkDeclaration: !!emp.docSgkDeclaration,
    shift: emp.shift || '', leaveRights: emp.leaveRights || '',
    performanceNotes: emp.performanceNotes || '',
    userRole: emp.userRole || '', companyConnection: emp.companyConnection || '',
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, isAdmin } = useData()
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [errors, setErrors]   = useState({})

  function validate(f) {
    const e = {}
    if (!f.firstName.trim() && !f.lastName.trim()) e.firstName = 'At least first or last name required'
    return e
  }

  function openAdd() { setForm(emptyForm); setErrors({}); setShowAdd(true) }

  function openEdit(emp) {
    setForm(formFromEmployee(emp))
    setErrors({})
    setEditItem(emp)
  }

  async function handleAdd() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    await addEmployee(form)
    setShowAdd(false)
  }

  async function handleEdit() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    await updateEmployee(editItem.id, form)
    setEditItem(null)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this employee?')) return
    await deleteEmployee(id)
  }

  const filtered = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    (emp.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (emp.position   || '').toLowerCase().includes(search.toLowerCase()) ||
    emp.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Employees</h1>
          <p className="text-sm text-text-muted mt-0.5">{employees.length} total employees</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
            <span className="material-symbols-outlined text-base">add</span>
            Add Employee
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-theme-border rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            placeholder="Search employees…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-4 font-semibold">Employee</th>
              <th className="text-left px-6 py-4 font-semibold">Department</th>
              <th className="text-left px-6 py-4 font-semibold">Position</th>
              <th className="text-left px-6 py-4 font-semibold">Contact</th>
              <th className="text-left px-6 py-4 font-semibold">Supervisor</th>
              <th className="text-right px-6 py-4 font-semibold">Gross Salary</th>
              <th className="text-left px-6 py-4 font-semibold">Status</th>
              {isAdmin && <th className="text-right px-6 py-4 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center py-16 text-text-muted">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">badge</span>
                  No employees found
                </td>
              </tr>
            ) : (
              paginated.map(emp => (
                <tr key={emp.id} className="border-b border-theme-border last:border-0 hover:bg-hover-bg transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar initials={emp.initials} size="sm" />
                      <div>
                        <div className="font-semibold text-on-surface">{emp.name}</div>
                        <div className="text-xs text-text-muted font-mono">{emp.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">{emp.department || '—'}</td>
                  <td className="px-6 py-4 text-text-muted">
                    <div>{emp.position || '—'}</div>
                    {emp.title && <div className="text-xs text-text-muted">{emp.title}</div>}
                  </td>
                  <td className="px-6 py-4 text-text-muted">
                    <div>{emp.phone || '—'}</div>
                    <div className="text-xs">{emp.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">{emp.supervisor?.name || '—'}</td>
                  <td className="px-6 py-4 text-right font-medium text-on-surface">
                    {emp.salary ? `$${parseFloat(emp.salary).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle[emp.status] || statusStyle.Inactive}`}>
                      {emp.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-primary transition">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-error transition">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
          <span>{filtered.length} employees</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Prev</button>
            <span className="px-3 py-1.5">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Next</button>
          </div>
        </div>
      )}

      {showAdd && (
        <EmployeeModal title="Add Employee" form={form} setForm={setForm} errors={errors}
          onClose={() => setShowAdd(false)} onSave={handleAdd} employees={employees} editingId={null} />
      )}
      {editItem && (
        <EmployeeModal title="Edit Employee" form={form} setForm={setForm} errors={errors}
          onClose={() => setEditItem(null)} onSave={handleEdit} employees={employees} editingId={editItem.id} />
      )}
    </div>
  )
}
