import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import aksLogoLight from '../assets/aks_logo.png'
import aksLogoDark from '../assets/aks_logo_dark.png'

const ALL_NAV_ITEMS = [
  { key: 'dashboard',   to: '/dashboard',   icon: 'dashboard',              label: 'Dashboard' },
  { key: 'customers',   to: '/customers',   icon: 'groups',                 label: 'Customers' },
  { key: 'products',    to: '/products',    icon: 'inventory_2',            label: 'Products' },
  { key: 'orders',      to: '/orders',      icon: 'shopping_cart',          label: 'Orders' },
  { key: 'work-orders', to: '/work-orders', icon: 'location_on',            label: 'Site Visits' },
  { key: 'reports',     to: '/reports',     icon: 'analytics',              label: 'Tasks' },
  { key: 'production',  to: '/production',  icon: 'precision_manufacturing',label: 'Production' },
  { key: 'maintenance', to: '/maintenance', icon: 'build',                  label: 'Maintenance & Repair' },
  { key: 'logistics',   to: '/logistics',   icon: 'local_shipping',         label: 'Logistics' },
  { key: 'purchasing',  to: '/purchasing',  icon: 'shopping_bag',           label: 'Purchasing' },
]

const adminNavItems = [
  { to: '/finance',   icon: 'account_balance_wallet', label: 'Finance' },
  { to: '/employees', icon: 'badge',                  label: 'Employees' },
{ to: '/settings',  icon: 'settings',               label: 'Settings' },
]

export default function Sidebar() {
  const { logout, isAdmin, user } = useAuth()
  const { dark } = useTheme()
  const { permissions } = useData()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const dept = user?.department
  const canSee = (page) => isAdmin || (permissions[dept] || []).includes(page)

  const base = ALL_NAV_ITEMS.filter((item) => item.key === 'dashboard' || canSee(item.key))
  const items = isAdmin ? [...ALL_NAV_ITEMS, ...adminNavItems] : base

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-sidebar flex flex-col py-8 z-40">
      {/* Logo */}
      <div className="px-6 mb-10 flex flex-col items-center">
        <img src={dark ? aksLogoDark : aksLogoLight} alt="AKS" className="w-36 object-contain" />
      </div>

      {/* Nav */}
      <nav className="overflow-y-auto space-y-1" style={{ maxHeight: 'calc(10 * 56px)' }}>
        {items.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-6 py-4 text-primary font-bold border-r-4 border-primary bg-surface-container-lowest cursor-pointer'
                : 'flex items-center gap-3 px-6 py-4 text-text-muted hover:text-on-surface hover:bg-hover-bg transition-colors duration-150 cursor-pointer'
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'fill-icon' : ''}`}>
                  {icon}
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto border-t border-theme-border pt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 text-text-muted hover:text-error transition-colors w-full"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Log Out
          </span>
        </button>
      </div>
    </aside>
  )
}
