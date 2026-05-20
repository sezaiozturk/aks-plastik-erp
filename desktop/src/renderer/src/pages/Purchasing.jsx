import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { API_URL } from '../config'

// ── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'JPY', 'CNY', 'INR', 'CAD', 'AUD']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const CATEGORIES = ['General', 'Raw Materials', 'Equipment', 'Services', 'IT & Software', 'Logistics', 'Spare Parts', 'Office Supplies', 'Other']
const SUPPLIER_CATEGORIES = ['General', 'Raw Materials', 'Equipment', 'Services', 'IT & Software', 'Logistics', 'Other']

const WORKFLOW_STAGES = [
  { key: 'Request',           label: 'Request',            icon: 'edit_note',          color: 'text-blue-500',   bg: 'bg-blue-500' },
  { key: 'Budget Review',     label: 'Budget Review',      icon: 'account_balance',    color: 'text-amber-500',  bg: 'bg-amber-500' },
  { key: 'Collecting Quotes', label: 'Collecting Quotes',  icon: 'request_quote',      color: 'text-purple-500', bg: 'bg-purple-500' },
  { key: 'Comparison',        label: 'Comparison',         icon: 'compare_arrows',     color: 'text-indigo-500', bg: 'bg-indigo-500' },
  { key: 'Pending Approval',  label: 'Pending Approval',   icon: 'approval',           color: 'text-orange-500', bg: 'bg-orange-500' },
  { key: 'PO Created',        label: 'PO Created',         icon: 'receipt_long',       color: 'text-cyan-600',   bg: 'bg-cyan-600' },
  { key: 'In Logistics',      label: 'In Logistics',       icon: 'local_shipping',     color: 'text-teal-500',   bg: 'bg-teal-500' },
  { key: 'Quality Check',     label: 'Quality Check',      icon: 'verified',           color: 'text-lime-600',   bg: 'bg-lime-600' },
  { key: 'Invoice Matching',  label: 'Invoice Matching',   icon: 'receipt',            color: 'text-pink-500',   bg: 'bg-pink-500' },
  { key: 'Payment',           label: 'Payment',            icon: 'payments',           color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { key: 'Completed',         label: 'Completed',          icon: 'check_circle',       color: 'text-green-600',  bg: 'bg-green-600' },
]

const TERMINAL = ['Completed', 'Rejected', 'Cancelled']

const STATUS_BADGE = {
  'Request':           'bg-blue-500/10 text-blue-600',
  'Budget Review':     'bg-amber-500/10 text-amber-600',
  'Budget Rejected':   'bg-red-500/10 text-red-600',
  'Collecting Quotes': 'bg-purple-500/10 text-purple-600',
  'Comparison':        'bg-indigo-500/10 text-indigo-600',
  'Pending Approval':  'bg-orange-500/10 text-orange-600',
  'PO Created':        'bg-cyan-600/10 text-cyan-700',
  'In Logistics':      'bg-teal-500/10 text-teal-600',
  'Quality Check':     'bg-lime-600/10 text-lime-700',
  'QC Rejected':       'bg-red-500/10 text-red-600',
  'Invoice Matching':  'bg-pink-500/10 text-pink-600',
  'Payment':           'bg-emerald-500/10 text-emerald-600',
  'Completed':         'bg-green-600/10 text-green-700',
  'Rejected':          'bg-red-500/10 text-red-600',
  'Cancelled':         'bg-surface-container text-text-muted',
}

const PRIORITY_COLOR = {
  Low: 'bg-surface-container text-text-muted',
  Medium: 'bg-blue-500/10 text-blue-600',
  High: 'bg-amber-500/10 text-amber-600',
  Urgent: 'bg-red-500/10 text-red-600',
}

function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container ${color}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-text-muted font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-on-surface leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-text-muted truncate">{sub}</p>}
      </div>
    </div>
  )
}

// ── Request Modal ────────────────────────────────────────────────────────────
function RequestModal({ initial, onClose, onSave }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    title: '', description: '', department: '', requestedBy: '',
    priority: 'Medium', category: 'General', estimatedAmount: '',
    currency: 'TRY', budgetCode: '', notes: '',
    ...(initial || {}),
  })
  const [errors, setErrors] = useState({})
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  const inp = (f) => `w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${errors[f] ? 'border-error' : 'border-theme-border'}`

  function handleSave() {
    const e = {}
    if (!form.title.trim()) e.title = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-7 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-on-surface">{initial?.id ? 'Edit Request' : 'New Purchase Request'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.title')} *</label>
            <input className={inp('title')} value={form.title} onChange={set('title')} placeholder="e.g. CNC Machine Spare Parts Purchase" />
            {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.description')}</label>
            <textarea rows={2} className={inp('description')} value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.department')}</label>
              <input className={inp('department')} value={form.department} onChange={set('department')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Requested By</label>
              <input className={inp('requestedBy')} value={form.requestedBy} onChange={set('requestedBy')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.priority')}</label>
              <select className={inp('priority')} value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.category')}</label>
              <select className={inp('category')} value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Budget Code</label>
              <input className={inp('budgetCode')} value={form.budgetCode} onChange={set('budgetCode')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Estimated Amount</label>
              <input type="number" min="0" step="0.01" className={inp('estimatedAmount')} value={form.estimatedAmount} onChange={set('estimatedAmount')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.currency')}</label>
              <select className={inp('currency')} value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.notes')}</label>
            <textarea rows={2} className={inp('notes')} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">{t('common.cancel')}</button>
          <button onClick={handleSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">{t('common.save')}</button>
        </div>
      </div>
    </div>
  )
}

// ── Quotation Modal ──────────────────────────────────────────────────────────
function QuotationModal({ suppliers, initial, onClose, onSave }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(initial || {
    supplierId: '', supplierName: '', quotationNo: '', quotationDate: new Date().toISOString().split('T')[0],
    amount: '', currency: 'TRY', vat: '20', deliveryDays: '', paymentTerms: '', warranty: '', notes: '',
  })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  const inp = (f) => `w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition`

  function handleSave() {
    if (!form.amount) return
    if (form.supplierId) {
      const sup = suppliers.find((s) => s.id === form.supplierId)
      if (sup) form.supplierName = sup.name
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-7 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-on-surface">{initial ? 'Edit Quotation' : 'Add New Quotation'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">{t('purchasing.supplier')}</label>
            <select className={inp('supplierId')} value={form.supplierId} onChange={set('supplierId')}>
              <option value="">-- Manual Entry --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {!form.supplierId && (
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Supplier Adi</label>
              <input className={inp('supplierName')} value={form.supplierName} onChange={set('supplierName')} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Quote No</label>
              <input className={inp('quotationNo')} value={form.quotationNo} onChange={set('quotationNo')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Quote Date</label>
              <input type="date" className={inp('quotationDate')} value={form.quotationDate} onChange={set('quotationDate')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Amount *</label>
              <input type="number" min="0" step="0.01" className={inp('amount')} value={form.amount} onChange={set('amount')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">VAT %</label>
              <input type="number" min="0" max="100" className={inp('vat')} value={form.vat} onChange={set('vat')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.currency')}</label>
              <select className={inp('currency')} value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Delivery (days)</label>
              <input type="number" min="0" className={inp('deliveryDays')} value={form.deliveryDays} onChange={set('deliveryDays')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Warranty</label>
              <input className={inp('warranty')} value={form.warranty} onChange={set('warranty')} placeholder="e.g. 2 Years" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Payment Terms</label>
            <input className={inp('paymentTerms')} value={form.paymentTerms} onChange={set('paymentTerms')} placeholder="e.g. Net 30 days" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.notes')}</label>
            <textarea rows={2} className={inp('notes')} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">{t('common.cancel')}</button>
          <button onClick={handleSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">{t('common.save')}</button>
        </div>
      </div>
    </div>
  )
}

// ── Supplier Modal ───────────────────────────────────────────────────────────
function SupplierModal({ initial, onClose, onSave }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(initial || {
    name: '', category: 'General', contactName: '', contactPhone: '',
    contactEmail: '', address: '', country: '', currency: 'TRY', status: 'Active', notes: '',
  })
  const [errors, setErrors] = useState({})
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  const inp = (f) => `w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${errors[f] ? 'border-error' : 'border-theme-border'}`

  function handleSave() {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-7 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-on-surface">{initial ? 'Edit Supplier' : 'New Supplier'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Company Name *</label>
            <input className={inp('name')} value={form.name} onChange={set('name')} />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.category')}</label>
              <select className={inp('category')} value={form.category} onChange={set('category')}>
                {SUPPLIER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.status')}</label>
              <select className={inp('status')} value={form.status} onChange={set('status')}>
                <option>Active</option><option>Inactive</option><option>Blacklisted</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Contact Person</label>
              <input className={inp('contactName')} value={form.contactName} onChange={set('contactName')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.phone')}</label>
              <input className={inp('contactPhone')} value={form.contactPhone} onChange={set('contactPhone')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">E-Mail</label>
            <input className={inp('contactEmail')} value={form.contactEmail} onChange={set('contactEmail')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.country')}</label>
              <input className={inp('country')} value={form.country} onChange={set('country')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.currency')}</label>
              <select className={inp('currency')} value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.address')}</label>
            <input className={inp('address')} value={form.address} onChange={set('address')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">{t('common.notes')}</label>
            <textarea rows={2} className={inp('notes')} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">{t('common.cancel')}</button>
          <button onClick={handleSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">{t('common.save')}</button>
        </div>
      </div>
    </div>
  )
}

// ── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ request, suppliers, onClose, onEdit, onDelete, onUpdate, onAddQuotation, onSelectQuotation, onDeleteQuotation, canCreateEdit }) {
  const { t } = useTranslation()
  const r = request
  const { user } = useAuth()
  const { userPurchasingStatusPermissions } = useData()
  const stageIdx = WORKFLOW_STAGES.findIndex((s) => s.key === r.status)
  const quotations = r.quotations || []
  const selectedQuote = quotations.find((q) => q.selected)
  const isTerminal = TERMINAL.includes(r.status)
  const isAdmin = user?.role === 'admin'
  const canEditDelete = isAdmin || (canCreateEdit && r.status === 'Request')
  const canAdvanceFromCurrent = isAdmin || (userPurchasingStatusPermissions[user?.id] || []).includes(r.status)

  function nextStatus() {
    const map = {
      'Request': 'Budget Review',
      'Budget Review': 'Collecting Quotes',
      'Collecting Quotes': 'Comparison',
      'Comparison': 'Pending Approval',
      'Pending Approval': 'PO Created',
      'PO Created': 'In Logistics',
      'In Logistics': 'Quality Check',
      'Quality Check': 'Invoice Matching',
      'Invoice Matching': 'Payment',
      'Payment': 'Completed',
    }
    return map[r.status]
  }

  function canAdvance() {
    if (isTerminal) return false
    if (!canAdvanceFromCurrent) return false
    if (r.status === 'Collecting Quotes' && quotations.length < 3) return false
    if (r.status === 'Comparison' && !selectedQuote) return false
    return true
  }

  function advanceLabel() {
    const labels = {
      'Request': 'Send to Budget Review',
      'Budget Review': 'Approve Budget & Collect Quotes',
      'Collecting Quotes': 'Go to Comparison',
      'Comparison': 'Send for Management Approval',
      'Pending Approval': 'Approve & Create PO',
      'PO Created': 'Send to Logistics',
      'In Logistics': 'Send to Quality Check',
      'Quality Check': 'Accept & Match Invoice',
      'Invoice Matching': 'Move to Payment',
      'Payment': 'Complete',
    }
    return labels[r.status] || 'Advance'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl rounded-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-theme-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-text-muted">{r.code}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[r.status] || 'bg-surface-container text-text-muted'}`}>
                {r.status}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLOR[r.priority]}`}>
                {r.priority}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {canEditDelete && <button onClick={onEdit} className="text-text-muted hover:text-primary transition p-1 rounded-lg hover:bg-hover-bg" title="Edit"><span className="material-symbols-outlined text-sm">edit</span></button>}
              {canEditDelete && <button onClick={onDelete} className="text-text-muted hover:text-error transition p-1 rounded-lg hover:bg-hover-bg" title="Delete"><span className="material-symbols-outlined text-sm">delete</span></button>}
              <button onClick={onClose} className="text-text-muted hover:text-error p-1 rounded-lg hover:bg-hover-bg"><span className="material-symbols-outlined">close</span></button>
            </div>
          </div>
          <h2 className="text-lg font-bold text-on-surface">{r.title}</h2>
          {r.description && <p className="text-sm text-text-muted mt-1">{r.description}</p>}
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Progress bar */}
          <div>
            <p className="text-xs font-semibold text-text-muted mb-2">Process Status</p>
            <div className="flex items-center gap-0.5">
              {WORKFLOW_STAGES.map((stage, i) => (
                <div key={stage.key} className="flex items-center flex-1">
                  <div className={`h-1.5 w-full rounded-full ${i <= stageIdx ? stage.bg : 'bg-theme-border'}`} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">{WORKFLOW_STAGES[0]?.label}</span>
              <span className="text-[10px] text-text-muted">{WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1]?.label}</span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Department', r.department],
              ['Requested By', r.requestedBy],
              ['Category', r.category],
              ['Estimated Amount', `${r.currency} ${fmt(r.estimatedAmount)}`],
              ['Budget Code', r.budgetCode],
              ['Date', new Date(r.createdAt).toLocaleDateString('en-US')],
            ].map(([label, val]) => (
              <div key={label} className="bg-surface-container rounded-lg p-3">
                <p className="text-[10px] font-semibold text-text-muted uppercase">{label}</p>
                <p className="text-sm font-medium text-on-surface mt-0.5">{val || '—'}</p>
              </div>
            ))}
          </div>

          {/* Stage-specific: Budget Review */}
          {r.status === 'Budget Review' && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-600 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">account_balance</span> Budget Review
              </p>
              <p className="text-xs text-text-muted mb-3">Tahmini tutar: <strong>{r.currency} {fmt(r.estimatedAmount)}</strong></p>
              <textarea
                className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none mb-2"
                rows={2}
                placeholder="Budget note (optional)..."
                value={r.budgetNotes || ''}
                onChange={(e) => onUpdate({ budgetNotes: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ status: 'Rejected', rejectionReason: 'Budget not approved', budgetApproved: false })}
                  className="px-4 py-1.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition"
                >
                  Reject Budget
                </button>
              </div>
            </div>
          )}

          {/* Stage-specific: Quotations */}
          {['Collecting Quotes', 'Comparison', 'Pending Approval'].includes(r.status) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-purple-500">request_quote</span>
                  Quotations ({quotations.length}/3 min.)
                </p>
                {r.status === 'Collecting Quotes' && (
                  <button onClick={onAddQuotation} className="flex items-center gap-1 text-xs text-primary hover:opacity-80 font-semibold">
                    <span className="material-symbols-outlined text-sm">add</span> Add Quote
                  </button>
                )}
              </div>
              {quotations.length === 0 ? (
                <div className="border border-dashed border-theme-border rounded-lg p-6 text-center text-xs text-text-muted">
                  No quotations added yet
                </div>
              ) : (
                <div className="border border-theme-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-container text-text-muted">
                        <th className="px-3 py-2 text-left font-semibold">Supplier</th>
                        <th className="px-3 py-2 text-left font-semibold">Tutar</th>
                        <th className="px-3 py-2 text-left font-semibold">KDV</th>
                        <th className="px-3 py-2 text-left font-semibold">Total</th>
                        <th className="px-3 py-2 text-left font-semibold">Delivery</th>
                        <th className="px-3 py-2 text-left font-semibold">Warranty</th>
                        <th className="px-3 py-2 text-left font-semibold">Payment</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {quotations.map((q) => {
                        const total = (q.amount || 0) * (1 + (q.vat || 0) / 100)
                        const isBest = quotations.length >= 3 && total === Math.min(...quotations.map((x) => (x.amount || 0) * (1 + (x.vat || 0) / 100)))
                        return (
                          <tr key={q.id} className={`${q.selected ? 'bg-green-500/5' : 'hover:bg-hover-bg'} transition-colors`}>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                {q.selected && <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>}
                                <span className="font-medium text-on-surface">{q.supplier?.name || q.supplierName || '—'}</span>
                              </div>
                              {q.quotationNo && <div className="text-[10px] text-text-muted">#{q.quotationNo}</div>}
                            </td>
                            <td className="px-3 py-2.5 font-mono">{q.currency} {fmt(q.amount)}</td>
                            <td className="px-3 py-2.5 text-text-muted">%{q.vat}</td>
                            <td className="px-3 py-2.5 font-mono font-semibold">
                              <span className={isBest ? 'text-green-600' : ''}>{q.currency} {fmt(total)}</span>
                              {isBest && <span className="ml-1 text-[9px] text-green-600 font-bold">LOWEST</span>}
                            </td>
                            <td className="px-3 py-2.5 text-text-muted">{q.deliveryDays ? `${q.deliveryDays} days` : '—'}</td>
                            <td className="px-3 py-2.5 text-text-muted">{q.warranty || '—'}</td>
                            <td className="px-3 py-2.5 text-text-muted">{q.paymentTerms || '—'}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1">
                                {r.status === 'Comparison' && !q.selected && (
                                  <button onClick={() => onSelectQuotation(q.id)} className="text-primary hover:opacity-80" title="Select this quote">
                                    <span className="material-symbols-outlined text-sm">task_alt</span>
                                  </button>
                                )}
                                {r.status === 'Collecting Quotes' && (
                                  <button onClick={() => onDeleteQuotation(q.id)} className="text-text-muted hover:text-error" title="Delete">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {r.status === 'Collecting Quotes' && quotations.length > 0 && quotations.length < 3 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  At least 3 quotations required (current: {quotations.length})
                </p>
              )}
            </div>
          )}

          {/* Stage-specific: Quality Check */}
          {r.status === 'Quality Check' && (
            <div className="bg-lime-500/5 border border-lime-500/20 rounded-xl p-4">
              <p className="text-sm font-bold text-lime-700 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified</span> Quality Check
              </p>
              <textarea
                className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none mb-2"
                rows={2}
                placeholder="Quality check notes..."
                value={r.qcNotes || ''}
                onChange={(e) => onUpdate({ qcNotes: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ status: 'QC Rejected', qcResult: 'Rejected', qcDate: new Date().toISOString().split('T')[0] })}
                  className="px-4 py-1.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Stage-specific: Invoice Matching */}
          {r.status === 'Invoice Matching' && (
            <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-pink-600 mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">receipt</span> Invoice Matching
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Invoice No</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none"
                    value={r.invoiceNo || ''}
                    onChange={(e) => onUpdate({ invoiceNo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Invoice Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none"
                    value={r.invoiceDate || ''}
                    onChange={(e) => onUpdate({ invoiceDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Invoice Amount</label>
                <input
                  type="number" min="0" step="0.01"
                  className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none"
                  value={r.invoiceAmount || ''}
                  onChange={(e) => onUpdate({ invoiceAmount: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Stage-specific: Payment */}
          {r.status === 'Payment' && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-emerald-600 mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">payments</span> Payment Schedule
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Payment Due Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none"
                    value={r.paymentDueDate || ''}
                    onChange={(e) => onUpdate({ paymentDueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Payment Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none"
                    value={r.paymentDate || ''}
                    onChange={(e) => onUpdate({ paymentDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {r.notes && (
            <div className="bg-surface-container rounded-xl p-4">
              <p className="text-[10px] font-semibold text-text-muted uppercase mb-1">Notes</p>
              <p className="text-sm text-on-surface whitespace-pre-wrap">{r.notes}</p>
            </div>
          )}

          {/* Rejection reason */}
          {['Rejected', 'Budget Rejected', 'QC Rejected'].includes(r.status) && r.rejectionReason && (
            <div className="bg-error/5 border border-error/20 rounded-xl p-4">
              <p className="text-xs font-bold text-error mb-1">Rejection Reason</p>
              <p className="text-sm text-on-surface">{r.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="bg-surface-container-lowest border-t border-theme-border px-6 py-4 flex items-center gap-3 rounded-b-2xl">
          {!isTerminal && (
            <>
              {canCreateEdit && (
                <button
                  onClick={() => onUpdate({ status: 'Cancelled' })}
                  className="px-4 py-2 rounded-lg border border-error/30 text-error text-xs font-semibold hover:bg-error/5 transition"
                >
                  Cancel Request
                </button>
              )}
              <div className="flex-1" />
              <button
                disabled={!canAdvance()}
                onClick={() => {
                  const updates = { status: nextStatus() }
                  if (r.status === 'Budget Review') updates.budgetApproved = true
                  if (r.status === 'Quality Check') {
                    updates.qcResult = 'Accepted'
                    updates.qcDate = new Date().toISOString().split('T')[0]
                  }
                  if (r.status === 'Invoice Matching') updates.invoiceMatched = true
                  onUpdate(updates)
                }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  canAdvance()
                    ? 'bg-primary text-white hover:opacity-90'
                    : 'bg-surface-container text-text-muted cursor-not-allowed'
                }`}
              >
                {advanceLabel()}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </>
          )}
          {isTerminal && (
            <div className="w-full text-center">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                r.status === 'Completed' ? 'bg-green-500/10 text-green-700' : 'bg-error/10 text-error'
              }`}>
                <span className="material-symbols-outlined text-sm">{r.status === 'Completed' ? 'check_circle' : 'cancel'}</span>
                {r.status === 'Completed' ? 'Process Completed' : `Process Ended (${r.status})`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Purchasing() {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const { permissions } = useData()
  const isAdmin = user?.role === 'admin'
  const canCreateEdit = isAdmin || (permissions[user?.department] || []).includes('purchasing:create')
  const BASE = `${API_URL}/purchasing`
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const authH = { Authorization: `Bearer ${token}` }

  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [requestModal, setRequestModal] = useState(null)
  const [supplierModal, setSupplierModal] = useState(null)
  const [quotationModal, setQuotationModal] = useState(null)
  const [detailDrawer, setDetailDrawer] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [reqRes, supRes] = await Promise.all([
        fetch(`${BASE}/requests`, { headers: authH }),
        fetch(`${BASE}/suppliers`, { headers: authH }),
      ])
      const [reqData, supData] = await Promise.all([reqRes.json(), supRes.json()])
      setRequests(Array.isArray(reqData) ? reqData : [])
      setSuppliers(Array.isArray(supData) ? supData : [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  // Stats
  const activeReqs = requests.filter((r) => !TERMINAL.includes(r.status))
  const totalEst = requests.filter((r) => !['Cancelled', 'Rejected'].includes(r.status)).reduce((s, r) => s + (r.estimatedAmount || 0), 0)

  // Filtered
  const filteredRequests = requests.filter((r) => {
    const q = search.toLowerCase()
    return !q || r.code?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r.department?.toLowerCase().includes(q) || r.requestedBy?.toLowerCase().includes(q)
  })

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase()
    return !q || s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q) || s.country?.toLowerCase().includes(q)
  })

  // CRUD
  async function saveRequest(form) {
    const isEdit = requestModal && !requestModal._isNew && requestModal !== 'new'
    const url = isEdit ? `${BASE}/requests/${requestModal.id}` : `${BASE}/requests`
    await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers, body: JSON.stringify(form) })
    setRequestModal(null)
    load()
  }

  async function saveSupplier(form) {
    const isEdit = supplierModal && supplierModal !== 'new'
    const url = isEdit ? `${BASE}/suppliers/${supplierModal.id}` : `${BASE}/suppliers`
    await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers, body: JSON.stringify(form) })
    setSupplierModal(null)
    load()
  }

  async function updateRequest(id, updates) {
    const res = await fetch(`${BASE}/requests/${id}`, {
      method: 'PUT', headers, body: JSON.stringify(updates),
    })
    const updated = await res.json()
    setRequests((prev) => prev.map((r) => r.id === id ? updated : r))
    if (detailDrawer?.id === id) setDetailDrawer(updated)
  }

  async function addQuotation(form) {
    await fetch(`${BASE}/requests/${detailDrawer.id}/quotations`, {
      method: 'POST', headers, body: JSON.stringify(form),
    })
    setQuotationModal(null)
    load().then(() => {
      // Refresh detail drawer
      fetch(`${BASE}/requests`, { headers: authH })
        .then((r) => r.json())
        .then((data) => {
          const updated = data.find((r) => r.id === detailDrawer.id)
          if (updated) setDetailDrawer(updated)
        })
    })
  }

  async function selectQuotation(qId) {
    await fetch(`${BASE}/quotations/${qId}/select`, { method: 'PUT', headers })
    load().then(() => {
      fetch(`${BASE}/requests`, { headers: authH })
        .then((r) => r.json())
        .then((data) => {
          const updated = data.find((r) => r.id === detailDrawer.id)
          if (updated) setDetailDrawer(updated)
        })
    })
  }

  async function deleteQuotation(qId) {
    await fetch(`${BASE}/quotations/${qId}`, { method: 'DELETE', headers: authH })
    load().then(() => {
      fetch(`${BASE}/requests`, { headers: authH })
        .then((r) => r.json())
        .then((data) => {
          const updated = data.find((r) => r.id === detailDrawer.id)
          if (updated) setDetailDrawer(updated)
        })
    })
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    const { type, id } = deleteConfirm
    await fetch(`${BASE}/${type}/${id}`, { method: 'DELETE', headers: authH })
    setDeleteConfirm(null)
    if (detailDrawer?.id === id) setDetailDrawer(null)
    load()
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t('purchasing.title')}</h1>
          <p className="text-sm text-text-muted mt-0.5">{t('purchasing.subtitle')}</p>
        </div>
        {(tab === 'suppliers' ? isAdmin : canCreateEdit) && (
          <button
            onClick={() => tab === 'suppliers' ? setSupplierModal('new') : setRequestModal({ _isNew: true, requestedBy: user?.name || '' })}
            className="flex items-center gap-2 primary-gradient text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-primary/10 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {tab === 'suppliers' ? 'New Supplier' : 'New Request'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard icon="assignment" label="Total Requests" value={requests.length} sub={`${activeReqs.length} active`} />
        <StatCard icon="pending_actions" label="In Progress" value={activeReqs.length} color="text-amber-500" />
        <StatCard icon="check_circle" label="Completed" value={requests.filter((r) => r.status === 'Completed').length} color="text-green-500" />
        <StatCard icon="storefront" label="Suppliers" value={suppliers.filter((s) => s.status === 'Active').length} sub={`${suppliers.length} total`} color="text-purple-500" />
        <StatCard icon="payments" label="Total Estimated" value={`${fmt(totalEst)}`} sub="TRY" color="text-blue-500" />
      </div>


      {/* Tabs + Table */}
      <div className="bg-surface-container-lowest border border-theme-border rounded-2xl">
        <div className="flex items-center gap-4 px-6 pt-4 border-b border-theme-border">
          {[
            { key: 'requests', label: 'Purchase Requests' },
            { key: 'suppliers', label: 'Suppliers' },
          ].map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => { setTab(tabItem.key); setSearch('') }}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${tab === tabItem.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-on-surface'}`}
            >
              {tabItem.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 pb-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">search</span>
              <input
                className="bg-surface-container border border-theme-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary w-48"
                placeholder={t('purchasing.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-text-muted text-sm gap-2">
            <span className="material-symbols-outlined animate-spin">refresh</span> Loading...
          </div>
        ) : tab === 'requests' ? (
          <RequestTable
            requests={filteredRequests}
            onOpen={(r) => setDetailDrawer(r)}
          />
        ) : (
          <SupplierTable
            suppliers={filteredSuppliers}
            onEdit={(s) => setSupplierModal(s)}
            onDelete={(id) => setDeleteConfirm({ type: 'suppliers', id })}
          />
        )}
      </div>

      {/* Modals */}
      {requestModal && <RequestModal initial={requestModal === 'new' || requestModal._isNew ? { requestedBy: requestModal?.requestedBy || '' } : requestModal} onClose={() => setRequestModal(null)} onSave={saveRequest} />}
      {supplierModal && <SupplierModal initial={supplierModal === 'new' ? null : supplierModal} onClose={() => setSupplierModal(null)} onSave={saveSupplier} />}
      {quotationModal && <QuotationModal suppliers={suppliers} initial={null} onClose={() => setQuotationModal(null)} onSave={addQuotation} />}
      {detailDrawer && (
        <DetailDrawer
          request={detailDrawer}
          suppliers={suppliers}
          canCreateEdit={canCreateEdit}
          onClose={() => setDetailDrawer(null)}
          onEdit={() => { setRequestModal(detailDrawer); setDetailDrawer(null) }}
          onDelete={() => setDeleteConfirm({ type: 'requests', id: detailDrawer.id })}
          onUpdate={(updates) => updateRequest(detailDrawer.id, updates)}
          onAddQuotation={() => setQuotationModal('new')}
          onSelectQuotation={selectQuotation}
          onDeleteQuotation={deleteQuotation}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold text-on-surface mb-2">{t('common.areYouSure')}</h2>
            <p className="text-sm text-text-muted mb-6">{t('common.cantUndo')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">{t('common.cancel')}</button>
              <button onClick={handleDelete} className="flex-1 bg-error text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Request Table ─────────────────────────────────────────────────────────────
function RequestTable({ requests, onOpen }) {
  const { t } = useTranslation()
  if (requests.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 text-text-muted gap-2">
      <span className="material-symbols-outlined text-3xl">assignment</span>
      <p className="text-sm">{t('purchasing.noData')}</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-theme-border">
            <th className="px-6 py-3 font-semibold">{t('common.code')}</th>
            <th className="px-4 py-3 font-semibold">{t('common.title')}</th>
            <th className="px-4 py-3 font-semibold">{t('common.department')}</th>
            <th className="px-4 py-3 font-semibold">{t('common.priority')}</th>
            <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
            <th className="px-4 py-3 font-semibold">{t('purchasing.totalAmount')}</th>
            <th className="px-4 py-3 font-semibold">Quotes</th>
            <th className="px-4 py-3 font-semibold">{t('common.date')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-border">
          {requests.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r)} className="hover:bg-hover-bg transition-colors cursor-pointer">
              <td className="px-6 py-3 font-mono font-semibold text-primary text-xs">{r.code}</td>
              <td className="px-4 py-3 text-on-surface font-medium max-w-[200px] truncate">{r.title}</td>
              <td className="px-4 py-3 text-text-muted">{r.department || '—'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_COLOR[r.priority]}`}>{r.priority}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${STATUS_BADGE[r.status] || 'bg-surface-container text-text-muted'}`}>{r.status}</span>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{r.currency} {fmt(r.estimatedAmount)}</td>
              <td className="px-4 py-3">
                <span className="text-text-muted">{(r.quotations || []).length}</span>
                {(r.quotations || []).some((q) => q.selected) && (
                  <span className="material-symbols-outlined text-green-500 text-xs ml-1">check_circle</span>
                )}
              </td>
              <td className="px-4 py-3 text-text-muted text-xs">{new Date(r.createdAt).toLocaleDateString('en-US')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Supplier Table ────────────────────────────────────────────────────────────
function SupplierTable({ suppliers, onEdit, onDelete }) {
  const { t } = useTranslation()
  if (suppliers.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 text-text-muted gap-2">
      <span className="material-symbols-outlined text-3xl">storefront</span>
      <p className="text-sm">{t('common.noData')}</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-theme-border">
            <th className="px-6 py-3 font-semibold">{t('common.code')}</th>
            <th className="px-4 py-3 font-semibold">{t('common.name')}</th>
            <th className="px-4 py-3 font-semibold">{t('common.category')}</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">{t('common.country')}</th>
            <th className="px-4 py-3 font-semibold">{t('common.currency')}</th>
            <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-border">
          {suppliers.map((s) => (
            <tr key={s.id} className="hover:bg-hover-bg transition-colors">
              <td className="px-6 py-3 font-mono text-xs text-text-muted">{s.code}</td>
              <td className="px-4 py-3 font-semibold text-on-surface">{s.name}</td>
              <td className="px-4 py-3 text-text-muted">{s.category}</td>
              <td className="px-4 py-3">
                <div className="text-on-surface">{s.contactName || '—'}</div>
                {s.contactEmail && <div className="text-xs text-text-muted">{s.contactEmail}</div>}
              </td>
              <td className="px-4 py-3 text-text-muted">{s.country || '—'}</td>
              <td className="px-4 py-3 text-text-muted">{s.currency}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  s.status === 'Active' ? 'bg-green-500/10 text-green-600' :
                  s.status === 'Blacklisted' ? 'bg-error/10 text-error' :
                  'bg-surface-container text-text-muted'
                }`}>{s.status}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(s)} className="text-text-muted hover:text-primary transition">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => onDelete(s.id)} className="text-text-muted hover:text-error transition">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
