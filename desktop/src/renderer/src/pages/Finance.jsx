import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'

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

// ─── 6-Month Bar Chart ───────────────────────────────────────────────────────
function MonthlyChart({ records }) {
  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      return {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
      }
    })
  }, [])

  const data = useMemo(() => months.map(({ year, month, label }) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const recs = records.filter(r => r.date?.startsWith(prefix))
    const income = recs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
    const expense = recs.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    return { label, income, expense }
  }), [months, records])

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1)
  const H = 96
  const barW = 16
  const gap = 3
  const groupGap = 22
  const groupW = barW * 2 + gap + groupGap
  const W = groupW * 6 + groupGap

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
        <line x1="0" y1={H} x2={W} y2={H} stroke="currentColor" opacity="0.08" strokeWidth="1" />
        {data.map((d, i) => {
          const x = i * groupW + groupGap / 2
          const incH = Math.max(3, (d.income / maxVal) * H)
          const expH = Math.max(3, (d.expense / maxVal) * H)
          return (
            <g key={i}>
              <rect x={x} y={H - incH} width={barW} height={incH} rx="3"
                fill="var(--md-sys-color-primary, #4f82f7)" opacity="0.8">
                <title>{d.label} Income: ${fmt(d.income)}</title>
              </rect>
              <rect x={x + barW + gap} y={H - expH} width={barW} height={expH} rx="3"
                fill="#f87171" opacity="0.85">
                <title>{d.label} Expense: ${fmt(d.expense)}</title>
              </rect>
              <text x={x + barW} y={H + 14} textAnchor="middle"
                fill="currentColor" opacity="0.45" style={{ fontSize: 9 }}>{d.label}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-2.5 h-2.5 rounded-sm inline-block opacity-80" style={{ background: 'var(--md-sys-color-primary, #4f82f7)' }} />
          Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-400 opacity-85" />
          Expense
        </span>
      </div>
    </div>
  )
}

// ─── Category Breakdown ──────────────────────────────────────────────────────
function CategoryBreakdown({ records, type }) {
  const breakdown = useMemo(() => {
    const filtered = records.filter(r => r.type === type)
    const total = filtered.reduce((s, r) => s + r.amount, 0)
    const map = {}
    filtered.forEach(r => { map[r.category] = (map[r.category] || 0) + r.amount })
    return Object.entries(map)
      .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? (amt / total) * 100 : 0 }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 6)
  }, [records, type])

  if (breakdown.length === 0) {
    return <p className="text-xs text-text-muted text-center py-6">No {type} data yet</p>
  }

  return (
    <div className="space-y-3">
      {breakdown.map(({ cat, amt, pct }) => (
        <div key={cat}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-on-surface font-medium truncate max-w-[130px]">{cat}</span>
            <span className="text-text-muted ml-2 shrink-0 tabular-nums">${fmt(amt)}</span>
          </div>
          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${type === 'income' ? 'bg-primary' : 'bg-red-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ title, form, setForm, onClose, onSave, errors, orders }) {
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

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Finance() {
  const { financeRecords, addFinanceRecord, updateFinanceRecord, deleteFinanceRecord, orders, isAdmin } = useData()
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
  const [breakdownType, setBreakdownType] = useState('expense')

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Finance</h1>
          <p className="text-sm text-text-muted mt-0.5">Track income, expenses and cash flow</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-theme-border text-sm text-text-muted hover:bg-hover-bg transition">
            <span className="material-symbols-outlined text-base">download</span>
            Export CSV
          </button>
          {isAdmin && (
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
              <span className="material-symbols-outlined text-base">add</span>
              Add Record
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total Income */}
        <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Total Income</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-base">trending_up</span>
            </div>
          </div>
          <p className="text-xl font-bold text-primary">${fmt(summary.income)}</p>
          <p className="text-xs text-text-muted mt-1">{summary.incomeCount} transactions</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Total Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-base">trending_down</span>
            </div>
          </div>
          <p className="text-xl font-bold text-error">${fmt(summary.expense)}</p>
          <p className="text-xs text-text-muted mt-1">{summary.expenseCount} transactions</p>
        </div>

        {/* Net Balance */}
        <div className={`border rounded-2xl p-4 ${summary.balance >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Net Balance</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.balance >= 0 ? 'bg-green-100 dark:bg-green-800/30' : 'bg-red-100 dark:bg-red-800/30'}`}>
              <span className={`material-symbols-outlined text-base ${summary.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>account_balance</span>
            </div>
          </div>
          <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
            {summary.balance >= 0 ? '+' : '-'}${fmt(Math.abs(summary.balance))}
          </p>
          <p className="text-xs text-text-muted mt-1">All time</p>
        </div>

        {/* This Month */}
        <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">This Month</span>
            <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-base">calendar_month</span>
            </div>
          </div>
          <p className={`text-xl font-bold ${summary.tmNet >= 0 ? 'text-primary' : 'text-error'}`}>
            {summary.tmNet >= 0 ? '+' : '-'}${fmt(Math.abs(summary.tmNet))}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-primary">↑ ${fmt(summary.tmIncome)}</span>
            <span className="text-xs text-error">↓ ${fmt(summary.tmExpense)}</span>
            {incomeChg !== null && (
              <span className={`text-[10px] font-semibold ${incomeChg >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {incomeChg >= 0 ? '▲' : '▼'}{Math.abs(incomeChg).toFixed(0)}% vs last mo.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-surface-container-lowest border border-theme-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-4">6-Month Cash Flow</h3>
          <MonthlyChart records={financeRecords} />
        </div>

        <div className="bg-surface-container-lowest border border-theme-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface">Top Categories</h3>
            <div className="flex gap-0.5 bg-surface-container-high rounded-lg p-0.5">
              {['income', 'expense'].map(t => (
                <button key={t} onClick={() => setBreakdownType(t)}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition capitalize ${
                    breakdownType === t ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-text-muted'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <CategoryBreakdown records={financeRecords} type={breakdownType} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-theme-border rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            placeholder="Search code, category, reference…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <div className="flex gap-0.5 bg-surface-container-lowest border border-theme-border rounded-xl p-1">
          {['all', 'income', 'expense'].map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition capitalize ${typeFilter === t ? 'bg-primary text-white' : 'text-text-muted hover:bg-hover-bg'}`}>
              {t}
            </button>
          ))}
        </div>

        <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1) }}
          className="bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary">
          <option value="all">All Time</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
        </select>

        {allCategories.length > 0 && (
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            className="bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary">
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

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
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

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-semibold">Code</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Category</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-left px-4 py-3 font-semibold">Reference</th>
              <th className="text-left px-4 py-3 font-semibold">Description</th>
              <th className="text-right px-4 py-3 font-semibold">Amount</th>
              {isAdmin && <th className="px-4 py-3 w-20" />}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center py-16 text-text-muted">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">receipt_long</span>
                  No records found
                </td>
              </tr>
            ) : (
              paginated.map(r => (
                <tr key={r.id} className="border-b border-theme-border last:border-0 hover:bg-hover-bg transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{r.code}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                    }`}>
                      <span className="material-symbols-outlined text-xs">
                        {r.type === 'income' ? 'arrow_circle_down' : 'arrow_circle_up'}
                      </span>
                      {r.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{r.category}</td>
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{r.reference || '—'}</td>
                  <td className="px-4 py-3 text-xs text-text-muted max-w-[160px] truncate" title={r.description || ''}>
                    {r.description || '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${r.type === 'income' ? 'text-primary' : 'text-error'}`}>
                    {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                    <span className="text-[10px] font-normal text-text-muted ml-1">{r.currency || 'USD'}</span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {deletingId === r.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => handleDelete(r.id)}
                            className="text-xs font-semibold text-white bg-error px-2 py-1 rounded-lg transition">
                            Yes
                          </button>
                          <button onClick={() => setDeletingId(null)}
                            className="text-xs text-text-muted px-1 transition">
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={() => openEdit(r)}
                            className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-primary transition">
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button onClick={() => setDeletingId(r.id)}
                            className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-error transition">
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
        <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
          <span>Page {page} of {totalPages} · {filtered.length} records</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">
              Prev
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">
              Next
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="New Transaction" form={form} setForm={setForm} errors={errors}
          onClose={() => setShowAdd(false)} onSave={handleAdd} orders={orders} />
      )}
      {editItem && (
        <Modal title="Edit Transaction" form={form} setForm={setForm} errors={errors}
          onClose={() => setEditItem(null)} onSave={handleEdit} orders={orders} />
      )}
    </div>
  )
}
