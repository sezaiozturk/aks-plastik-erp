import { useState, useRef, useEffect, useCallback } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import Users from './Users'
import { loadRatesConfig, saveRatesConfig, DEFAULT_RATES_URL, DEFAULT_RATES_PATH, DEFAULT_BASE } from '../hooks/useCurrencyRates'

import { API_URL } from '../config'

const MACHINE_STATUSES = ['Active', 'Under Maintenance', 'Out of Service']

const statusColor = {
  'Active':            'bg-green-100 text-green-700',
  'Under Maintenance': 'bg-amber-100 text-amber-700',
  'Out of Service':    'bg-red-100 text-red-700',
}

function emptyForm() {
  return {
    code: '', name: '', manufacturer: '', manufacturerCountry: '', manufacturerContact: '',
    productionYear: '', warrantyExpiry: '', status: 'Active', location: '', nextMaintenanceDue: '', notes: '',
  }
}

// ─── Machine View Modal ──────────────────────────────────────────────────────
function MachineViewModal({ machine, onClose, onEdit }) {
  const { downloadMachineManual } = useData()
  const yearTasks = (machine.monthlyMaintenance || []).filter((t) => t.year === new Date().getFullYear())
  const doneTasks = yearTasks.filter((t) => t.completed).length

  const field = (label, value, icon) => (
    value ? (
      <div className="flex items-start gap-2">
        {icon && <span className="material-symbols-outlined text-base text-text-muted mt-0.5">{icon}</span>}
        <div>
          <p className="text-xs text-text-muted">{label}</p>
          <p className="text-sm text-on-surface font-medium">{value}</p>
        </div>
      </div>
    ) : null
  )

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">precision_manufacturing</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">{machine.name}</h2>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-muted">{machine.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[machine.status] || 'bg-surface-container-high text-text-muted'}`}>{machine.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 border border-theme-border px-3 py-1.5 rounded-xl text-sm text-text-muted hover:bg-hover-bg transition">
              <span className="material-symbols-outlined text-base">edit</span>
              Edit
            </button>
            <button onClick={onClose} className="text-text-muted hover:text-on-surface transition">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {field('Machine Code', machine.code, 'tag')}
              {field('Machine Name', machine.name, 'precision_manufacturing')}
              {field('Status', machine.status, 'toggle_on')}
              {field('Location / Department', machine.location, 'location_on')}
              {field('Production Year', machine.productionYear, 'calendar_today')}
              {field('Warranty Expiry', machine.warrantyExpiry, 'verified_user')}
              {field('Next Maintenance Due', machine.nextMaintenanceDue, 'event')}
            </div>
            {machine.notes && (
              <div className="mt-3 bg-surface-container-high rounded-xl px-4 py-3 text-sm text-text-muted">
                <span className="font-semibold text-on-surface mr-2">Notes:</span>{machine.notes}
              </div>
            )}
          </div>

          {/* Manufacturer */}
          {(machine.manufacturer || machine.manufacturerCountry || machine.manufacturerContact) && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Manufacturer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {field('Manufacturer', machine.manufacturer, 'factory')}
                {field('Country', machine.manufacturerCountry, 'public')}
                {field('Contact', machine.manufacturerContact, 'contact_phone')}
              </div>
            </div>
          )}

          {/* Maintenance Summary */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Maintenance Overview</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-on-surface">{(machine.maintenanceRecords || []).length}</p>
                <p className="text-xs text-text-muted mt-1">Total Records</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-on-surface">{doneTasks}/{yearTasks.length}</p>
                <p className="text-xs text-text-muted mt-1">Tasks This Year</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-on-surface">{machine.manualName ? 'Yes' : 'No'}</p>
                <p className="text-xs text-text-muted mt-1">Manual Uploaded</p>
              </div>
            </div>
          </div>

          {/* Recent Maintenance Records */}
          {(machine.maintenanceRecords || []).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Recent Maintenance Records
              </h3>
              <div className="rounded-xl border border-theme-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-container-high text-text-muted text-xs uppercase tracking-wider border-b border-theme-border">
                      <th className="text-left px-3 py-2.5 font-semibold">Date</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Type</th>
                      <th className="text-left px-3 py-2.5 font-semibold">Description</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(machine.maintenanceRecords || []).slice(0, 5).map((r) => (
                      <tr key={r.id} className="border-b border-theme-border last:border-0">
                        <td className="px-3 py-2.5 text-xs text-text-muted whitespace-nowrap">{r.date}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded-full">{r.type}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs max-w-[200px] truncate" title={r.description}>{r.description || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-right">
                          {r.cost > 0 ? `${r.currency || 'USD'} ${r.cost.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(machine.maintenanceRecords || []).length > 5 && (
                  <p className="text-xs text-text-muted text-center py-2 border-t border-theme-border">
                    +{(machine.maintenanceRecords || []).length - 5} more records — view in Maintenance & Repair page
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Manual */}
          {machine.manualName && (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">User Manual</h3>
              <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-2xl text-primary">picture_as_pdf</span>
                <span className="text-sm font-medium text-on-surface flex-1">{machine.manualName}</span>
                <button
                  onClick={() => downloadMachineManual(machine.id, machine.manualName)}
                  className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90 transition"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme-border flex justify-end shrink-0">
          <button onClick={onClose} className="border border-theme-border rounded-xl px-6 py-2 text-sm text-text-muted hover:bg-hover-bg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Machine Modal ────────────────────────────────────────────────────────────
function MachineModal({ machine, onClose, onSave }) {
  const { uploadMachineManual, downloadMachineManual, deleteMachineManual } = useData()
  const [tab, setTab] = useState('basic')
  const [form, setForm] = useState(machine ? {
    code: machine.code || '',
    name: machine.name || '',
    manufacturer: machine.manufacturer || '',
    manufacturerCountry: machine.manufacturerCountry || '',
    manufacturerContact: machine.manufacturerContact || '',
    productionYear: machine.productionYear || '',
    warrantyExpiry: machine.warrantyExpiry || '',
    status: machine.status || 'Active',
    location: machine.location || '',
    nextMaintenanceDue: machine.nextMaintenanceDue || '',
    notes: machine.notes || '',
  } : emptyForm())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Manual
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [deletingManual, setDeletingManual] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const inp = (extra = '') =>
    `w-full bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${extra}`
  const errInp = (field) =>
    `w-full bg-surface-container-lowest border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${errors[field] ? 'border-error' : 'border-theme-border'}`

  function validate() {
    const e = {}
    if (!form.code.trim()) e.code = true
    if (!form.name.trim()) e.name = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !machine) return
    setUploading(true)
    try { await uploadMachineManual(machine.id, file) } finally { setUploading(false) }
    e.target.value = ''
  }

  async function handleDeleteManual() {
    if (!machine) return
    setDeletingManual(true)
    try { await deleteMachineManual(machine.id) } finally { setDeletingManual(false) }
  }

  const tabCls = (key) =>
    `flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition whitespace-nowrap ${
      tab === key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-on-surface'
    }`

  const isNew = !machine

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">precision_manufacturing</span>
            <div>
              <h2 className="text-base font-bold text-on-surface">{isNew ? 'Add Machine' : machine.name}</h2>
              {!isNew && <p className="text-xs text-text-muted">{machine.code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-on-surface transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-theme-border shrink-0 px-6 overflow-x-auto">
          <button className={tabCls('basic')} onClick={() => setTab('basic')}>
            <span className="material-symbols-outlined text-sm">info</span> Basic Info
          </button>
          <button className={tabCls('manufacturer')} onClick={() => setTab('manufacturer')}>
            <span className="material-symbols-outlined text-sm">factory</span> Manufacturer
          </button>
          {!isNew && (
            <button className={tabCls('manual')} onClick={() => setTab('manual')}>
              <span className="material-symbols-outlined text-sm">menu_book</span> Manual
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Basic Info ── */}
          {tab === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Machine Code <span className="text-error">*</span></label>
                <input className={errInp('code')} value={form.code} onChange={set('code')} placeholder="e.g. MCH-001" />
                {errors.code && <p className="text-xs text-error mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Machine Name <span className="text-error">*</span></label>
                <input className={errInp('name')} value={form.name} onChange={set('name')} placeholder="e.g. CNC Lathe" />
                {errors.name && <p className="text-xs text-error mt-0.5">Required</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Status</label>
                <select className={inp()} value={form.status} onChange={set('status')}>
                  {MACHINE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Location / Department</label>
                <input className={inp()} value={form.location} onChange={set('location')} placeholder="e.g. Hall A" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Production Year</label>
                <input type="number" className={inp()} value={form.productionYear} onChange={set('productionYear')} placeholder="e.g. 2019" min="1900" max="2099" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Warranty Expiry</label>
                <input type="date" className={inp()} value={form.warrantyExpiry} onChange={set('warrantyExpiry')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Next Maintenance Due</label>
                <input type="date" className={inp()} value={form.nextMaintenanceDue} onChange={set('nextMaintenanceDue')} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-muted mb-1">Notes</label>
                <textarea rows={3} className={inp()} value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" />
              </div>
            </div>
          )}

          {/* ── Manufacturer ── */}
          {tab === 'manufacturer' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-muted mb-1">Manufacturer Name</label>
                <input className={inp()} value={form.manufacturer} onChange={set('manufacturer')} placeholder="e.g. Mazak Corporation" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Country of Origin</label>
                <input className={inp()} value={form.manufacturerCountry} onChange={set('manufacturerCountry')} placeholder="e.g. Japan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Manufacturer Contact</label>
                <input className={inp()} value={form.manufacturerContact} onChange={set('manufacturerContact')} placeholder="Email, phone, or website" />
              </div>
            </div>
          )}



          {/* ── Manual ── */}
          {tab === 'manual' && (
            <div className="flex flex-col items-center gap-6 py-4">
              {machine?.manualPath ? (
                <div className="w-full max-w-md bg-surface-container-high rounded-2xl border border-theme-border p-6 flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-5xl text-primary">picture_as_pdf</span>
                  <p className="text-sm font-medium text-on-surface text-center">{machine.manualName || 'Manual'}</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => downloadMachineManual(machine.id, machine.manualName)}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      Download
                    </button>
                    <button
                      onClick={handleDeleteManual}
                      disabled={deletingManual}
                      className="flex items-center gap-2 border border-theme-border px-4 py-2.5 rounded-xl text-sm text-error hover:bg-hover-bg transition disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      {deletingManual ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-xs text-text-muted hover:text-on-surface transition"
                  >
                    {uploading ? 'Uploading…' : 'Replace file'}
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full max-w-md border-2 border-dashed border-theme-border rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary hover:bg-hover-bg transition"
                >
                  <span className="material-symbols-outlined text-4xl text-text-muted">upload_file</span>
                  <p className="text-sm font-medium text-on-surface">Click to upload machine manual</p>
                  <p className="text-xs text-text-muted">PDF, DOC, DOCX — max 50 MB</p>
                  {uploading && <p className="text-xs text-primary">Uploading…</p>}
                </div>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
            </div>
          )}
        </div>

        {/* Footer */}
        {(tab === 'basic' || tab === 'manufacturer') && (
          <div className="px-6 py-4 border-t border-theme-border flex gap-3 shrink-0">
            <button onClick={onClose} className="flex-1 border border-theme-border rounded-xl py-2 text-sm text-text-muted hover:bg-hover-bg transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-40">
              {saving ? 'Saving…' : isNew ? 'Add Machine' : 'Save Changes'}
            </button>
          </div>
        )}
        {tab === 'manual' && (
          <div className="px-6 py-4 border-t border-theme-border flex justify-end shrink-0">
            <button onClick={onClose} className="border border-theme-border rounded-xl px-6 py-2 text-sm text-text-muted hover:bg-hover-bg transition">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const PAGES = [
  { key: 'customers',   label: 'Customers',   icon: 'groups' },
  { key: 'products',    label: 'Products',    icon: 'inventory_2' },
  { key: 'orders',      label: 'Orders',      icon: 'shopping_cart' },
  { key: 'work-orders', label: 'Site Visits', icon: 'location_on' },
  { key: 'reports',     label: 'Tasks',       icon: 'analytics' },
  { key: 'employees',   label: 'Employees',   icon: 'badge' },
  { key: 'finance',     label: 'Finance',     icon: 'account_balance_wallet' },
  { key: 'production',  label: 'Production',  icon: 'precision_manufacturing' },
  { key: 'maintenance', label: 'Maintenance', icon: 'build' },
  { key: 'logistics',   label: 'Logistics',   icon: 'local_shipping' },
  { key: 'purchasing',  label: 'Purchasing',  icon: 'shopping_bag' },
]

// ─── Employee Assign Modal ────────────────────────────────────────────────────
function EmployeeAssignModal({ employee, allEmployees, onClose, onSave }) {
  const { roles } = useData()
  const [form, setForm] = useState({
    department: employee.department || '',
    supervisorId: employee.supervisorId || '',
  })
  const [saving, setSaving] = useState(false)

  const possibleSupervisors = allEmployees.filter((e) => e.id !== employee.id)

  async function handleSave() {
    setSaving(true)
    await onSave(employee.id, {
      ...employee,
      department: form.department,
      supervisorId: form.supervisorId || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">{employee.name}</h3>
            <p className="text-xs text-text-muted">{employee.position || '—'}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-error">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Department</label>
            <select
              className="w-full bg-surface-container border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
            >
              <option value="">— Select Department —</option>
              {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Manager (Supervisor)</label>
            <select
              className="w-full bg-surface-container border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              value={form.supervisorId}
              onChange={(e) => setForm((p) => ({ ...p, supervisorId: e.target.value }))}
            >
              <option value="">— None (is a Manager) —</option>
              {possibleSupervisors.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-40">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── User Roles Tab ───────────────────────────────────────────────────────────
function UserRolesTab() {
  const { token } = useAuth()
  const { roles, addRole, renameRole, deleteRole } = useData()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [newDept, setNewDept] = useState('')
  const [addError, setAddError] = useState('')
  const [deletingRole, setDeletingRole] = useState(null) // { id, name }
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [renamingRole, setRenamingRole] = useState(null) // { id, name }
  const [renameText, setRenameText] = useState('')
  const [renameError, setRenameError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  async function saveEmployee(id, updates) {
    await fetch(`${API_URL}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    })
    setEditModal(null)
    load()
  }

  async function handleAddDept() {
    const name = newDept.trim()
    if (!name) return
    try {
      setAddError('')
      await addRole(name)
      setNewDept('')
    } catch (e) {
      setAddError(e.message)
    }
  }

  async function handleDeleteDept() {
    await deleteRole(deletingRole.id)
    setDeletingRole(null)
    setDeleteConfirmText('')
    load()
  }

  async function handleRenameDept() {
    const name = renameText.trim()
    if (!name || name === renamingRole.name) return
    try {
      setRenameError('')
      await renameRole(renamingRole.id, name)
      setRenamingRole(null)
      setRenameText('')
      load()
    } catch (e) {
      setRenameError(e.message)
    }
  }

  // Merge: role names from permissions + employee departments
  const roleDeptNames = roles.map((r) => r.name)
  const empDeptNames = employees.map((e) => e.department || 'Unassigned')
  const departments = [...new Set([...roleDeptNames, ...empDeptNames])].sort()

  function isManager(emp, deptEmps) {
    return deptEmps.some((other) => other.supervisorId === emp.id)
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-text-muted text-sm py-8">
      <span className="material-symbols-outlined animate-spin">refresh</span> Loading…
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">Department hierarchy — managers and their team members. Click edit to reassign.</p>

      {/* Add Department */}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          placeholder="New department name…"
          value={newDept}
          onChange={(e) => setNewDept(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
        />
        <button
          onClick={handleAddDept}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Department
        </button>
      </div>
      {addError && <p className="text-xs text-error -mt-2">{addError}</p>}

      {departments.length === 0 && (
        <p className="text-sm text-text-muted py-4">No departments yet. Add one above.</p>
      )}

      {departments.map((dept) => {
        const deptEmps = employees.filter((e) => (e.department || 'Unassigned') === dept)
        const managers = deptEmps.filter((e) => isManager(e, deptEmps))
        const managedIds = new Set(managers.map((m) => m.id))

        // Employees who report to a manager in this dept
        const subordinates = deptEmps.filter((e) => e.supervisorId && managedIds.has(e.supervisorId))
        // Employees with no manager assigned within this dept
        const unassigned = deptEmps.filter((e) => !managedIds.has(e.id) && !subordinates.find((s) => s.id === e.id))

        return (
          <div key={dept} className="bg-surface-container-lowest border border-theme-border rounded-2xl overflow-hidden">
            {/* Department header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-surface-container border-b border-theme-border">
              <span className="material-symbols-outlined text-base text-primary">corporate_fare</span>
              <span className="font-bold text-on-surface">{dept}</span>
              <span className="text-xs text-text-muted bg-surface-container-high px-2 py-0.5 rounded-full ml-1">{deptEmps.length} {deptEmps.length === 1 ? 'person' : 'people'}</span>
              <div className="ml-auto flex items-center gap-1">
                {(() => {
                  const role = roles.find((r) => r.name === dept)
                  if (!role) return null
                  return (
                    <>
                      <button onClick={() => { setRenamingRole({ id: role.id, name: role.name }); setRenameText(role.name); setRenameError('') }} className="text-text-muted hover:text-primary transition p-1 rounded hover:bg-hover-bg">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => { setDeletingRole({ id: role.id, name: role.name }); setDeleteConfirmText('') }} className="text-text-muted hover:text-error transition p-1 rounded hover:bg-hover-bg">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Managers + their subordinates */}
            {managers.map((mgr) => (
              <div key={mgr.id}>
                {/* Manager row */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-theme-border/60 bg-amber-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm text-amber-600">manage_accounts</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface">{mgr.name}</span>
                        <span className="text-[10px] font-bold bg-amber-500/15 text-amber-600 px-1.5 py-0.5 rounded-full">MANAGER</span>
                      </div>
                      <p className="text-xs text-text-muted">{mgr.position || '—'}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditModal(mgr)} className="text-text-muted hover:text-primary p-1 rounded hover:bg-hover-bg transition">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>

                {/* Subordinates of this manager */}
                {deptEmps.filter((e) => e.supervisorId === mgr.id).map((emp, i, arr) => (
                  <div key={emp.id} className={`flex items-center justify-between pl-12 pr-5 py-2.5 ${i < arr.length - 1 || unassigned.length > 0 || managers.length > 1 ? 'border-b border-theme-border/40' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-sm text-text-muted">person</span>
                      </div>
                      <div>
                        <span className="text-sm text-on-surface">{emp.name}</span>
                        <p className="text-xs text-text-muted">{emp.position || '—'}</p>
                      </div>
                    </div>
                    <button onClick={() => setEditModal(emp)} className="text-text-muted hover:text-primary p-1 rounded hover:bg-hover-bg transition">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                ))}
              </div>
            ))}

            {/* Unassigned employees (no manager relationship) */}
            {unassigned.length > 0 && (
              <div>
                {managers.length > 0 && (
                  <div className="px-5 py-1.5 bg-surface-container/50 border-b border-theme-border/40">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">No manager assigned</span>
                  </div>
                )}
                {unassigned.map((emp, i) => (
                  <div key={emp.id} className={`flex items-center justify-between px-5 py-2.5 ${i < unassigned.length - 1 ? 'border-b border-theme-border/40' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-sm text-text-muted">person</span>
                      </div>
                      <div>
                        <span className="text-sm text-on-surface">{emp.name}</span>
                        <p className="text-xs text-text-muted">{emp.position || '—'}</p>
                      </div>
                    </div>
                    <button onClick={() => setEditModal(emp)} className="text-text-muted hover:text-primary p-1 rounded hover:bg-hover-bg transition">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {deptEmps.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">No employees</p>
            )}
          </div>
        )
      })}

      {editModal && (
        <EmployeeAssignModal
          employee={editModal}
          allEmployees={employees}
          onClose={() => setEditModal(null)}
          onSave={saveEmployee}
        />
      )}

      {renamingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">edit</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Rename Department</h3>
                <p className="text-xs text-text-muted">Current name: <span className="font-semibold text-on-surface">{renamingRole.name}</span></p>
              </div>
            </div>
            <p className="text-sm text-text-muted mb-3">Type the new department name to confirm rename.</p>
            <input
              className="w-full bg-surface-container border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary mb-1"
              placeholder="New department name…"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameDept()}
              autoFocus
            />
            {renameError && <p className="text-xs text-error mb-3">{renameError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRenamingRole(null); setRenameText(''); setRenameError('') }} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Cancel</button>
              <button
                onClick={handleRenameDept}
                disabled={!renameText.trim() || renameText.trim() === renamingRole.name}
                className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-error">delete</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Delete Department</h3>
                <p className="text-xs text-text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-text-muted mb-3">
              Type <span className="font-semibold text-on-surface">{deletingRole.name}</span> to confirm deletion.
            </p>
            <input
              className="w-full bg-surface-container border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-error mb-4"
              placeholder={deletingRole.name}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && deleteConfirmText === deletingRole.name && handleDeleteDept()}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => { setDeletingRole(null); setDeleteConfirmText('') }} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Cancel</button>
              <button
                onClick={handleDeleteDept}
                disabled={deleteConfirmText !== deletingRole.name}
                className="flex-1 bg-error text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ORDER_STATUSES = [
  { key: 'Processing',           label: 'Processing',           icon: 'hourglass_top' },
  { key: 'Confirmed',            label: 'Confirmed',            icon: 'check_circle' },
  { key: 'In-Production',        label: 'In-Production',        icon: 'precision_manufacturing' },
  { key: 'Production Completed', label: 'Production Completed', icon: 'done_all' },
  { key: 'E-WayBill',            label: 'E-WayBill',            icon: 'receipt_long' },
  { key: 'In Delivery',          label: 'In Delivery',          icon: 'local_shipping' },
  { key: 'E-Invoice',            label: 'E-Invoice',            icon: 'request_quote' },
  { key: 'Delivered',            label: 'Delivered',            icon: 'inventory' },
]

function PermissionGrid({ columns, getValue, onToggle, saving, emptyMessage }) {
  const { roles } = useData()
  if (roles.length === 0) return <p className="text-sm text-text-muted">{emptyMessage}</p>
  return (
    <div className="rounded-2xl border border-theme-border overflow-auto max-h-[420px]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-theme-border bg-surface-container-high text-text-muted text-xs uppercase tracking-wider sticky top-0 z-10">
            <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-surface-container-high">Role</th>
            {columns.map((c) => (
              <th key={c.key} className="text-center px-3 py-3 font-semibold whitespace-nowrap bg-surface-container-high">
                <div className="flex flex-col items-center gap-1">
                  {c.icon && <span className="material-symbols-outlined text-base">{c.icon}</span>}
                  {c.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface-container-lowest">
          {roles.map((r) => (
            <tr key={r.id} className="border-b border-theme-border last:border-0">
              <td className="px-4 py-3 font-medium text-on-surface sticky left-0 bg-surface-container-lowest">
                <div className="flex items-center gap-2">
                  {saving[r.name] && <span className="material-symbols-outlined text-base text-text-muted animate-spin">progress_activity</span>}
                  {r.name}
                </div>
              </td>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={getValue(r.name, c.key)}
                    onChange={() => onToggle(r.name, c.key)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </td>
              ))}
            </tr>
          ))}
          </tbody>
        </table>
    </div>
  )
}

function PageAccessTab() {
  const { permissions, updateRolePermissions } = useData()
  const [saving, setSaving] = useState({})

  async function toggle(roleName, pageKey) {
    const current = permissions[roleName] || []
    const next = current.includes(pageKey) ? current.filter((p) => p !== pageKey) : [...current, pageKey]
    setSaving((s) => ({ ...s, [roleName]: true }))
    try { await updateRolePermissions(roleName, next) }
    finally { setSaving((s) => ({ ...s, [roleName]: false })) }
  }

  return (
    <div>
      <p className="text-sm text-text-muted mb-4">Choose which pages each role can access.</p>
      <PermissionGrid
        columns={PAGES}
        getValue={(role, key) => (permissions[role] || []).includes(key)}
        onToggle={toggle}
        saving={saving}
        emptyMessage="Add roles first before configuring page permissions."
      />
    </div>
  )
}

function StatusChangesTab() {
  const { statusPermissions, updateRoleStatusPermissions } = useData()
  const [saving, setSaving] = useState({})

  async function toggle(roleName, statusKey) {
    const current = statusPermissions[roleName] || []
    const next = current.includes(statusKey) ? current.filter((s) => s !== statusKey) : [...current, statusKey]
    setSaving((s) => ({ ...s, [roleName]: true }))
    try { await updateRoleStatusPermissions(roleName, next) }
    finally { setSaving((s) => ({ ...s, [roleName]: false })) }
  }

  return (
    <div>
      <p className="text-sm text-text-muted mb-4">Choose which order statuses each role can change to.</p>
      <PermissionGrid
        columns={ORDER_STATUSES}
        getValue={(role, key) => (statusPermissions[role] || []).includes(key)}
        onToggle={toggle}
        saving={saving}
        emptyMessage="Add roles first before configuring status permissions."
      />
    </div>
  )
}

// ─── Permissions Tab ──────────────────────────────────────────────────────────
function PermissionsTab() {
  const [subTab, setSubTab] = useState('pages')

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-theme-border">
        <button
          onClick={() => setSubTab('pages')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${subTab === 'pages' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-base">web</span>
          Page Access
        </button>
        <button
          onClick={() => setSubTab('statuses')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${subTab === 'statuses' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-base">swap_horiz</span>
          Status Changes
        </button>
      </div>
      {subTab === 'pages'    && <PageAccessTab />}
      {subTab === 'statuses' && <StatusChangesTab />}
    </div>
  )
}

// ─── Machines Tab ─────────────────────────────────────────────────────────────
function MachinesTab() {
  const { machines, addMachine, updateMachine, deleteMachine } = useData()
  const [modal, setModal] = useState(null) // null | 'new' | machine object
  const [viewMachine, setViewMachine] = useState(null)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = machines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase()) ||
    (m.location || '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave(form) {
    try {
      setError('')
      if (modal === 'new') {
        await addMachine(form)
        setModal(null)
      } else {
        await updateMachine(modal.id, form)
        setModal(null)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const isWarrantyExpiring = (date) => {
    if (!date) return false
    const d = new Date(date)
    const in60 = new Date()
    in60.setDate(in60.getDate() + 60)
    return d <= in60 && d >= new Date()
  }

  const isMaintenanceDue = (date) => {
    if (!date) return false
    const d = new Date(date)
    const in14 = new Date()
    in14.setDate(in14.getDate() + 14)
    return d <= in14
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-text-muted">Manage factory machines and maintenance records.</p>
        <button
          onClick={() => { setError(''); setModal('new') }}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Machine
        </button>
      </div>

      {error && <p className="text-xs text-error mb-3">{error}</p>}

      <div className="relative mb-4 max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
        <input
          className="w-full bg-surface-container-lowest border border-theme-border rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          placeholder="Search machines…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-sm text-text-muted">
          {machines.length === 0 ? 'No machines added yet. Click "Add Machine" to get started.' : 'No machines match your search.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((m) => {
            const yearTasks = (m.monthlyMaintenance || []).filter((t) => t.year === new Date().getFullYear())
            const completedThisYear = yearTasks.filter((t) => t.completed).length
            const totalThisYear = yearTasks.length
            return (
              <div
                key={m.id}
                onClick={() => setViewMachine(m)}
                className="bg-surface-container-lowest rounded-2xl border border-theme-border p-4 flex items-start gap-4 hover:shadow-sm transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">precision_manufacturing</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-on-surface text-sm">{m.name}</span>
                    <span className="font-mono text-xs text-text-muted">{m.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[m.status] || 'bg-surface-container-high text-text-muted'}`}>{m.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-text-muted">
                    {m.location && <span><span className="material-symbols-outlined text-xs align-middle mr-0.5">location_on</span>{m.location}</span>}
                    {m.manufacturer && <span><span className="material-symbols-outlined text-xs align-middle mr-0.5">factory</span>{m.manufacturer}</span>}
                    {m.productionYear && <span>Year: {m.productionYear}</span>}
                    {m.warrantyExpiry && (
                      <span className={isWarrantyExpiring(m.warrantyExpiry) ? 'text-amber-600 font-medium' : ''}>
                        Warranty: {m.warrantyExpiry}{isWarrantyExpiring(m.warrantyExpiry) ? ' ⚠' : ''}
                      </span>
                    )}
                    {m.nextMaintenanceDue && (
                      <span className={isMaintenanceDue(m.nextMaintenanceDue) ? 'text-red-600 font-medium' : ''}>
                        Next maint: {m.nextMaintenanceDue}{isMaintenanceDue(m.nextMaintenanceDue) ? ' !' : ''}
                      </span>
                    )}
                    {totalThisYear > 0 && <span>{completedThisYear}/{totalThisYear} tasks done this year</span>}
                    {m.manualName && <span className="text-primary"><span className="material-symbols-outlined text-xs align-middle mr-0.5">menu_book</span>Manual uploaded</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { setError(''); setModal(m) }}
                    className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-primary transition"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  {deletingId === m.id ? (
                    <span className="flex items-center gap-1">
                      <button onClick={async () => { await deleteMachine(m.id); setDeletingId(null) }} className="text-xs font-semibold text-white bg-error px-2 py-1 rounded-lg transition">Yes</button>
                      <button onClick={() => setDeletingId(null)} className="text-xs text-text-muted px-1 transition">No</button>
                    </span>
                  ) : (
                    <button onClick={() => setDeletingId(m.id)} className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-error transition">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewMachine && (
        <MachineViewModal
          machine={viewMachine}
          onClose={() => setViewMachine(null)}
          onEdit={() => { setViewMachine(null); setError(''); setModal(viewMachine) }}
        />
      )}

      {modal && (
        <MachineModal
          machine={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
// ─── API Tools Tab ────────────────────────────────────────────────────────────
const STORAGE_KEY = 'aks_api_connections'

function loadConnections() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveConnections(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const emptyConn = () => ({
  id: crypto.randomUUID(),
  name: '',
  url: '',
  method: 'GET',
  apiKeyHeader: 'Authorization',
  apiKey: '',
  extraHeaders: '',
  description: '',
})

function CurrencyRatesConfig() {
  const { token } = useAuth()
  const [cfg, setCfg]         = useState(() => ({
    url:          DEFAULT_RATES_URL,
    ratesPath:    DEFAULT_RATES_PATH,
    base:         DEFAULT_BASE,
    apiKey:       '',
    apiKeyHeader: 'Authorization',
    ...loadRatesConfig(),
  }))
  const [testing, setTesting] = useState(false)
  const [preview, setPreview] = useState(null)   // { ok, sample } | { error }
  const [saved, setSaved]     = useState(false)

  const inp = 'w-full bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition'

  function getAtPath(obj, path) {
    if (!path) return obj
    return path.split('.').reduce((o, k) => o?.[k], obj)
  }

  async function testAndSave() {
    setTesting(true)
    setPreview(null)
    setSaved(false)
    try {
      const headers = cfg.apiKey ? { [cfg.apiKeyHeader || 'Authorization']: cfg.apiKey } : {}
      const res  = await fetch(cfg.url, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const json = await res.json()
      const ratesObj = getAtPath(json, cfg.ratesPath)
      if (!ratesObj || typeof ratesObj !== 'object') {
        throw new Error(`No object found at path "${cfg.ratesPath}"`)
      }
      // Show a sample of the rates
      const sample = Object.entries(ratesObj).slice(0, 8).map(([k, v]) => `${k}: ${Number(v).toFixed(4)}`).join('  ·  ')
      setPreview({ ok: true, sample, total: Object.keys(ratesObj).length })
      saveRatesConfig(cfg)
      setSaved(true)
    } catch (err) {
      setPreview({ error: err.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-xl">currency_exchange</span>
        <div>
          <h3 className="text-sm font-bold text-on-surface">Currency Rates Source</h3>
          <p className="text-xs text-text-muted">Configure which API provides live exchange rates for Finance &amp; Orders pages.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1">API URL</label>
          <input className={inp} value={cfg.url} onChange={e => setCfg(v => ({ ...v, url: e.target.value }))} placeholder={DEFAULT_RATES_URL} />
          <p className="text-[10px] text-text-muted mt-0.5">Default: open.er-api.com (free, no key required)</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">JSON Path to Rates Object</label>
            <input className={inp} value={cfg.ratesPath} onChange={e => setCfg(v => ({ ...v, ratesPath: e.target.value }))} placeholder="rates" />
            <p className="text-[10px] text-text-muted mt-0.5">e.g. <span className="font-mono">rates</span> or <span className="font-mono">data.quotes</span></p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Base Currency</label>
            <input className={inp} value={cfg.base} onChange={e => setCfg(v => ({ ...v, base: e.target.value.toUpperCase() }))} placeholder="USD" maxLength={5} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">API Key (if required)</label>
            <input className={inp} value={cfg.apiKey} onChange={e => setCfg(v => ({ ...v, apiKey: e.target.value }))} placeholder="Leave blank if not needed" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">API Key Header</label>
            <input className={inp} value={cfg.apiKeyHeader} onChange={e => setCfg(v => ({ ...v, apiKeyHeader: e.target.value }))} placeholder="Authorization" />
          </div>
        </div>

        <button
          onClick={testAndSave}
          disabled={testing || !cfg.url}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">{testing ? 'hourglass_empty' : 'bolt'}</span>
          {testing ? 'Testing…' : 'Test & Save'}
        </button>

        {preview?.ok && (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Connected — {preview.total} currencies available. Config saved.
            </p>
            <p className="text-[11px] text-green-600 font-mono">{preview.sample}</p>
          </div>
        )}
        {preview?.error && (
          <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-xs text-error">
            <span className="font-semibold">Error: </span>{preview.error}
          </div>
        )}
      </div>
    </div>
  )
}

function ApiTab() {
  const { token } = useAuth()
  const [connections, setConnections] = useState(loadConnections)
  const [selected, setSelected] = useState(null)   // connection id
  const [editing, setEditing]   = useState(null)   // connection object being edited
  const [isNew, setIsNew]       = useState(false)
  const [queryParams, setQueryParams] = useState('')
  const [reqBody, setReqBody]   = useState('')
  const [result, setResult]     = useState(null)   // { status, elapsed, data, error }
  const [loading, setLoading]   = useState(false)

  const inp = 'w-full bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition'

  const selectedConn = connections.find(c => c.id === selected)

  function persist(list) { setConnections(list); saveConnections(list) }

  function openNew() {
    const c = emptyConn()
    setEditing(c)
    setIsNew(true)
    setSelected(null)
    setResult(null)
  }

  function openEdit(conn) {
    setEditing({ ...conn })
    setIsNew(false)
    setSelected(conn.id)
    setResult(null)
  }

  function cancelEdit() {
    setEditing(null)
    setIsNew(false)
  }

  function saveEdit() {
    if (!editing.name.trim() || !editing.url.trim()) return
    if (isNew) {
      persist([editing, ...connections])
      setSelected(editing.id)
    } else {
      persist(connections.map(c => c.id === editing.id ? editing : c))
    }
    setEditing(null)
    setIsNew(false)
  }

  function deleteConn(id) {
    persist(connections.filter(c => c.id !== id))
    if (selected === id) { setSelected(null); setResult(null) }
  }

  async function runRequest(conn) {
    setLoading(true)
    setResult(null)
    try {
      // Build headers
      const headers = {}
      if (conn.apiKey) headers[conn.apiKeyHeader || 'Authorization'] = conn.apiKey
      if (conn.extraHeaders) {
        try {
          Object.assign(headers, JSON.parse(conn.extraHeaders))
        } catch { /* ignore malformed extra headers */ }
      }

      // Append query params
      let url = conn.url
      if (queryParams.trim()) {
        url += (url.includes('?') ? '&' : '?') + queryParams.trim()
      }

      const body = conn.method !== 'GET' && reqBody.trim() ? reqBody.trim() : undefined

      const res = await fetch(`${API_URL}/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, headers, method: conn.method, body }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Proxy error')
      setResult(json)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const methodColor = { GET: 'text-green-600', POST: 'text-blue-600', PUT: 'text-amber-600', DELETE: 'text-red-500', PATCH: 'text-purple-600' }

  return (
    <div>
      <CurrencyRatesConfig />
      <div className="flex gap-6" style={{ minHeight: 500 }}>
      {/* Sidebar — connection list */}
      <div className="w-64 shrink-0">
        <button
          onClick={openNew}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition mb-3"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Connection
        </button>

        <div className="space-y-1.5">
          {connections.length === 0 && (
            <p className="text-xs text-text-muted text-center py-8">No connections yet</p>
          )}
          {connections.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelected(c.id); setEditing(null); setIsNew(false); setResult(null) }}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${selected === c.id && !editing ? 'border-primary bg-primary/5' : 'border-theme-border hover:bg-hover-bg'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${methodColor[c.method] || 'text-text-muted'}`}>{c.method}</span>
                <span className="text-sm font-semibold text-on-surface truncate">{c.name}</span>
              </div>
              {c.description && <p className="text-xs text-text-muted truncate mt-0.5">{c.description}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 min-w-0">
        {/* ── Edit / New form ── */}
        {editing ? (
          <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-on-surface mb-1">{isNew ? 'New Connection' : 'Edit Connection'}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Name *</label>
                <input className={inp} value={editing.name} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} placeholder="e.g. Exchange Rates API" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Method</label>
                <select className={inp} value={editing.method} onChange={e => setEditing(v => ({ ...v, method: e.target.value }))}>
                  {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Base URL *</label>
              <input className={inp} value={editing.url} onChange={e => setEditing(v => ({ ...v, url: e.target.value }))} placeholder="https://api.example.com/endpoint" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">API Key / Token</label>
                <input className={inp} value={editing.apiKey} onChange={e => setEditing(v => ({ ...v, apiKey: e.target.value }))} placeholder="Bearer your-token or key" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">API Key Header</label>
                <input className={inp} value={editing.apiKeyHeader} onChange={e => setEditing(v => ({ ...v, apiKeyHeader: e.target.value }))} placeholder="Authorization" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Extra Headers <span className="font-normal text-text-muted">(JSON)</span></label>
              <input className={inp} value={editing.extraHeaders} onChange={e => setEditing(v => ({ ...v, extraHeaders: e.target.value }))} placeholder='{"X-Custom-Header": "value"}' />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Description</label>
              <input className={inp} value={editing.description} onChange={e => setEditing(v => ({ ...v, description: e.target.value }))} placeholder="What does this API return?" />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={cancelEdit} className="flex-1 border border-theme-border rounded-xl py-2 text-sm text-text-muted hover:bg-hover-bg transition">Cancel</button>
              <button
                onClick={saveEdit}
                disabled={!editing.name.trim() || !editing.url.trim()}
                className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
              >
                Save Connection
              </button>
            </div>
          </div>
        ) : selectedConn ? (
          /* ── Connection detail + runner ── */
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-surface-container-high ${methodColor[selectedConn.method]}`}>{selectedConn.method}</span>
                    <h3 className="text-base font-bold text-on-surface">{selectedConn.name}</h3>
                  </div>
                  <p className="font-mono text-xs text-text-muted break-all">{selectedConn.url}</p>
                  {selectedConn.description && <p className="text-xs text-text-muted mt-1">{selectedConn.description}</p>}
                  {selectedConn.apiKey && (
                    <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">key</span>
                      {selectedConn.apiKeyHeader}: <span className="font-mono">{'•'.repeat(Math.min(selectedConn.apiKey.length, 20))}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(selectedConn)} className="p-2 rounded-lg hover:bg-hover-bg text-text-muted hover:text-primary transition">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button onClick={() => deleteConn(selectedConn.id)} className="p-2 rounded-lg hover:bg-hover-bg text-text-muted hover:text-error transition">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Request runner */}
            <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Run Request</h4>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Query Parameters</label>
                <input
                  className={inp}
                  value={queryParams}
                  onChange={e => setQueryParams(e.target.value)}
                  placeholder="key=value&another=value"
                />
              </div>

              {selectedConn.method !== 'GET' && (
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Request Body (JSON)</label>
                  <textarea
                    rows={3}
                    className={inp + ' font-mono text-xs'}
                    value={reqBody}
                    onChange={e => setReqBody(e.target.value)}
                    placeholder='{"key": "value"}'
                  />
                </div>
              )}

              <button
                onClick={() => runRequest(selectedConn)}
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">{loading ? 'hourglass_empty' : 'send'}</span>
                {loading ? 'Fetching…' : 'Send Request'}
              </button>
            </div>

            {/* Response */}
            {result && (
              <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Response</h4>
                  {result.error ? (
                    <span className="text-xs font-semibold text-error bg-error/10 px-2 py-0.5 rounded-full">Error</span>
                  ) : (
                    <>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.status < 300 ? 'bg-green-100 text-green-700' : result.status < 400 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                        {result.status} {result.statusText}
                      </span>
                      <span className="text-xs text-text-muted">{result.elapsed}ms</span>
                      {result.contentType && <span className="text-xs text-text-muted font-mono">{result.contentType.split(';')[0]}</span>}
                    </>
                  )}
                </div>
                <pre className="bg-surface-container-high rounded-xl p-3 text-xs font-mono text-on-surface overflow-auto max-h-96 whitespace-pre-wrap break-all">
                  {result.error
                    ? result.error
                    : typeof result.data === 'string'
                      ? result.data
                      : JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-text-muted">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-30">api</span>
            <p className="text-base font-medium">No connection selected</p>
            <p className="text-sm mt-1">Create a new connection or select one from the list.</p>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

const TABS = [
  { key: 'users',       label: 'Users',        icon: 'manage_accounts' },
  { key: 'roles',       label: 'User Roles',   icon: 'badge' },
  { key: 'permissions', label: 'Permissions',  icon: 'lock' },
  { key: 'machines',    label: 'Machines',     icon: 'precision_manufacturing' },
  { key: 'api',         label: 'API Tools',    icon: 'api' },
]

export default function Settings() {
  const [tab, setTab] = useState('roles')

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">System configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-theme-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users'       && <Users />}
      {tab === 'roles'       && <UserRolesTab />}
      {tab === 'permissions' && <PermissionsTab />}
      {tab === 'machines'    && <MachinesTab />}
      {tab === 'api'         && <ApiTab />}
    </div>
  )
}
