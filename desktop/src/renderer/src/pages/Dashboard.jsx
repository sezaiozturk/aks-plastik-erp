import { useState, useEffect, useMemo } from 'react'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function buildChartDays(reports, siteVisits) {
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const tasks = reports.filter((r) => r.createdAt?.startsWith(key)).length
    const visits = siteVisits.filter((v) => v.date === key).length
    days.push({ day: DAY_LABELS[d.getDay()], tasks, visits, total: tasks + visits })
  }
  return days
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


import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useData } from '../context/DataContext'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
import { VisitDetailModal } from './WorkOrders'

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 13)
    } else {
      map.fitBounds(positions, { padding: [30, 30] })
    }
  }, [map, positions])
  return null
}

function InvalidateSize({ trigger }) {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200)
  }, [trigger, map])
  return null
}

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})


export default function Dashboard() {
  const { reports, employees, customers, siteVisits, updateSiteVisit, deleteSiteVisit } = useData()
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [mapFullscreen, setMapFullscreen] = useState(false)

  const chartDays = useMemo(() => buildChartDays(reports, siteVisits), [reports, siteVisits])
  const chartMax = Math.max(...chartDays.map((d) => d.total), 1)
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

      {/* Asymmetric Main View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Chart + Activity (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart */}
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-extrabold text-on-surface">Weekly Activity</h3>
                <p className="text-sm text-on-surface-variant">Tasks and site visits over the last 7 days</p>
              </div>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--color-chart-task)' }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--color-chart-task)' }} /> Tasks
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-tertiary">
                  <span className="w-2 h-2 rounded-full bg-tertiary inline-block" /> Site Visits
                </span>
              </div>
            </div>
            <div className="h-[240px] w-full flex items-end justify-between gap-4">
              {chartDays.map(({ day, tasks, visits }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 group h-full relative">
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--color-chart-task)' }} />{tasks} Tasks</div>
                    <div className="flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block" />{visits} Visits</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-inverse-surface" />
                  </div>
                  <div className="w-full flex flex-col justify-end gap-0.5 h-full">
                    <div
                      className="w-full rounded-t group-hover:opacity-80 transition-colors"
                      style={{ background: 'var(--color-chart-task)', height: `${(tasks / chartMax) * 100}%`, minHeight: tasks ? '4px' : 0 }}
                    />
                    <div
                      className="bg-tertiary w-full rounded-b group-hover:opacity-80 transition-colors"
                      style={{ height: `${(visits / chartMax) * 100}%`, minHeight: visits ? '4px' : 0 }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant">{day}</span>
                </div>
              ))}
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

        {/* Right: Appointments + Map (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Site Visits */}
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-on-surface">Upcoming Site Visits</h3>
            </div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {[...siteVisits].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((visit) => (
                <div
                  key={visit.title}
                  className={`relative pl-4 py-3 rounded-lg border-l-4 ${
                    visit.active
                      ? 'bg-surface-container-low border-primary'
                      : 'bg-surface-container-lowest border-outline-variant'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-on-surface-variant">
                        {visit.time}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        visit.date === new Date().toISOString().split('T')[0]
                          ? 'bg-tertiary-fixed text-tertiary'
                          : 'bg-surface-container-high text-text-muted'
                      }`}>
                        {visit.date === new Date().toISOString().split('T')[0] ? 'Today' : fmtDate(visit.date)}
                      </span>
                    </div>
                    <button onClick={() => setSelectedVisit(visit)} className="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary transition-colors">
                      more_vert
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface mt-1">{visit.title}</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">{visit.location}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-6 h-6 rounded-full primary-gradient flex items-center justify-center text-white text-[9px] font-bold">
                      {(visit.technicianName || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-medium text-on-surface">Lead: {visit.technicianName || 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Locations */}
          <div className={`bg-surface-container-lowest rounded-xl overflow-hidden ${mapFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
            <div className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-on-surface mb-1">Customer Locations</h3>
                <p className="text-xs text-on-surface-variant">Active customer regions on the map</p>
              </div>
              <button
                onClick={() => setMapFullscreen((v) => !v)}
                className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                title={mapFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                <span className="material-symbols-outlined">{mapFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
              </button>
            </div>
            <div className={mapFullscreen ? 'h-[calc(100%-120px)] w-full' : 'h-64 w-full'}>
              {(() => {
                const positions = customers
                  .filter((c) => c.latitude != null && c.longitude != null)
                  .map((c) => [c.latitude, c.longitude])
                return (
                  <MapContainer
                    center={positions.length === 1 ? positions[0] : [39.8283, -98.5795]}
                    zoom={positions.length === 1 ? 13 : 4}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FitBounds positions={positions} />
                    <InvalidateSize trigger={mapFullscreen} />
                    {customers
                      .filter((c) => c.latitude != null && c.longitude != null)
                      .map((c) => (
                        <Marker key={c.id} position={[c.latitude, c.longitude]}>
                          <Popup>
                            <strong>{c.name}</strong>
                            <br />
                            {c.region}
                            <br />
                            <span style={{ fontSize: 11 }}>
                              {c.activeOrders} active / {c.totalOrders} total orders
                            </span>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                )
              })()}
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-surface-container-low rounded-lg">
                <div className="text-xs font-bold text-on-surface">{customers.length}</div>
                <div className="text-[9px] text-on-surface-variant uppercase">Total Customers</div>
              </div>
              <div className="text-center p-2 bg-surface-container-low rounded-lg">
                <div className="text-xs font-bold text-on-surface">
                  {new Set(customers.map((c) => c.region).filter(Boolean)).size}
                </div>
                <div className="text-[9px] text-on-surface-variant uppercase">Regions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          customers={customers}
          employees={employees}
          onClose={() => setSelectedVisit(null)}
          onSave={(id, form) => { updateSiteVisit(id, form); setSelectedVisit(null) }}
          onDelete={(id) => { deleteSiteVisit(id); setSelectedVisit(null) }}
        />
      )}
    </div>
  )
}
