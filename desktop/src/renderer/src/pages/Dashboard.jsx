import { useState, useMemo } from 'react'

function DonutChart({ income, expenses }) {
  const total = income + expenses
  const r = 70
  const cx = 90
  const cy = 90
  const stroke = 22
  const circumference = 2 * Math.PI * r

  const incomeSlice = total > 0 ? (income / total) * circumference : 0
  const expenseSlice = total > 0 ? (expenses / total) * circumference : 0
  const incomeOffset = 0
  const expenseOffset = -incomeSlice

  return (
    <svg viewBox="0 0 180 180" className="w-full h-full" style={{ maxWidth: 180, maxHeight: 180 }}>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-surface-container-low)" strokeWidth={stroke} />
      ) : (
        <>
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#22c55e"
            strokeWidth={stroke}
            strokeDasharray={`${incomeSlice} ${circumference - incomeSlice}`}
            strokeDashoffset={-incomeOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#ef4444"
            strokeWidth={stroke}
            strokeDasharray={`${expenseSlice} ${circumference - expenseSlice}`}
            strokeDashoffset={expenseOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </>
      )}
    </svg>
  )
}

const ORDER_STATUS_COLORS = {
  'Processing':           '#3b82f6',
  'Confirmed':            '#6366f1',
  'In-Production':        '#f59e0b',
  'Production Completed': '#f97316',
  'E-WayBill':            '#a855f7',
  'In Delivery':          '#06b6d4',
  'E-Invoice':            '#14b8a6',
  'Delivered':            '#22c55e',
}

function OrdersDonutChart({ segments }) {
  const r = 70
  const cx = 90
  const cy = 90
  const stroke = 22
  const circumference = 2 * Math.PI * r
  const total = segments.reduce((s, seg) => s + seg.count, 0)

  let cumulative = 0
  return (
    <svg viewBox="0 0 180 180" className="w-full h-full" style={{ maxWidth: 180, maxHeight: 180 }}>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-surface-container-low)" strokeWidth={stroke} />
      ) : (
        segments.map((seg) => {
          const dash = (seg.count / total) * circumference
          const offset = -cumulative
          cumulative += dash
          return (
            <circle
              key={seg.status}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          )
        })
      )}
    </svg>
  )
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const activityConfig = {
  customer:  { icon: 'groups',      iconBg: 'bg-surface-container-high', iconColor: 'text-tertiary' },
  employee:  { icon: 'badge',       iconBg: 'bg-surface-container-high', iconColor: 'text-secondary' },
  report:    { icon: 'analytics',   iconBg: 'bg-surface-container-high', iconColor: 'text-primary' },
  siteVisit: { icon: 'location_on', iconBg: 'bg-surface-container-high', iconColor: 'text-error' },
}

function buildActivity(customers, employees, reports, siteVisits) {
  const items = []

  customers.forEach((c) => {
    items.push({
      ...activityConfig.customer,
      title: `Customer: ${c.name}`,
      desc: `${c.code} — ${c.region || 'No region'}`,
      date: c.updatedAt || c.createdAt,
    })
  })

  employees.forEach((e) => {
    items.push({
      ...activityConfig.employee,
      title: `Employee: ${e.name}`,
      desc: `${e.code} — ${e.department || 'General'}${e.position ? ` • ${e.position}` : ''}`,
      date: e.updatedAt || e.createdAt,
    })
  })

  reports.forEach((r) => {
    const status = r.column === 'completed' ? 'Completed' : r.column === 'in-progress' ? 'In Progress' : 'Open'
    items.push({
      ...activityConfig.report,
      title: `Task: ${r.title}`,
      desc: `${r.code} — ${r.priority} priority • ${status}`,
      date: r.updatedAt || r.createdAt,
    })
  })

  siteVisits.forEach((v) => {
    items.push({
      ...activityConfig.siteVisit,
      title: `Visit: ${v.title}`,
      desc: `${v.code} — ${v.location || 'No location'}${v.employeeName ? ` • ${v.employeeName}` : ''}`,
      date: v.updatedAt || v.createdAt,
    })
  })

  items.sort((a, b) => new Date(b.date) - new Date(a.date))
  return items.slice(0, 10)
}


import { useData } from '../context/DataContext'


export default function Dashboard() {
  const { reports, employees, customers, siteVisits, financeRecords, orders } = useData()

  const totalIncome   = useMemo(() => financeRecords.filter((r) => r.type === 'income').reduce((s, r) => s + Number(r.amount || 0), 0), [financeRecords])
  const totalExpenses = useMemo(() => financeRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0), [financeRecords])
  const netBalance    = totalIncome - totalExpenses

  const orderSegments = useMemo(() => {
    const statuses = ['Processing', 'Confirmed', 'In-Production', 'Production Completed', 'E-WayBill', 'In Delivery', 'E-Invoice', 'Delivered']
    return statuses
      .map((status) => ({ status, color: ORDER_STATUS_COLORS[status], count: orders.filter((o) => o.status === status).length }))
      .filter((s) => s.count > 0)
  }, [orders])

  const recentActivity = useMemo(() => buildActivity(customers, employees, reports, siteVisits), [customers, employees, reports, siteVisits])
  const activeEmps = employees.filter((e) => e.status === 'Active').length
  const totalEmps  = employees.length


  const metrics = [
    {
      label: 'Total Tasks',
      value: String(reports.length),
      icon: 'add_task',
      iconColor: 'text-primary',
      accent: true,
      trend: `${reports.filter((r) => r.column === 'in-progress').length} in progress`,
      trendIcon: 'pending',
      trendColor: 'text-secondary',
      bar: false,
    },
    {
      label: 'Total Employees',
      value: String(totalEmps),
      icon: 'badge',
      iconColor: 'text-secondary',
      accent: false,
      trend: `${activeEmps} active`,
      trendIcon: 'check_circle',
      trendColor: 'text-secondary',
      bar: false,
    },
    {
      label: 'Customers Served',
      value: customers.length.toLocaleString(),
      icon: 'groups',
      iconColor: 'text-tertiary',
      accent: false,
      trend: `${customers.length} registered`,
      trendIcon: 'check_circle',
      trendColor: 'text-tertiary',
      bar: false,
    },
    {
      label: 'Site Visits',
      value: String(siteVisits.length),
      icon: 'location_on',
      iconColor: 'text-metric-visits-icon',
      accent: false,
      trend: `${siteVisits.filter((v) => v.status === 'In Progress').length} in progress`,
      trendIcon: 'pending',
      trendColor: 'text-tertiary',
      bar: false,
    },
  ]

  return (
    <div className="p-8 space-y-8 bg-page-bg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Dashboard Overview</h1>
          <p className="text-on-surface-variant mt-1 font-medium">
            Monitoring real-time operational efficiency across all regions.
          </p>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between min-h-[140px] relative overflow-hidden border border-outline-variant/30"
          >
            {m.accent && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />}
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                {m.label}
              </span>
              <span className={`material-symbols-outlined fill-icon ${m.iconColor}`}>{m.icon}</span>
            </div>
            <div>
              <div className="text-3xl font-black text-on-surface">
                {m.value}
                {m.valueSuffix && (
                  <span className="text-sm font-medium text-on-surface-variant ml-1">{m.valueSuffix}</span>
                )}
              </div>
              {m.bar && (
                <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${m.barPct}%` }} />
                </div>
              )}
              {m.trend && (
                <div className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${m.trendColor}`}>
                  <span className="material-symbols-outlined text-[14px]">{m.trendIcon}</span>
                  {m.trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Finance Overview Pie Chart */}
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="mb-6">
              <h3 className="text-lg font-extrabold text-on-surface">Finance Overview</h3>
              <p className="text-sm text-on-surface-variant">Income, expenses and net balance</p>
            </div>
            <div className="flex items-center gap-8">
              {/* Donut Chart */}
              <div className="relative flex-shrink-0 w-[180px] h-[180px]">
                <DonutChart income={totalIncome} expenses={totalExpenses} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Net</span>
                  <span className={`text-lg font-black tabular-nums ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {netBalance >= 0 ? '+' : ''}
                    {netBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              {/* Legend + Values */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Income</div>
                    <div className="text-xl font-black text-green-500 tabular-nums">
                      {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Expenses</div>
                    <div className="text-xl font-black text-red-500 tabular-nums">
                      {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="border-t border-outline-variant/30 pt-4 flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${netBalance >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Net Balance</div>
                    <div className={`text-xl font-black tabular-nums ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {netBalance >= 0 ? '+' : ''}
                      {netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Status Pie Chart */}
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="mb-6">
              <h3 className="text-lg font-extrabold text-on-surface">Orders by Status</h3>
              <p className="text-sm text-on-surface-variant">Distribution across all order stages</p>
            </div>
            <div className="flex items-center gap-8">
              {/* Donut */}
              <div className="relative flex-shrink-0 w-[180px] h-[180px]">
                <OrdersDonutChart segments={orderSegments} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-on-surface">{orders.length}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3">
                {orderSegments.length === 0 ? (
                  <p className="col-span-2 text-sm text-on-surface-variant">No orders yet.</p>
                ) : (
                  orderSegments.map((seg) => (
                    <div key={seg.status} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-on-surface truncate">{seg.status}</div>
                        <div className="text-[10px] text-on-surface-variant">
                          {seg.count} · {orders.length ? Math.round((seg.count / orders.length) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

      </div>

      {/* Recent Activity */}
      <div className="bg-surface-container-lowest rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-on-surface">Recent Activity</h3>
          <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">
            View All
          </button>
        </div>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {recentActivity.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              className="flex items-start gap-4 p-4 hover:bg-surface-container-low rounded-xl transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full ${item.iconBg} flex items-center justify-center ${item.iconColor} flex-shrink-0`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-bold text-on-surface">{item.title}</h4>
                  <span className="text-[10px] font-medium text-on-surface-variant whitespace-nowrap">
                    {timeAgo(item.date)}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
