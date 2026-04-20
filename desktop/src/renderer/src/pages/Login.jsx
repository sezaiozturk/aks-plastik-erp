import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import aksLogoLight from '../assets/aks_logo.png'
import aksLogoDark from '../assets/aks_logo_dark.png'

export default function Login() {
  const { login, loading } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    try {
      await login()
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-surface-container-lowest border border-theme-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors shadow-sm"
        title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span className="material-symbols-outlined text-xl">{dark ? 'light_mode' : 'dark_mode'}</span>
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={dark ? aksLogoDark : aksLogoLight} alt="AKS" className="w-100 object-contain" />
          <div className="text-sm text-text-muted uppercase tracking-widest font-bold mt-2">
            CRM & ERP System
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-theme-border p-8 space-y-5">
          <h2 className="text-lg font-bold text-on-surface text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Welcome
          </h2>

          {error && (
            <div className="bg-error-container text-on-error-container text-sm px-4 py-2.5 rounded-lg border border-error/20">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-lg primary-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Signing in…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">login</span>
                Sign In
              </>
            )}
          </button>

          <p className="text-xs text-text-muted text-center">
            Your credentials are managed by your administrator.
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">v1.0.0</p>
      </div>
    </div>
  )
}
