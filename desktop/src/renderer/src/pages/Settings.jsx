import { useState, useRef } from 'react'
import { useData } from '../context/DataContext'
import Users from './Users'

const API_URL = 'http://localhost:3001/api'

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
  { key: 'production',  label: 'Production',  icon: 'precision_manufacturing' },
  { key: 'maintenance', label: 'Maintenance', icon: 'build' },
  { key: 'logistics',   label: 'Logistics',   icon: 'local_shipping' },
]

// ─── User Roles Tab ───────────────────────────────────────────────────────────
function UserRolesTab() {
  const { roles, addRole, deleteRole } = useData()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  async function handleAdd() {
    if (!input.trim()) return
    try {
      setError('')
      await addRole(input.trim())
      setInput('')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="max-w-lg">
      <p className="text-sm text-text-muted mb-6">Manage department roles that can be assigned to users.</p>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          placeholder="Role name…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add
        </button>
      </div>
      {error && <p className="text-xs text-error mb-3">{error}</p>}

      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        {roles.length === 0 ? (
          <p className="text-center py-10 text-sm text-text-muted">No roles defined yet</p>
        ) : (
          roles.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-theme-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-text-muted">badge</span>
                <span className="text-sm font-medium text-on-surface">{r.name}</span>
              </div>
              {deletingId === r.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted mr-1">Sure?</span>
                  <button
                    onClick={async () => { await deleteRole(r.id); setDeletingId(null) }}
                    className="text-xs font-semibold text-white bg-error hover:opacity-90 px-2 py-1 rounded-lg transition"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="text-xs text-text-muted hover:text-on-surface px-2 py-1 rounded transition"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingId(r.id)}
                  className="text-text-muted hover:text-error transition"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
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
const TABS = [
  { key: 'users',       label: 'Users',        icon: 'manage_accounts' },
  { key: 'roles',       label: 'User Roles',   icon: 'badge' },
  { key: 'permissions', label: 'Permissions',  icon: 'lock' },
  { key: 'machines',    label: 'Machines',     icon: 'precision_manufacturing' },
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
    </div>
  )
}
