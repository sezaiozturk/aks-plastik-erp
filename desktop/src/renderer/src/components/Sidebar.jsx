import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import aksLogoLight from '../assets/aks_logo.png'
import aksLogoDark from '../assets/aks_logo_dark.png'

const ALL_NAV_ITEMS = [
  { key: 'dashboard',   to: '/dashboard',   icon: 'dashboard',               tKey: 'nav.dashboard' },
  { key: 'customers',   to: '/customers',   icon: 'groups',                  tKey: 'nav.customers' },
  { key: 'products',    to: '/products',    icon: 'inventory_2',             tKey: 'nav.products' },
  { key: 'orders',      to: '/orders',      icon: 'shopping_cart',           tKey: 'nav.orders' },
  { key: 'work-orders', to: '/work-orders', icon: 'location_on',             tKey: 'nav.siteVisits' },
  { key: 'reports',     to: '/reports',     icon: 'analytics',               tKey: 'nav.tasks' },
  { key: 'production',  to: '/production',  icon: 'precision_manufacturing', tKey: 'nav.production' },
  { key: 'maintenance', to: '/maintenance', icon: 'build',                   tKey: 'nav.maintenance' },
  { key: 'logistics',   to: '/logistics',   icon: 'local_shipping',          tKey: 'nav.logistics' },
  { key: 'purchasing',  to: '/purchasing',  icon: 'shopping_bag',            tKey: 'nav.purchasing' },
]

const adminNavItems = [
  { to: '/finance',   icon: 'account_balance_wallet', tKey: 'nav.finance' },
  { to: '/employees', icon: 'badge',                  tKey: 'nav.employees' },
  { to: '/settings',  icon: 'settings',               tKey: 'nav.settings' },
]

export default function Sidebar() {
  const { t } = useTranslation()
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
        {items.map(({ to, icon, tKey }) => (
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
                  {t(tKey)}
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
            {t('nav.logout')}
          </span>
        </button>
      </div>
    </aside>
  )
}
