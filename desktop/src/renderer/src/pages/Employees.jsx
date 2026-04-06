import { useState } from 'react'
import { useData } from '../context/DataContext'
import InitialsAvatar from '../components/InitialsAvatar'

const ITEMS_PER_PAGE = 10

const DEPARTMENTS = ['General', 'Sales', 'Finance', 'Operations', 'IT', 'HR', 'Management', 'Logistics']
const STATUSES = ['Active', 'On Leave', 'Inactive']

const emptyForm = {
  name: '',
  department: 'General',
  position: '',
  phone: '',
  email: '',
  salary: '',
  status: 'Active',
  hireDate: '',
  supervisorId: '',
}

function Modal({ title, form, setForm, onClose, onSave, errors, employees, editingId }) {
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const inputCls = (field) =>
    `w-full bg-surface-container-lowest border rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${
      errors[field] ? 'border-error' : 'border-theme-border'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Full Name *</label>
            <input className={inputCls('name')} value={form.name} onChange={set('name')} />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Department</label>
              <select className={inputCls('department')} value={form.department} onChange={set('department')}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Position</label>
              <input className={inputCls('position')} value={form.position} onChange={set('position')} placeholder="e.g. Manager" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Phone</label>
              <input className={inputCls('phone')} value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Email</label>
              <input type="email" className={inputCls('email')} value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Salary</label>
              <input type="number" min="0" step="0.01" className={inputCls('salary')} value={form.salary} onChange={set('salary')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Status</label>
              <select className={inputCls('status')} value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Hire Date</label>
              <input type="date" className={inputCls('hireDate')} value={form.hireDate} onChange={set('hireDate')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Supervisor</label>
              <select className={inputCls('supervisorId')} value={form.supervisorId} onChange={set('supervisorId')}>
                <option value="">— None —</option>
                {employees.filter((e) => e.id !== editingId).map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">
            Cancel
          </button>
          <button onClick={onSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

const statusStyle = {
  Active: 'bg-primary-fixed text-on-primary-fixed-variant',
  'On Leave': 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Inactive: 'bg-surface-container-high text-text-muted',
}

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, isAdmin } = useData()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  function validate(f) {
    const e = {}
    if (!f.name.trim()) e.name = 'Required'
    return e
  }

  function openAdd() {
    setForm(emptyForm)
    setErrors({})
    setShowAdd(true)
  }

  function openEdit(item) {
    setForm({
      name: item.name,
      department: item.department || 'General',
      position: item.position || '',
      phone: item.phone || '',
      email: item.email || '',
      salary: item.salary || '',
      status: item.status || 'Active',
      hireDate: item.hireDate || '',
      supervisorId: item.supervisorId || '',
    })
    setErrors({})
    setEditItem(item)
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

  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.department || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.position || '').toLowerCase().includes(search.toLowerCase()) ||
      emp.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Employees</h1>
          <p className="text-sm text-text-muted mt-0.5">{employees.length} total employees</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
          <span className="material-symbols-outlined text-base">add</span>
          Add Employee
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-theme-border rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            placeholder="Search employees…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
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
              <th className="text-right px-6 py-4 font-semibold">Salary</th>
              <th className="text-left px-6 py-4 font-semibold">Status</th>
              {isAdmin && <th className="text-right px-6 py-4 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center py-16 text-text-muted">
                  No employees found
                </td>
              </tr>
            ) : (
              paginated.map((emp) => (
                <tr key={emp.id} className="border-b border-theme-border hover:bg-hover-bg transition-colors">
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
                  <td className="px-6 py-4 text-text-muted">{emp.position || '—'}</td>
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
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Prev</button>
            <span className="px-3 py-1.5">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Next</button>
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Employee" form={form} setForm={setForm} errors={errors} onClose={() => setShowAdd(false)} onSave={handleAdd} employees={employees} editingId={null} />
      )}
      {editItem && (
        <Modal title="Edit Employee" form={form} setForm={setForm} errors={errors} onClose={() => setEditItem(null)} onSave={handleEdit} employees={employees} editingId={editItem.id} />
      )}
    </div>
  )
}
