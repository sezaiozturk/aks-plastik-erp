import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useCurrencyRates } from '../hooks/useCurrencyRates'

const ITEMS_PER_PAGE = 15

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'AED', 'SAR', 'JPY', 'CNY', 'INR', 'CAD', 'AUD']

const INCOME_CATEGORIES = [
  'Sales Revenue', 'Service Revenue', 'Consulting',
  'Interest Income', 'Refund Received', 'Other Income',
]
const EXPENSE_CATEGORIES = [
  'Salaries & Wages', 'Rent & Lease', 'Utilities', 'Raw Materials',
  'Travel & Transport', 'Marketing', 'IT & Software', 'Maintenance',
  'Insurance', 'Taxes', 'Legal & Professional', 'Supplies', 'Other Expense',
]

const emptyForm = {
  type: 'income',
  category: 'Sales Revenue',
  amount: '',
  currency: 'USD',
  date: new Date().toISOString().split('T')[0],
  reference: '',
  description: '',
  orderId: '',
}

function fmt(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}



// ─── Currency Ticker ─────────────────────────────────────────────────────────
const TICKER_CURRENCIES = ['EUR', 'GBP', 'TRY', 'AED', 'SAR', 'JPY', 'CNY', 'CAD', 'AUD', 'INR']

function CurrencyTicker() {
  const { rates, base, loading, error, lastUpdated, fetchRates } = useCurrencyRates()

  if (error) return (
    <div className="flex items-center gap-2 text-xs text-error bg-error/10 border border-error/20 rounded-xl px-4 py-2 mb-4">
      <span className="material-symbols-outlined text-sm">error</span>
      Exchange rates unavailable: {error}
      <button onClick={fetchRates} className="ml-auto underline hover:no-underline">Retry</button>
    </div>
  )

  if (loading || !rates) return (
    <div className="flex items-center gap-2 text-xs text-text-muted mb-4 px-1">
      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
      Loading exchange rates…
    </div>
  )

  return (
    <div className="flex items-center gap-1 mb-4 bg-surface-container-lowest border border-theme-border rounded-xl px-4 py-2 overflow-x-auto">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0 mr-2">
        Live Rates · {base}
      </span>
      {TICKER_CURRENCIES.map(cur => {
        const rate = rates[cur]
        if (!rate) return null
        return (
          <div key={cur} className="flex items-center gap-1.5 shrink-0 px-3 py-0.5 rounded-lg bg-surface-container-high">
            <span className="text-xs font-bold text-on-surface">{cur}</span>
            <span className="text-xs text-text-muted tabular-nums">{rate.toFixed(4)}</span>
          </div>
        )
      })}
      <div className="ml-auto shrink-0 flex items-center gap-2 pl-3 border-l border-theme-border">
        {lastUpdated && (
          <span className="text-[10px] text-text-muted whitespace-nowrap">
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button onClick={fetchRates} title="Refresh rates" className="text-text-muted hover:text-primary transition">
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ title, form, setForm, onClose, onSave, errors, orders, rates, ratesBase }) {
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const inp = (field) =>
    `w-full bg-surface-container-lowest border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${errors[field] ? 'border-error' : 'border-theme-border'}`
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 mb-4">
          {['income', 'expense'].map(t => (
            <button
              key={t}
              onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] }))}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-1.5 ${
                form.type === t
                  ? t === 'income' ? 'bg-primary text-white border-primary' : 'bg-error text-white border-error'
                  : 'border-theme-border text-text-muted hover:bg-hover-bg'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t === 'income' ? 'trending_up' : 'trending_down'}</span>
              {t === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Date *</label>
              <input type="date" className={inp('date')} value={form.date} onChange={set('date')} />
              {errors.date && <p className="text-xs text-error mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Amount *</label>
              <div className="flex gap-1.5">
                <select
                  className="bg-surface-container-lowest border border-theme-border rounded-xl px-2 py-2 text-sm text-on-surface outline-none focus:border-primary shrink-0"
                  value={form.currency}
                  onChange={set('currency')}
                >
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" min="0" step="0.01" className={`${inp('amount')} flex-1`}
                  value={form.amount} onChange={set('amount')} placeholder="0.00" />
              </div>
              {errors.amount && <p className="text-xs text-error mt-1">{errors.amount}</p>}
              {rates && form.currency && form.currency !== ratesBase && rates[form.currency] && (
                <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">currency_exchange</span>
                  1 {ratesBase} = {rates[form.currency].toFixed(4)} {form.currency}
                  {form.amount > 0 && (
                    <span className="ml-1 font-semibold text-primary">
                      ≈ {(parseFloat(form.amount) / rates[form.currency]).toFixed(2)} {ratesBase}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Category</label>
              <select className={inp('category')} value={form.category} onChange={set('category')}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Invoice / Reference #</label>
              <input className={inp('reference')} value={form.reference} onChange={set('reference')} placeholder="INV-0001" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Linked Order</label>
            <select className={inp('orderId')} value={form.orderId} onChange={set('orderId')}>
              <option value="">— None —</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>{o.code}{o.customer?.name ? ` — ${o.customer.name}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Notes / Description</label>
            <textarea rows={2} className={inp('description')} value={form.description}
              onChange={set('description')} placeholder="Additional details…" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-xl py-2.5 text-sm text-text-muted hover:bg-hover-bg transition">
            Cancel
          </button>
          <button onClick={onSave}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ${form.type === 'income' ? 'bg-primary' : 'bg-error'}`}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Record Detail Modal ─────────────────────────────────────────────────────
function DetailRow({ icon, label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-start gap-2">
      <span className="material-symbols-outlined text-sm text-text-muted mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-sm text-on-surface break-words">{value}</p>
      </div>
    </div>
  )
}

function RecordDetailModal({ record, onClose, orders, customers }) {
  const [tab, setTab] = useState('details')

  const linkedOrder = record.orderId ? orders.find(o => o.id === record.orderId) : null
  const linkedCustomer = linkedOrder?.customer?.id
    ? customers.find(c => c.id === linkedOrder.customer.id)
    : null

  const tabs = [
    { id: 'details',  label: 'Transaction',  icon: 'receipt_long'  },
    ...(linkedOrder    ? [{ id: 'order',    label: 'Linked Order', icon: 'shopping_cart' }] : []),
    ...(linkedCustomer ? [{ id: 'customer', label: 'Customer',     icon: 'business'      }] : []),
  ]

  const orderStatusColor = {
    Draft:     'bg-surface-container-high text-on-surface-variant',
    Pending:   'bg-yellow-100 text-yellow-700',
    Active:    'bg-primary/10 text-primary',
    Completed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-error/10 text-error',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-theme-border shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${record.type === 'income' ? 'bg-primary/10' : 'bg-error/10'}`}>
              <span className={`material-symbols-outlined text-xl ${record.type === 'income' ? 'text-primary' : 'text-error'}`}>
                {record.type === 'income' ? 'trending_up' : 'trending_down'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-mono text-sm font-bold text-on-surface">{record.code}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${record.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                  <span className="material-symbols-outlined text-xs">{record.type === 'income' ? 'arrow_circle_down' : 'arrow_circle_up'}</span>
                  {record.type === 'income' ? 'Income' : 'Expense'}
                </span>
              </div>
              <p className={`text-2xl font-bold tabular-nums leading-none ${record.type === 'income' ? 'text-primary' : 'text-error'}`}>
                {record.type === 'income' ? '+' : '-'}{fmt(record.amount)}
                <span className="text-sm font-normal text-text-muted ml-1.5">{record.currency || 'USD'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-error transition p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex px-6 shrink-0 border-b border-theme-border">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition -mb-px ${
                  tab === t.id ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-on-surface'
                }`}>
                <span className="material-symbols-outlined text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-5">

          {/* ── Transaction Tab ── */}
          {tab === 'details' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Transaction Info</p>
                <DetailRow icon="calendar_today"     label="Date"        value={record.date} />
                <DetailRow icon="category"           label="Category"    value={record.category} />
                <DetailRow icon="currency_exchange"  label="Currency"    value={record.currency || 'USD'} />
                <DetailRow icon="tag"                label="Reference"   value={record.reference} />
              </div>
              <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Links & Notes</p>
                <DetailRow
                  icon="shopping_cart"
                  label="Linked Order"
                  value={linkedOrder
                    ? `${linkedOrder.code}${linkedOrder.customer?.name ? ` — ${linkedOrder.customer.name}` : ''}`
                    : 'No linked order'}
                />
                <DetailRow icon="edit_note" label="Description" value={record.description} />
                <DetailRow icon="schedule"  label="Created"     value={record.createdAt ? new Date(record.createdAt).toLocaleString() : null} />
              </div>
            </div>
          )}

          {/* ── Linked Order Tab ── */}
          {tab === 'order' && linkedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant">shopping_cart</span>
                </div>
                <div>
                  <p className="font-mono text-base font-bold text-on-surface">{linkedOrder.code}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${orderStatusColor[linkedOrder.status] || 'bg-surface-container-high text-on-surface-variant'}`}>
                    {linkedOrder.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Order Details</p>
                  <DetailRow icon="business"      label="Customer"      value={linkedOrder.customer?.name} />
                  <DetailRow icon="attach_money"  label="Total Amount"  value={linkedOrder.totalAmount != null ? fmt(linkedOrder.totalAmount) : null} />
                  <DetailRow icon="percent"       label="VAT"           value={linkedOrder.vat != null ? `${linkedOrder.vat}%` : null} />
                  <DetailRow icon="schedule"      label="Created"       value={linkedOrder.createdAt ? new Date(linkedOrder.createdAt).toLocaleDateString() : null} />
                </div>
                <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Notes</p>
                  <p className="text-sm text-on-surface">{linkedOrder.notes || 'No notes'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Customer Tab ── */}
          {tab === 'customer' && linkedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">{linkedCustomer.initials || '?'}</span>
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">{linkedCustomer.name}</p>
                  <p className="text-xs text-text-muted">{linkedCustomer.customerType} · {linkedCustomer.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Contact & Address */}
                <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Contact & Address</p>
                  <DetailRow icon="phone"              label="Phone"       value={linkedCustomer.phone} />
                  <DetailRow icon="mail"               label="Email"       value={linkedCustomer.email} />
                  <DetailRow icon="home"               label="Address"     value={linkedCustomer.address} />
                  <DetailRow icon="location_city"      label="City / District" value={[linkedCustomer.city, linkedCustomer.district].filter(Boolean).join(', ') || null} />
                  <DetailRow icon="public"             label="Country"     value={linkedCustomer.country} />
                  <DetailRow icon="markunread_mailbox" label="Postal Code" value={linkedCustomer.postalCode} />
                </div>

                {/* Tax & Financial */}
                <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Tax & Financial</p>
                  <DetailRow icon="fingerprint"    label="Tax ID (TIN)"   value={linkedCustomer.taxId} />
                  <DetailRow icon="account_balance" label="Tax Office"    value={linkedCustomer.taxOffice} />
                  <DetailRow icon="tag"             label="Account Code"  value={linkedCustomer.accountCode} />
                  <DetailRow icon="currency_exchange" label="Currency"    value={linkedCustomer.currency} />
                  <DetailRow icon="credit_score"    label="Credit Limit"  value={linkedCustomer.creditLimit != null ? fmt(linkedCustomer.creditLimit) : null} />
                  <DetailRow icon="schedule"        label="Payment Term"  value={linkedCustomer.paymentTerm} />
                </div>

                {/* e-Document Status */}
                <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">e-Document Status</p>
                  {[
                    { key: 'eInvoiceStatus',  label: 'e-Invoice'  },
                    { key: 'eArchiveStatus',  label: 'e-Archive'  },
                    { key: 'eDispatchStatus', label: 'e-Dispatch' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${linkedCustomer[key] ? 'bg-green-500' : 'bg-surface-container-highest'}`} />
                      <span className="text-sm text-on-surface">
                        {label}:{' '}
                        <span className={`font-semibold ${linkedCustomer[key] ? 'text-green-600' : 'text-text-muted'}`}>
                          {linkedCustomer[key] ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </div>
                  ))}
                  <DetailRow icon="description" label="Invoice Scenario" value={linkedCustomer.invoiceScenario} />
                  <DetailRow icon="description" label="Invoice Type"     value={linkedCustomer.invoiceType} />
                  <DetailRow icon="payments"    label="Payment Method"   value={linkedCustomer.paymentMethod} />
                  <DetailRow icon="schedule_send" label="Payment Terms"  value={linkedCustomer.paymentTerms} />
                </div>

                {/* Contact Person */}
                <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Contact Person</p>
                  <DetailRow icon="person"          label="Name"     value={linkedCustomer.contactName} />
                  <DetailRow icon="phone_in_talk"   label="Phone"    value={linkedCustomer.contactPhone} />
                  <DetailRow icon="forward_to_inbox" label="Email"   value={linkedCustomer.contactEmail} />
                  <DetailRow icon="work"            label="Position" value={linkedCustomer.contactPosition} />
                </div>

                {/* Bank */}
                {(linkedCustomer.bankName || linkedCustomer.iban) && (
                  <div className="bg-surface-container-high rounded-xl p-4 space-y-3 col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Bank Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow icon="account_balance" label="Bank Name"       value={linkedCustomer.bankName} />
                      <DetailRow icon="credit_card"     label="IBAN"            value={linkedCustomer.iban} />
                      <DetailRow icon="store"           label="Branch Code"     value={linkedCustomer.branchCode} />
                      <DetailRow icon="person"          label="Account Holder"  value={linkedCustomer.accountHolder} />
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {(linkedCustomer.industry || linkedCustomer.customerCategory || linkedCustomer.salesRepName || linkedCustomer.notes) && (
                  <div className="bg-surface-container-high rounded-xl p-4 space-y-3 col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Additional Info</p>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow icon="factory"       label="Industry"    value={linkedCustomer.industry} />
                      <DetailRow icon="grade"         label="Category"    value={linkedCustomer.customerCategory} />
                      <DetailRow icon="badge"         label="Sales Rep"   value={linkedCustomer.salesRepName} />
                      <DetailRow icon="verified_user" label="GDPR Consent" value={linkedCustomer.gdprConsent ? 'Yes / Active' : 'No / Not given'} />
                    </div>
                    {linkedCustomer.notes && (
                      <DetailRow icon="edit_note" label="Notes" value={linkedCustomer.notes} />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Finance() {
  const { financeRecords, addFinanceRecord, updateFinanceRecord, deleteFinanceRecord, refreshFinanceRecords, orders, customers, isAdmin } = useData()
  const { rates, base: ratesBase } = useCurrencyRates()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [deletingId, setDeletingId] = useState(null)
  const [detailRecord, setDetailRecord] = useState(null)

  const now = new Date()
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`
  const thisYearPrefix = `${now.getFullYear()}`

  const summary = useMemo(() => {
    const income = financeRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
    const expense = financeRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    const tmIncome = financeRecords.filter(r => r.type === 'income' && r.date?.startsWith(thisMonthPrefix)).reduce((s, r) => s + r.amount, 0)
    const tmExpense = financeRecords.filter(r => r.type === 'expense' && r.date?.startsWith(thisMonthPrefix)).reduce((s, r) => s + r.amount, 0)
    const lmIncome = financeRecords.filter(r => r.type === 'income' && r.date?.startsWith(lastMonthPrefix)).reduce((s, r) => s + r.amount, 0)
    const lmExpense = financeRecords.filter(r => r.type === 'expense' && r.date?.startsWith(lastMonthPrefix)).reduce((s, r) => s + r.amount, 0)
    return {
      income, expense, balance: income - expense,
      incomeCount: financeRecords.filter(r => r.type === 'income').length,
      expenseCount: financeRecords.filter(r => r.type === 'expense').length,
      tmIncome, tmExpense, tmNet: tmIncome - tmExpense,
      lmIncome, lmExpense,
    }
  }, [financeRecords, thisMonthPrefix, lastMonthPrefix])

  function pctChange(curr, prev) {
    if (prev === 0 && curr === 0) return null
    if (prev === 0) return null
    return ((curr - prev) / prev) * 100
  }

  function validate(f) {
    const e = {}
    if (!f.amount || isNaN(parseFloat(f.amount)) || parseFloat(f.amount) <= 0) e.amount = 'Valid amount required'
    if (!f.date) e.date = 'Required'
    return e
  }

  function openAdd() { setForm({ ...emptyForm }); setErrors({}); setShowAdd(true) }
  function openEdit(item) {
    setForm({ type: item.type, category: item.category || 'General', amount: item.amount, currency: item.currency || 'USD', date: item.date, reference: item.reference || '', description: item.description || '', orderId: item.orderId || '' })
    setErrors({})
    setEditItem(item)
  }

  async function handleAdd() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    await addFinanceRecord(form)
    setShowAdd(false)
  }

  async function handleEdit() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    await updateFinanceRecord(editItem.id, form)
    setEditItem(null)
  }

  async function handleDelete(id) {
    await deleteFinanceRecord(id)
    setDeletingId(null)
  }

  function exportCSV() {
    const header = ['Code', 'Type', 'Category', 'Date', 'Reference', 'Amount', 'Description', 'Linked Order']
    const rows = financeRecords.map(r => [
      r.code, r.type, r.category, r.date,
      r.reference || '', r.amount.toFixed(2),
      r.description || '', r.order?.code || '',
    ])
    const csv = [header, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allCategories = useMemo(() =>
    [...new Set(financeRecords.map(r => r.category))].sort(),
    [financeRecords]
  )

  const filtered = useMemo(() => {
    return financeRecords.filter(r => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (dateFilter === 'this_month' && !r.date?.startsWith(thisMonthPrefix)) return false
      if (dateFilter === 'last_month' && !r.date?.startsWith(lastMonthPrefix)) return false
      if (dateFilter === 'this_year' && !r.date?.startsWith(thisYearPrefix)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          r.code.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.reference || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [financeRecords, typeFilter, categoryFilter, dateFilter, search, thisMonthPrefix, lastMonthPrefix, thisYearPrefix])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const incomeChg = pctChange(summary.tmIncome, summary.lmIncome)
  const expenseChg = pctChange(summary.tmExpense, summary.lmExpense)
  const hasFilters = search || typeFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all'

  return (
    <div className="h-full flex flex-col overflow-hidden px-5 pt-4 pb-3">

      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Finance</h1>
          <p className="text-xs text-text-muted mt-0.5">Track income, expenses and cash flow</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshFinanceRecords}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-theme-border text-xs text-text-muted hover:bg-hover-bg transition">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-theme-border text-xs text-text-muted hover:bg-hover-bg transition">
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
          {isAdmin && (
            <button onClick={openAdd}
              className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90 transition">
              <span className="material-symbols-outlined text-sm">add</span>
              Add Record
            </button>
          )}
        </div>
      </div>

      {/* Live rates ticker */}
      <div className="shrink-0 mb-3">
        <CurrencyTicker />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-3 shrink-0">
        <div className="bg-surface-container-lowest border border-theme-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-base">trending_up</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Total Income</p>
            <p className="text-base font-bold text-primary tabular-nums">{fmt(summary.income)}</p>
            <p className="text-[10px] text-text-muted">{summary.incomeCount} tx</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-theme-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-error text-base">trending_down</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Total Expenses</p>
            <p className="text-base font-bold text-error tabular-nums">{fmt(summary.expense)}</p>
            <p className="text-[10px] text-text-muted">{summary.expenseCount} tx</p>
          </div>
        </div>

        <div className={`border rounded-xl p-3 flex items-center gap-3 ${summary.balance >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-200' : 'bg-red-50 dark:bg-red-900/10 border-red-200'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${summary.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className={`material-symbols-outlined text-base ${summary.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>account_balance</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Net Balance</p>
            <p className={`text-base font-bold tabular-nums ${summary.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {summary.balance >= 0 ? '+' : '-'}{fmt(Math.abs(summary.balance))}
            </p>
            <p className="text-[10px] text-text-muted">All time</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-theme-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant text-base">calendar_month</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">This Month</p>
            <p className={`text-base font-bold tabular-nums ${summary.tmNet >= 0 ? 'text-primary' : 'text-error'}`}>
              {summary.tmNet >= 0 ? '+' : '-'}{fmt(Math.abs(summary.tmNet))}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-primary">↑{fmt(summary.tmIncome)}</span>
              <span className="text-[10px] text-error">↓{fmt(summary.tmExpense)}</span>
              {incomeChg !== null && (
                <span className={`text-[10px] font-semibold ${incomeChg >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {incomeChg >= 0 ? '▲' : '▼'}{Math.abs(incomeChg).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-2 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-base">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-theme-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
            placeholder="Search code, category, reference…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-0.5 bg-surface-container-lowest border border-theme-border rounded-xl p-0.5">
          {['all', 'income', 'expense'].map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition capitalize ${typeFilter === t ? 'bg-primary text-white' : 'text-text-muted hover:bg-hover-bg'}`}>
              {t}
            </button>
          ))}
        </div>
        <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1) }}
          className="bg-surface-container-lowest border border-theme-border rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary">
          <option value="all">All Time</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
        </select>
        {allCategories.length > 0 && (
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            className="bg-surface-container-lowest border border-theme-border rounded-xl px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary">
            <option value="all">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {hasFilters && (
          <button onClick={() => { setSearch(''); setTypeFilter('all'); setCategoryFilter('all'); setDateFilter('all'); setPage(1) }}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-error transition">
            <span className="material-symbols-outlined text-sm">close</span>
            Clear
          </button>
        )}
      </div>

      {/* Table — fills remaining space */}
      <div className="flex-1 min-h-0 bg-surface-container-lowest rounded-xl border border-theme-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-theme-border shrink-0">
          <span className="text-xs text-text-muted">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          {filtered.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-primary font-semibold tabular-nums">
                ↑ {fmt(filtered.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0))}
                <span className="text-text-muted font-normal ml-0.5">mixed</span>
              </span>
              <span className="text-error font-semibold tabular-nums">
                ↓ {fmt(filtered.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0))}
                <span className="text-text-muted font-normal ml-0.5">mixed</span>
              </span>
            </div>
          )}
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-container-lowest z-10">
              <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-semibold">Code</th>
                <th className="text-left px-4 py-2.5 font-semibold">Type</th>
                <th className="text-left px-4 py-2.5 font-semibold">Category</th>
                <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                <th className="text-left px-4 py-2.5 font-semibold">Reference</th>
                <th className="text-left px-4 py-2.5 font-semibold">Description</th>
                <th className="text-right px-4 py-2.5 font-semibold">Amount</th>
                {isAdmin && <th className="px-4 py-2.5 w-20" />}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-text-muted">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">receipt_long</span>
                    No records found
                  </td>
                </tr>
              ) : (
                paginated.map(r => (
                  <tr key={r.id} onClick={() => setDetailRecord(r)} className="border-b border-theme-border last:border-0 hover:bg-hover-bg transition-colors cursor-pointer">
                    <td className="px-4 py-2.5 font-mono text-xs text-text-muted">{r.code}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${r.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                        <span className="material-symbols-outlined text-xs">{r.type === 'income' ? 'arrow_circle_down' : 'arrow_circle_up'}</span>
                        {r.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-text-muted">{r.category}</td>
                    <td className="px-4 py-2.5 text-xs text-text-muted whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-2.5 text-xs text-text-muted">{r.reference || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-text-muted max-w-[160px] truncate" title={r.description || ''}>{r.description || '—'}</td>
                    <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${r.type === 'income' ? 'text-primary' : 'text-error'}`}>
                      {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                      <span className="text-[10px] font-normal text-text-muted ml-1">{r.currency || 'USD'}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                        {deletingId === r.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => handleDelete(r.id)} className="text-xs font-semibold text-white bg-error px-2 py-1 rounded-lg transition">Yes</button>
                            <button onClick={() => setDeletingId(null)} className="text-xs text-text-muted px-1 transition">No</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-primary transition">
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button onClick={() => setDeletingId(r.id)} className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-error transition">
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-theme-border shrink-0 text-xs text-text-muted">
            <span>Page {page} of {totalPages} · {filtered.length} records</span>
            <div className="flex gap-1.5">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Next</button>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="New Transaction" form={form} setForm={setForm} errors={errors}
          onClose={() => setShowAdd(false)} onSave={handleAdd} orders={orders}
          rates={rates} ratesBase={ratesBase} />
      )}
      {editItem && (
        <Modal title="Edit Transaction" form={form} setForm={setForm} errors={errors}
          onClose={() => setEditItem(null)} onSave={handleEdit} orders={orders}
          rates={rates} ratesBase={ratesBase} />
      )}
      {detailRecord && (
        <RecordDetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          orders={orders}
          customers={customers}
        />
      )}
    </div>
  )
}
