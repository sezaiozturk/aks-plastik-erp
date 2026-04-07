import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { API_URL } from '../config'

const LEAVE_TYPES = ['Annual', 'Sick', 'Personal', 'Unpaid']

// ── helpers ──────────────────────────────────────────────────────────────────
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function calcHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null
  const [h1, m1] = checkIn.split(':').map(Number)
  const [h2, m2] = checkOut.split(':').map(Number)
  const diff = h2 * 60 + m2 - (h1 * 60 + m1)
  if (diff <= 0) return null
  const hrs = Math.floor(diff / 60)
  const mins = diff % 60
  return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`.trim()
}

function countWeekdays(start, end) {
  let count = 0
  const d = new Date(start)
  const last = new Date(end)
  while (d <= last) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

const statusBadge = {
  Pending: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Approved: 'bg-primary-fixed text-on-primary-fixed-variant',
  Rejected: 'bg-error/10 text-error',
}

// ── My Attendance Tab ────────────────────────────────────────────────────────
function MyAttendanceTab({ employeeId, token }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [records, setRecords] = useState([])
  const [editDate, setEditDate] = useState(null)
  const [editForm, setEditForm] = useState({ checkIn: '', checkOut: '', notes: '' })

  const monthStr = `${year}-${pad(month + 1)}`
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = useCallback(() => {
    if (!employeeId) return
    fetch(`${API_URL}/attendance?employeeId=${employeeId}&month=${monthStr}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setRecords)
      .catch(() => {})
  }, [employeeId, monthStr, token])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const days = []
  const total = daysInMonth(year, month)
  for (let d = 1; d <= total; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
    const dayOfWeek = new Date(year, month, d).getDay()
    const rec = records.find((r) => r.date === dateStr)
    days.push({ date: dateStr, day: d, dayOfWeek, rec })
  }

  const DAYS_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  function startEdit(dateStr, rec) {
    setEditDate(dateStr)
    setEditForm({ checkIn: rec?.checkIn || '', checkOut: rec?.checkOut || '', notes: rec?.notes || '' })
  }

  async function saveEdit() {
    await fetch(`${API_URL}/attendance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ employeeId, date: editDate, ...editForm }),
    })
    setEditDate(null)
    load()
  }

  // Stats
  const workedDays = records.filter((r) => r.checkIn && r.checkOut).length
  const totalMinutes = records.reduce((sum, r) => {
    if (!r.checkIn || !r.checkOut) return sum
    const [h1, m1] = r.checkIn.split(':').map(Number)
    const [h2, m2] = r.checkOut.split(':').map(Number)
    return sum + (h2 * 60 + m2 - (h1 * 60 + m1))
  }, 0)
  const totalHrs = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60

  return (
    <div>
      {/* Month nav + stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg border border-theme-border hover:bg-hover-bg transition">
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <h2 className="text-lg font-bold text-on-surface min-w-[180px] text-center">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg border border-theme-border hover:bg-hover-bg transition">
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-text-muted">
            <span className="font-semibold text-on-surface">{workedDays}</span> days worked
          </div>
          <div className="text-text-muted">
            <span className="font-semibold text-on-surface">{totalHrs}h {totalMins > 0 ? `${totalMins}m` : ''}</span> total
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">Date</th>
              <th className="text-left px-5 py-3 font-semibold">Day</th>
              <th className="text-left px-5 py-3 font-semibold">Check In</th>
              <th className="text-left px-5 py-3 font-semibold">Check Out</th>
              <th className="text-left px-5 py-3 font-semibold">Hours</th>
              <th className="text-left px-5 py-3 font-semibold">Notes</th>
              <th className="text-right px-5 py-3 font-semibold w-16"></th>
            </tr>
          </thead>
          <tbody>
            {days.map(({ date, day, dayOfWeek, rec }) => {
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              const today = new Date().toISOString().split('T')[0]
              const isToday = date === today
              return (
                <tr
                  key={date}
                  className={`border-b border-theme-border transition-colors ${isWeekend ? 'bg-surface-container-high/40' : 'hover:bg-hover-bg'} ${isToday ? 'ring-1 ring-inset ring-primary/30' : ''}`}
                >
                  <td className="px-5 py-2.5">
                    <span className={`font-mono text-xs ${isToday ? 'font-bold text-primary' : 'text-on-surface'}`}>{date}</span>
                  </td>
                  <td className={`px-5 py-2.5 text-xs font-medium ${isWeekend ? 'text-error' : 'text-text-muted'}`}>
                    {DAYS_LABEL[dayOfWeek]}
                  </td>
                  <td className="px-5 py-2.5 text-on-surface">{rec?.checkIn || <span className="text-text-muted">—</span>}</td>
                  <td className="px-5 py-2.5 text-on-surface">{rec?.checkOut || <span className="text-text-muted">—</span>}</td>
                  <td className="px-5 py-2.5 font-medium text-on-surface">{calcHours(rec?.checkIn, rec?.checkOut) || <span className="text-text-muted">—</span>}</td>
                  <td className="px-5 py-2.5 text-text-muted text-xs max-w-[200px] truncate">{rec?.notes || ''}</td>
                  <td className="px-5 py-2.5 text-right">
                    {!isWeekend && (
                      <button onClick={() => startEdit(date, rec)} className="p-1 rounded-lg hover:bg-hover-bg text-text-muted hover:text-primary transition">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-on-surface">Edit — {editDate}</h3>
              <button onClick={() => setEditDate(null)} className="text-text-muted hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Check In</label>
                <input type="time" className="w-full bg-surface-container-lowest border border-theme-border rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary" value={editForm.checkIn} onChange={(e) => setEditForm((f) => ({ ...f, checkIn: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Check Out</label>
                <input type="time" className="w-full bg-surface-container-lowest border border-theme-border rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary" value={editForm.checkOut} onChange={(e) => setEditForm((f) => ({ ...f, checkOut: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Notes</label>
                <input className="w-full bg-surface-container-lowest border border-theme-border rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditDate(null)} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Cancel</button>
              <button onClick={saveEdit} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── My Leave Requests Tab ────────────────────────────────────────────────────
function MyLeaveTab({ employeeId, token }) {
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '' })
  const [errors, setErrors] = useState({})

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = useCallback(() => {
    if (!employeeId) return
    fetch(`${API_URL}/leave-requests?employeeId=${employeeId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setRequests)
      .catch(() => {})
  }, [employeeId, token])

  useEffect(() => { load() }, [load])

  function validate(f) {
    const e = {}
    if (!f.startDate) e.startDate = 'Required'
    if (!f.endDate) e.endDate = 'Required'
    if (f.startDate && f.endDate && f.startDate > f.endDate) e.endDate = 'Must be after start'
    return e
  }

  function openAdd() {
    setForm({ type: 'Annual', startDate: '', endDate: '', reason: '' })
    setErrors({})
    setShowForm(true)
  }

  function openEdit(item) {
    setForm({ type: item.type, startDate: item.startDate, endDate: item.endDate, reason: item.reason })
    setErrors({})
    setEditItem(item)
  }

  async function handleSave() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    const days = countWeekdays(form.startDate, form.endDate)
    if (editItem) {
      const res = await fetch(`${API_URL}/leave-requests/${editItem.id}`, {
        method: 'PUT', headers, body: JSON.stringify({ ...form, days }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error); return }
    } else {
      await fetch(`${API_URL}/leave-requests`, {
        method: 'POST', headers, body: JSON.stringify({ ...form, employeeId, days }),
      })
    }
    setShowForm(false)
    setEditItem(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this leave request?')) return
    const res = await fetch(`${API_URL}/leave-requests/${id}`, { method: 'DELETE', headers })
    if (!res.ok) { const d = await res.json(); alert(d.error); return }
    load()
  }

  const inputCls = (field) =>
    `w-full bg-surface-container-lowest border rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${errors[field] ? 'border-error' : 'border-theme-border'}`

  const usedDays = requests.filter((r) => r.status !== 'Rejected').reduce((sum, r) => sum + r.days, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6 text-sm">
          <div className="text-text-muted">
            <span className="font-semibold text-on-surface">{usedDays}</span> days used / requested
          </div>
          <div className="text-text-muted">
            <span className="font-semibold text-on-surface">{requests.length}</span> total requests
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
          <span className="material-symbols-outlined text-base">add</span>
          New Request
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">Type</th>
              <th className="text-left px-5 py-3 font-semibold">Start</th>
              <th className="text-left px-5 py-3 font-semibold">End</th>
              <th className="text-center px-5 py-3 font-semibold">Days</th>
              <th className="text-left px-5 py-3 font-semibold">Reason</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-right px-5 py-3 font-semibold w-20"></th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted">No leave requests yet</td></tr>
            ) : requests.map((r) => (
              <tr key={r.id} className="border-b border-theme-border hover:bg-hover-bg transition-colors">
                <td className="px-5 py-3 font-medium text-on-surface">{r.type}</td>
                <td className="px-5 py-3 font-mono text-xs text-on-surface">{r.startDate}</td>
                <td className="px-5 py-3 font-mono text-xs text-on-surface">{r.endDate}</td>
                <td className="px-5 py-3 text-center font-semibold text-on-surface">{r.days}</td>
                <td className="px-5 py-3 text-text-muted text-xs max-w-[200px] truncate">{r.reason || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[r.status] || ''}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {r.status === 'Pending' && (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1 rounded-lg hover:bg-hover-bg text-text-muted hover:text-primary transition">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1 rounded-lg hover:bg-hover-bg text-text-muted hover:text-error transition">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      {(showForm || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-on-surface">{editItem ? 'Edit' : 'New'} Leave Request</h3>
              <button onClick={() => { setShowForm(false); setEditItem(null) }} className="text-text-muted hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Type</label>
                <select className={inputCls('type')} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Start Date *</label>
                  <input type="date" className={inputCls('startDate')} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                  {errors.startDate && <p className="text-xs text-error mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">End Date *</label>
                  <input type="date" className={inputCls('endDate')} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                  {errors.endDate && <p className="text-xs text-error mt-1">{errors.endDate}</p>}
                </div>
              </div>
              {form.startDate && form.endDate && form.startDate <= form.endDate && (
                <p className="text-xs text-text-muted">
                  <span className="font-semibold text-on-surface">{countWeekdays(form.startDate, form.endDate)}</span> working days
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Reason</label>
                <textarea rows={2} className={inputCls('reason')} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditItem(null) }} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Team Requests Tab (Supervisor / Admin) ───────────────────────────────────
function TeamRequestsTab({ employeeId, token, isAdmin }) {
  const [requests, setRequests] = useState([])

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const load = useCallback(() => {
    // Admin sees all; supervisor sees subordinates
    const query = isAdmin ? '' : `?supervisorId=${employeeId}`
    fetch(`${API_URL}/leave-requests${query}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setRequests)
      .catch(() => {})
  }, [employeeId, token, isAdmin])

  useEffect(() => { load() }, [load])

  async function handleReview(id, status) {
    await fetch(`${API_URL}/leave-requests/${id}/review`, {
      method: 'PATCH', headers, body: JSON.stringify({ status }),
    })
    load()
  }

  const pending = requests.filter((r) => r.status === 'Pending')
  const reviewed = requests.filter((r) => r.status !== 'Pending')

  return (
    <div>
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-tertiary">pending_actions</span>
            Pending Approval ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="bg-surface-container-lowest rounded-xl border border-theme-border p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-on-surface text-sm">{r.employee?.name}</span>
                    <span className="text-xs text-text-muted">{r.employee?.department}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="font-medium text-on-surface">{r.type}</span>
                    <span>{r.startDate} — {r.endDate}</span>
                    <span className="font-semibold">{r.days} days</span>
                    {r.reason && <span className="truncate max-w-[200px]">{r.reason}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleReview(r.id, 'Approved')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(r.id, 'Rejected')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-error text-error text-xs font-semibold hover:bg-error/10 transition"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-sm font-bold text-on-surface mb-3">All Requests</h3>
      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">Employee</th>
              <th className="text-left px-5 py-3 font-semibold">Type</th>
              <th className="text-left px-5 py-3 font-semibold">Period</th>
              <th className="text-center px-5 py-3 font-semibold">Days</th>
              <th className="text-left px-5 py-3 font-semibold">Reason</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-text-muted">No requests found</td></tr>
            ) : requests.map((r) => (
              <tr key={r.id} className="border-b border-theme-border hover:bg-hover-bg transition-colors">
                <td className="px-5 py-3 font-medium text-on-surface">{r.employee?.name}</td>
                <td className="px-5 py-3 text-text-muted">{r.type}</td>
                <td className="px-5 py-3 font-mono text-xs text-on-surface">{r.startDate} — {r.endDate}</td>
                <td className="px-5 py-3 text-center font-semibold text-on-surface">{r.days}</td>
                <td className="px-5 py-3 text-text-muted text-xs max-w-[180px] truncate">{r.reason || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[r.status] || ''}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'attendance', label: 'My Attendance', icon: 'schedule' },
  { key: 'leaves', label: 'My Leave Requests', icon: 'event_available' },
]

export default function Attendance() {
  const { user, token, isAdmin } = useAuth()
  const { employees } = useData()
  const [tab, setTab] = useState('attendance')

  // Match logged-in user to an employee record by email
  const myEmployee = employees.find((e) => e.email === user?.email)

  // Show Team Requests tab if admin or if this employee has subordinates
  const hasSubordinates = myEmployee && employees.some((e) => e.supervisorId === myEmployee.id)
  const showTeam = isAdmin || hasSubordinates

  const allTabs = showTeam
    ? [...TABS, { key: 'team', label: 'Team Requests', icon: 'group' }]
    : TABS

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Attendance</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {myEmployee ? myEmployee.name : 'Personnel attendance & leave management'}
        </p>
      </div>

      {!myEmployee && (
        <div className="bg-tertiary-fixed/20 text-on-tertiary-fixed-variant rounded-xl px-5 py-4 mb-6 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-base">info</span>
          Your account email doesn't match any employee record. Ask an admin to link your email.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-theme-border">
        {allTabs.map((t) => (
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

      {tab === 'attendance' && <MyAttendanceTab employeeId={myEmployee?.id} token={token} />}
      {tab === 'leaves' && <MyLeaveTab employeeId={myEmployee?.id} token={token} />}
      {tab === 'team' && showTeam && <TeamRequestsTab employeeId={myEmployee?.id} token={token} isAdmin={isAdmin} />}
    </div>
  )
}
