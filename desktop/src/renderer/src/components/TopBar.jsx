import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'

export default function TopBar() {
  const { user } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const { reports, employees } = useData()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [showOverdue, setShowOverdue] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const overdueRef = useRef(null)
  const userMenuRef = useRef(null)

  const today = new Date(new Date().toDateString())
  const overdueReports = (reports || []).filter(
    (r) => r.dueDate && new Date(r.dueDate) < today && r.column !== 'completed' && r.column !== 'cancelled'
  )

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showOverdue && !showUserMenu) return
    function handleClick(e) {
      if (showOverdue && overdueRef.current && !overdueRef.current.contains(e.target)) setShowOverdue(false)
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showOverdue, showUserMenu])

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const utcOffset = -now.getTimezoneOffset() / 60
  const timezone = `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`
  const date = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const matchedEmployee = user?.email
    ? (employees || []).find((e) => e.email && e.email.toLowerCase() === user.email.toLowerCase())
    : null

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const roleBadge = user?.role === 'admin' ? 'Admin' : 'User'

  return (
    <header className="w-full h-16 sticky top-0 z-30 bg-surface-container-lowest flex items-center justify-between px-6">
      {/* Date & Time */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-xl">schedule</span>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-on-surface" style={{ fontVariantNumeric: 'tabular-nums', minWidth: '5.5em' }}>{time}</span>
            <span className="text-[10px] font-medium text-text-subtle">{timezone}</span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">{date}</p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="relative" ref={overdueRef}>
            <button
              onClick={() => setShowOverdue((v) => !v)}
              className="p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-hover-bg relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {overdueReports.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error text-on-error text-[9px] font-black flex items-center justify-center">
                  {overdueReports.length}
                </span>
              )}
            </button>
            {showOverdue && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-2xl shadow-inverse-surface/20 border border-surface-container-low overflow-hidden z-50">
                <div className="px-4 pt-4 pb-2 border-b border-surface-container-low">
                  <span className="text-xs font-extrabold text-on-surface">Overdue Tasks</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {overdueReports.length === 0 ? (
                    <div className="px-4 py-6 text-center text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-2xl block mb-1">check_circle</span>
                      No overdue tasks
                    </div>
                  ) : (
                    overdueReports.map((r) => (
                      <div key={r.id} className="px-4 py-3 hover:bg-hover-bg transition-colors border-b border-surface-container-low last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-on-surface truncate">{r.title}</p>
                          <span className="text-[10px] font-bold text-error whitespace-nowrap">
                            {Math.ceil((today - new Date(r.dueDate)) / 86400000)}d overdue
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">business</span>
                            {r.customer?.name || 'No customer'}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">engineering</span>
                            {r.technician?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-hover-bg">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <button onClick={toggleTheme} className="p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-hover-bg" title={dark ? 'Light mode' : 'Dark mode'}>
            <span className="material-symbols-outlined">{dark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-3 pl-4 border-l border-theme-border hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-on-surface leading-none">{user?.name || 'User'}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{roleBadge}</p>
              {matchedEmployee && (
                <p className="text-[10px] text-primary mt-0.5 flex items-center justify-end gap-0.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>badge</span>
                  {matchedEmployee.name}
                </p>
              )}
            </div>
            <div className="w-9 h-9 rounded-full primary-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-2xl shadow-inverse-surface/20 border border-surface-container-low overflow-hidden z-50">
              <button
                onClick={() => { navigate('/account'); setShowUserMenu(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-on-surface hover:bg-hover-bg transition-colors"
              >
                <span className="material-symbols-outlined text-base text-text-muted">person</span>
                My Account
              </button>
              <button
                onClick={() => { navigate('/attendance'); setShowUserMenu(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-on-surface hover:bg-hover-bg transition-colors border-t border-surface-container-low"
              >
                <span className="material-symbols-outlined text-base text-text-muted">schedule</span>
                Attendance
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
