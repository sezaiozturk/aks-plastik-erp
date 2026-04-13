import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

// ── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'JPY', 'CNY', 'INR', 'CAD', 'AUD']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const CATEGORIES = ['General', 'Raw Materials', 'Equipment', 'Services', 'IT & Software', 'Logistics', 'Spare Parts', 'Office Supplies', 'Other']
const SUPPLIER_CATEGORIES = ['General', 'Raw Materials', 'Equipment', 'Services', 'IT & Software', 'Logistics', 'Other']

const WORKFLOW_STAGES = [
  { key: 'Request',           label: 'Talep Girisi',       icon: 'edit_note',          color: 'text-blue-500',   bg: 'bg-blue-500' },
  { key: 'Budget Review',     label: 'Butce Kontrolu',     icon: 'account_balance',    color: 'text-amber-500',  bg: 'bg-amber-500' },
  { key: 'Collecting Quotes', label: 'Teklif Toplama',     icon: 'request_quote',      color: 'text-purple-500', bg: 'bg-purple-500' },
  { key: 'Comparison',        label: 'Karsilastirma',      icon: 'compare_arrows',     color: 'text-indigo-500', bg: 'bg-indigo-500' },
  { key: 'Pending Approval',  label: 'Yonetim Onayi',      icon: 'approval',           color: 'text-orange-500', bg: 'bg-orange-500' },
  { key: 'PO Created',        label: 'Siparis (PO)',       icon: 'receipt_long',       color: 'text-cyan-600',   bg: 'bg-cyan-600' },
  { key: 'In Logistics',      label: 'Lojistik / Mal Kabul', icon: 'local_shipping',  color: 'text-teal-500',   bg: 'bg-teal-500' },
  { key: 'Quality Check',     label: 'Kalite Kontrol',     icon: 'verified',           color: 'text-lime-600',   bg: 'bg-lime-600' },
  { key: 'Invoice Matching',  label: 'E-Fatura Eslestirme', icon: 'receipt',           color: 'text-pink-500',   bg: 'bg-pink-500' },
  { key: 'Payment',           label: 'Odeme Programi',     icon: 'payments',           color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { key: 'Completed',         label: 'Tamamlandi',         icon: 'check_circle',       color: 'text-green-600',  bg: 'bg-green-600' },
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

function fmt(n) { return Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

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

// ── Pipeline Bar ─────────────────────────────────────────────────────────────
function PipelineBar({ requests, activeStage, onStageClick }) {
  const counts = {}
  requests.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1 })

  return (
    <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-4 overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {WORKFLOW_STAGES.map((stage, i) => {
          const count = counts[stage.key] || 0
          const isActive = activeStage === stage.key
          return (
            <div key={stage.key} className="flex items-center">
              <button
                onClick={() => onStageClick(isActive ? null : stage.key)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition min-w-[90px] ${
                  isActive
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-hover-bg border border-transparent'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : stage.color}`}>
                  {stage.icon}
                </span>
                <span className="text-[10px] font-semibold text-text-muted mt-0.5 leading-tight text-center">
                  {stage.label}
                </span>
                <span className={`text-xs font-bold mt-0.5 ${count > 0 ? 'text-on-surface' : 'text-text-muted/40'}`}>
                  {count}
                </span>
              </button>
              {i < WORKFLOW_STAGES.length - 1 && (
                <span className="material-symbols-outlined text-xs text-text-muted/30 mx-0.5">chevron_right</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Request Modal ────────────────────────────────────────────────────────────
function RequestModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || {
    title: '', description: '', department: '', requestedBy: '',
    priority: 'Medium', category: 'General', estimatedAmount: '',
    currency: 'TRY', budgetCode: '', notes: '',
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
          <h2 className="text-lg font-bold text-on-surface">{initial ? 'Talep Duzenle' : 'Yeni Satin Alma Talebi'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Baslik *</label>
            <input className={inp('title')} value={form.title} onChange={set('title')} placeholder="Ornek: CNC Freze Yedek Parca Alimi" />
            {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Aciklama</label>
            <textarea rows={2} className={inp('description')} value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Departman</label>
              <input className={inp('department')} value={form.department} onChange={set('department')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Talep Eden</label>
              <input className={inp('requestedBy')} value={form.requestedBy} onChange={set('requestedBy')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Oncelik</label>
              <select className={inp('priority')} value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Kategori</label>
              <select className={inp('category')} value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Butce Kodu</label>
              <input className={inp('budgetCode')} value={form.budgetCode} onChange={set('budgetCode')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Tahmini Tutar</label>
              <input type="number" min="0" step="0.01" className={inp('estimatedAmount')} value={form.estimatedAmount} onChange={set('estimatedAmount')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Para Birimi</label>
              <select className={inp('currency')} value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Notlar</label>
            <textarea rows={2} className={inp('notes')} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Iptal</button>
          <button onClick={handleSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">Kaydet</button>
        </div>
      </div>
    </div>
  )
}

// ── Quotation Modal ──────────────────────────────────────────────────────────
function QuotationModal({ suppliers, initial, onClose, onSave }) {
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
          <h2 className="text-lg font-bold text-on-surface">{initial ? 'Teklif Duzenle' : 'Yeni Teklif Ekle'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Tedarikci</label>
            <select className={inp('supplierId')} value={form.supplierId} onChange={set('supplierId')}>
              <option value="">-- Manuel Giris --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {!form.supplierId && (
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Tedarikci Adi</label>
              <input className={inp('supplierName')} value={form.supplierName} onChange={set('supplierName')} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Teklif No</label>
              <input className={inp('quotationNo')} value={form.quotationNo} onChange={set('quotationNo')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Teklif Tarihi</label>
              <input type="date" className={inp('quotationDate')} value={form.quotationDate} onChange={set('quotationDate')} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Tutar *</label>
              <input type="number" min="0" step="0.01" className={inp('amount')} value={form.amount} onChange={set('amount')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">KDV %</label>
              <input type="number" min="0" max="100" className={inp('vat')} value={form.vat} onChange={set('vat')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Para Birimi</label>
              <select className={inp('currency')} value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Teslimat (gun)</label>
              <input type="number" min="0" className={inp('deliveryDays')} value={form.deliveryDays} onChange={set('deliveryDays')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Garanti</label>
              <input className={inp('warranty')} value={form.warranty} onChange={set('warranty')} placeholder="Ornek: 2 Yil" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Odeme Kosullari</label>
            <input className={inp('paymentTerms')} value={form.paymentTerms} onChange={set('paymentTerms')} placeholder="Ornek: 30 gun vadeli" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Notlar</label>
            <textarea rows={2} className={inp('notes')} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Iptal</button>
          <button onClick={handleSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">Kaydet</button>
        </div>
      </div>
    </div>
  )
}

// ── Supplier Modal ───────────────────────────────────────────────────────────
function SupplierModal({ initial, onClose, onSave }) {
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
          <h2 className="text-lg font-bold text-on-surface">{initial ? 'Tedarikci Duzenle' : 'Yeni Tedarikci'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Firma Adi *</label>
            <input className={inp('name')} value={form.name} onChange={set('name')} />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Kategori</label>
              <select className={inp('category')} value={form.category} onChange={set('category')}>
                {SUPPLIER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Durum</label>
              <select className={inp('status')} value={form.status} onChange={set('status')}>
                <option>Active</option><option>Inactive</option><option>Blacklisted</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Yetkili Kisi</label>
              <input className={inp('contactName')} value={form.contactName} onChange={set('contactName')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Telefon</label>
              <input className={inp('contactPhone')} value={form.contactPhone} onChange={set('contactPhone')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">E-posta</label>
            <input className={inp('contactEmail')} value={form.contactEmail} onChange={set('contactEmail')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Ulke</label>
              <input className={inp('country')} value={form.country} onChange={set('country')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Para Birimi</label>
              <select className={inp('currency')} value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Adres</label>
            <input className={inp('address')} value={form.address} onChange={set('address')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Notlar</label>
            <textarea rows={2} className={inp('notes')} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Iptal</button>
          <button onClick={handleSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">Kaydet</button>
        </div>
      </div>
    </div>
  )
}

// ── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ request, suppliers, onClose, onUpdate, onAddQuotation, onSelectQuotation, onDeleteQuotation }) {
  const r = request
  const stageIdx = WORKFLOW_STAGES.findIndex((s) => s.key === r.status)
  const quotations = r.quotations || []
  const selectedQuote = quotations.find((q) => q.selected)
  const isTerminal = TERMINAL.includes(r.status)

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
    if (r.status === 'Collecting Quotes' && quotations.length < 3) return false
    if (r.status === 'Comparison' && !selectedQuote) return false
    return true
  }

  function advanceLabel() {
    const labels = {
      'Request': 'Butce Kontrolune Gonder',
      'Budget Review': 'Butce Onayla & Teklif Topla',
      'Collecting Quotes': 'Karsilastirmaya Gec',
      'Comparison': 'Yonetim Onayina Gonder',
      'Pending Approval': 'Onayla & PO Olustur',
      'PO Created': 'Lojistige Gonder',
      'In Logistics': 'Kalite Kontrole Gonder',
      'Quality Check': 'Kabul Et & Fatura Eslestir',
      'Invoice Matching': 'Odeme Programina Al',
      'Payment': 'Tamamla',
    }
    return labels[r.status] || 'Ilerle'
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="bg-surface-container-lowest w-full max-w-2xl h-full overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest z-10 px-6 pt-6 pb-4 border-b border-theme-border">
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
            <button onClick={onClose} className="text-text-muted hover:text-error"><span className="material-symbols-outlined">close</span></button>
          </div>
          <h2 className="text-lg font-bold text-on-surface">{r.title}</h2>
          {r.description && <p className="text-sm text-text-muted mt-1">{r.description}</p>}
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Progress bar */}
          <div>
            <p className="text-xs font-semibold text-text-muted mb-2">Surec Durumu</p>
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
              ['Departman', r.department],
              ['Talep Eden', r.requestedBy],
              ['Kategori', r.category],
              ['Tahmini Tutar', `${r.currency} ${fmt(r.estimatedAmount)}`],
              ['Butce Kodu', r.budgetCode],
              ['Tarih', new Date(r.createdAt).toLocaleDateString('tr-TR')],
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
                <span className="material-symbols-outlined text-sm">account_balance</span> Butce Kontrolu
              </p>
              <p className="text-xs text-text-muted mb-3">Tahmini tutar: <strong>{r.currency} {fmt(r.estimatedAmount)}</strong></p>
              <textarea
                className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none mb-2"
                rows={2}
                placeholder="Butce notu (opsiyonel)..."
                value={r.budgetNotes || ''}
                onChange={(e) => onUpdate({ budgetNotes: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ status: 'Rejected', rejectionReason: 'Butce uygun degil', budgetApproved: false })}
                  className="px-4 py-1.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition"
                >
                  Butce Reddet
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
                  Teklifler ({quotations.length}/3 min.)
                </p>
                {r.status === 'Collecting Quotes' && (
                  <button onClick={onAddQuotation} className="flex items-center gap-1 text-xs text-primary hover:opacity-80 font-semibold">
                    <span className="material-symbols-outlined text-sm">add</span> Teklif Ekle
                  </button>
                )}
              </div>
              {quotations.length === 0 ? (
                <div className="border border-dashed border-theme-border rounded-lg p-6 text-center text-xs text-text-muted">
                  Henuz teklif eklenmedi
                </div>
              ) : (
                <div className="border border-theme-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-container text-text-muted">
                        <th className="px-3 py-2 text-left font-semibold">Tedarikci</th>
                        <th className="px-3 py-2 text-left font-semibold">Tutar</th>
                        <th className="px-3 py-2 text-left font-semibold">KDV</th>
                        <th className="px-3 py-2 text-left font-semibold">Toplam</th>
                        <th className="px-3 py-2 text-left font-semibold">Teslimat</th>
                        <th className="px-3 py-2 text-left font-semibold">Garanti</th>
                        <th className="px-3 py-2 text-left font-semibold">Odeme</th>
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
                              {isBest && <span className="ml-1 text-[9px] text-green-600 font-bold">EN DUSUK</span>}
                            </td>
                            <td className="px-3 py-2.5 text-text-muted">{q.deliveryDays ? `${q.deliveryDays} gun` : '—'}</td>
                            <td className="px-3 py-2.5 text-text-muted">{q.warranty || '—'}</td>
                            <td className="px-3 py-2.5 text-text-muted">{q.paymentTerms || '—'}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1">
                                {r.status === 'Comparison' && !q.selected && (
                                  <button onClick={() => onSelectQuotation(q.id)} className="text-primary hover:opacity-80" title="Bu teklifi sec">
                                    <span className="material-symbols-outlined text-sm">task_alt</span>
                                  </button>
                                )}
                                {r.status === 'Collecting Quotes' && (
                                  <button onClick={() => onDeleteQuotation(q.id)} className="text-text-muted hover:text-error" title="Sil">
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
                  En az 3 teklif gerekli (mevcut: {quotations.length})
                </p>
              )}
            </div>
          )}

          {/* Stage-specific: Quality Check */}
          {r.status === 'Quality Check' && (
            <div className="bg-lime-500/5 border border-lime-500/20 rounded-xl p-4">
              <p className="text-sm font-bold text-lime-700 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified</span> Kalite Kontrol
              </p>
              <textarea
                className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none mb-2"
                rows={2}
                placeholder="Kalite kontrol notlari..."
                value={r.qcNotes || ''}
                onChange={(e) => onUpdate({ qcNotes: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ status: 'QC Rejected', qcResult: 'Rejected', qcDate: new Date().toISOString().split('T')[0] })}
                  className="px-4 py-1.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition"
                >
                  Reddet
                </button>
              </div>
            </div>
          )}

          {/* Stage-specific: Invoice Matching */}
          {r.status === 'Invoice Matching' && (
            <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-pink-600 mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">receipt</span> E-Fatura Eslestirme
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Fatura No</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none"
                    value={r.invoiceNo || ''}
                    onChange={(e) => onUpdate({ invoiceNo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Fatura Tarihi</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none"
                    value={r.invoiceDate || ''}
                    onChange={(e) => onUpdate({ invoiceDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Fatura Tutari</label>
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
                <span className="material-symbols-outlined text-sm">payments</span> Odeme Programi
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Odeme Vadesi</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none"
                    value={r.paymentDueDate || ''}
                    onChange={(e) => onUpdate({ paymentDueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-0.5">Odeme Tarihi</label>
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
              <p className="text-[10px] font-semibold text-text-muted uppercase mb-1">Notlar</p>
              <p className="text-sm text-on-surface whitespace-pre-wrap">{r.notes}</p>
            </div>
          )}

          {/* Rejection reason */}
          {['Rejected', 'Budget Rejected', 'QC Rejected'].includes(r.status) && r.rejectionReason && (
            <div className="bg-error/5 border border-error/20 rounded-xl p-4">
              <p className="text-xs font-bold text-error mb-1">Red Sebebi</p>
              <p className="text-sm text-on-surface">{r.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 bg-surface-container-lowest border-t border-theme-border px-6 py-4 flex items-center gap-3">
          {!isTerminal && (
            <>
              <button
                onClick={() => onUpdate({ status: 'Cancelled' })}
                className="px-4 py-2 rounded-lg border border-error/30 text-error text-xs font-semibold hover:bg-error/5 transition"
              >
                Iptal Et
              </button>
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
                {r.status === 'Completed' ? 'Surec Tamamlandi' : `Surec Sonlandirildi (${r.status})`}
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
  const { token } = useAuth()
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const authH = { Authorization: `Bearer ${token}` }

  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState(null)

  const [requestModal, setRequestModal] = useState(null)
  const [supplierModal, setSupplierModal] = useState(null)
  const [quotationModal, setQuotationModal] = useState(null)
  const [detailDrawer, setDetailDrawer] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [reqRes, supRes] = await Promise.all([
        fetch(`${API_URL}/purchasing/requests`, { headers: authH }),
        fetch(`${API_URL}/purchasing/suppliers`, { headers: authH }),
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
    const matchQ = !q || r.code?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r.department?.toLowerCase().includes(q) || r.requestedBy?.toLowerCase().includes(q)
    const matchS = !stageFilter || r.status === stageFilter
    return matchQ && matchS
  })

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase()
    return !q || s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q) || s.country?.toLowerCase().includes(q)
  })

  // CRUD
  async function saveRequest(form) {
    const isEdit = requestModal && requestModal !== 'new'
    const url = isEdit ? `${API_URL}/purchasing/requests/${requestModal.id}` : `${API_URL}/purchasing/requests`
    await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers, body: JSON.stringify(form) })
    setRequestModal(null)
    load()
  }

  async function saveSupplier(form) {
    const isEdit = supplierModal && supplierModal !== 'new'
    const url = isEdit ? `${API_URL}/purchasing/suppliers/${supplierModal.id}` : `${API_URL}/purchasing/suppliers`
    await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers, body: JSON.stringify(form) })
    setSupplierModal(null)
    load()
  }

  async function updateRequest(id, updates) {
    const res = await fetch(`${API_URL}/purchasing/requests/${id}`, {
      method: 'PUT', headers, body: JSON.stringify(updates),
    })
    const updated = await res.json()
    setRequests((prev) => prev.map((r) => r.id === id ? updated : r))
    if (detailDrawer?.id === id) setDetailDrawer(updated)
  }

  async function addQuotation(form) {
    await fetch(`${API_URL}/purchasing/requests/${detailDrawer.id}/quotations`, {
      method: 'POST', headers, body: JSON.stringify(form),
    })
    setQuotationModal(null)
    load().then(() => {
      // Refresh detail drawer
      fetch(`${API_URL}/purchasing/requests`, { headers: authH })
        .then((r) => r.json())
        .then((data) => {
          const updated = data.find((r) => r.id === detailDrawer.id)
          if (updated) setDetailDrawer(updated)
        })
    })
  }

  async function selectQuotation(qId) {
    await fetch(`${API_URL}/purchasing/quotations/${qId}/select`, { method: 'PUT', headers })
    load().then(() => {
      fetch(`${API_URL}/purchasing/requests`, { headers: authH })
        .then((r) => r.json())
        .then((data) => {
          const updated = data.find((r) => r.id === detailDrawer.id)
          if (updated) setDetailDrawer(updated)
        })
    })
  }

  async function deleteQuotation(qId) {
    await fetch(`${API_URL}/purchasing/quotations/${qId}`, { method: 'DELETE', headers: authH })
    load().then(() => {
      fetch(`${API_URL}/purchasing/requests`, { headers: authH })
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
    await fetch(`${API_URL}/purchasing/${type}/${id}`, { method: 'DELETE', headers: authH })
    setDeleteConfirm(null)
    if (detailDrawer?.id === id) setDetailDrawer(null)
    load()
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Satin Alma & Tedarik</h1>
          <p className="text-sm text-text-muted mt-0.5">Satin alma sureclerini bastan sona yonet</p>
        </div>
        <button
          onClick={() => tab === 'suppliers' ? setSupplierModal('new') : setRequestModal('new')}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {tab === 'suppliers' ? 'Yeni Tedarikci' : 'Yeni Talep'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard icon="assignment" label="Toplam Talep" value={requests.length} sub={`${activeReqs.length} aktif`} />
        <StatCard icon="pending_actions" label="Devam Eden" value={activeReqs.length} color="text-amber-500" />
        <StatCard icon="check_circle" label="Tamamlanan" value={requests.filter((r) => r.status === 'Completed').length} color="text-green-500" />
        <StatCard icon="storefront" label="Tedarikciler" value={suppliers.filter((s) => s.status === 'Active').length} sub={`${suppliers.length} toplam`} color="text-purple-500" />
        <StatCard icon="payments" label="Toplam Tahmini" value={`${fmt(totalEst)}`} sub="TRY" color="text-blue-500" />
      </div>

      {/* Pipeline */}
      {tab === 'requests' && (
        <PipelineBar requests={requests} activeStage={stageFilter} onStageClick={setStageFilter} />
      )}

      {/* Tabs + Table */}
      <div className="bg-surface-container-lowest border border-theme-border rounded-2xl">
        <div className="flex items-center gap-4 px-6 pt-4 border-b border-theme-border">
          {[
            { key: 'requests', label: 'Satin Alma Talepleri' },
            { key: 'suppliers', label: 'Tedarikciler' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(''); setStageFilter(null) }}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-on-surface'}`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 pb-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">search</span>
              <input
                className="bg-surface-container border border-theme-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary w-48"
                placeholder="Ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {stageFilter && (
              <button
                onClick={() => setStageFilter(null)}
                className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition"
              >
                <span className="material-symbols-outlined text-xs">close</span>
                {stageFilter}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-text-muted text-sm gap-2">
            <span className="material-symbols-outlined animate-spin">refresh</span> Yukleniyor...
          </div>
        ) : tab === 'requests' ? (
          <RequestTable
            requests={filteredRequests}
            onOpen={(r) => setDetailDrawer(r)}
            onEdit={(r) => setRequestModal(r)}
            onDelete={(id) => setDeleteConfirm({ type: 'requests', id })}
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
      {requestModal && <RequestModal initial={requestModal === 'new' ? null : requestModal} onClose={() => setRequestModal(null)} onSave={saveRequest} />}
      {supplierModal && <SupplierModal initial={supplierModal === 'new' ? null : supplierModal} onClose={() => setSupplierModal(null)} onSave={saveSupplier} />}
      {quotationModal && <QuotationModal suppliers={suppliers} initial={null} onClose={() => setQuotationModal(null)} onSave={addQuotation} />}
      {detailDrawer && (
        <DetailDrawer
          request={detailDrawer}
          suppliers={suppliers}
          onClose={() => setDetailDrawer(null)}
          onUpdate={(updates) => updateRequest(detailDrawer.id, updates)}
          onAddQuotation={() => setQuotationModal('new')}
          onSelectQuotation={selectQuotation}
          onDeleteQuotation={deleteQuotation}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold text-on-surface mb-2">Silme Onayi</h2>
            <p className="text-sm text-text-muted mb-6">Bu islem geri alinamaz.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Iptal</button>
              <button onClick={handleDelete} className="flex-1 bg-error text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Request Table ─────────────────────────────────────────────────────────────
function RequestTable({ requests, onOpen, onEdit, onDelete }) {
  if (requests.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 text-text-muted gap-2">
      <span className="material-symbols-outlined text-3xl">assignment</span>
      <p className="text-sm">Talep bulunamadi</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-theme-border">
            <th className="px-6 py-3 font-semibold">Kod</th>
            <th className="px-4 py-3 font-semibold">Baslik</th>
            <th className="px-4 py-3 font-semibold">Departman</th>
            <th className="px-4 py-3 font-semibold">Oncelik</th>
            <th className="px-4 py-3 font-semibold">Durum</th>
            <th className="px-4 py-3 font-semibold">Tahmini Tutar</th>
            <th className="px-4 py-3 font-semibold">Teklifler</th>
            <th className="px-4 py-3 font-semibold">Tarih</th>
            <th className="px-4 py-3" />
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
              <td className="px-4 py-3 text-text-muted text-xs">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(r)} className="text-text-muted hover:text-primary transition">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => onDelete(r.id)} className="text-text-muted hover:text-error transition">
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

// ── Supplier Table ────────────────────────────────────────────────────────────
function SupplierTable({ suppliers, onEdit, onDelete }) {
  if (suppliers.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 text-text-muted gap-2">
      <span className="material-symbols-outlined text-3xl">storefront</span>
      <p className="text-sm">Tedarikci bulunamadi</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-theme-border">
            <th className="px-6 py-3 font-semibold">Kod</th>
            <th className="px-4 py-3 font-semibold">Firma Adi</th>
            <th className="px-4 py-3 font-semibold">Kategori</th>
            <th className="px-4 py-3 font-semibold">Yetkili</th>
            <th className="px-4 py-3 font-semibold">Ulke</th>
            <th className="px-4 py-3 font-semibold">Para Birimi</th>
            <th className="px-4 py-3 font-semibold">Durum</th>
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
