import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import aksLogoLight from '../assets/aks_logo.png'
import aksLogoDark from '../assets/aks_logo_dark.png'

import { API_URL as API } from '../config'

export default function Login() {
  const { login } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password flow: 'login' | 'forgot' | 'code' | 'done'
  const [view, setView] = useState('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setView('code')
      setSuccessMsg('A reset code has been sent to your email.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match')
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setView('done')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function backToLogin() {
    setView('login')
    setError('')
    setSuccessMsg('')
    setResetEmail('')
    setResetCode('')
    setNewPassword('')
    setConfirmPassword('')
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

        {/* ── Sign In ── */}
        {view === 'login' && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-theme-border p-8 space-y-5">
            <h2 className="text-lg font-bold text-on-surface text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Sign In
            </h2>

            {error && (
              <div className="bg-error-container text-on-error-container text-sm px-4 py-2.5 rounded-lg border border-error/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-input-border bg-input-bg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="E-Mail"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-input-border bg-input-bg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg primary-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setError(''); setView('forgot') }}
              className="w-full text-center text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Forgot Password?
            </button>
          </form>
        )}

        {/* ── Forgot Password: enter email ── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-theme-border p-8 space-y-5">
            <h2 className="text-lg font-bold text-on-surface text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Reset Password
            </h2>
            <p className="text-xs text-text-muted text-center">
              Enter your email address and we'll send you a reset code.
            </p>

            {error && (
              <div className="bg-error-container text-on-error-container text-sm px-4 py-2.5 rounded-lg border border-error/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-input-border bg-input-bg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="E-Mail"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg primary-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <button type="button" onClick={backToLogin} className="w-full text-center text-xs text-primary hover:text-primary/80 transition-colors">
              Back to Sign In
            </button>
          </form>
        )}

        {/* ── Enter reset code + new password ── */}
        {view === 'code' && (
          <form onSubmit={handleResetSubmit} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-theme-border p-8 space-y-5">
            <h2 className="text-lg font-bold text-on-surface text-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Enter Reset Code
            </h2>

            {successMsg && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm px-4 py-2.5 rounded-lg border border-green-200 dark:border-green-800">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="bg-error-container text-on-error-container text-sm px-4 py-2.5 rounded-lg border border-error/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Reset Code</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input-border bg-input-bg text-on-surface text-sm text-center tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input-border bg-input-bg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input-border bg-input-bg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg primary-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button type="button" onClick={backToLogin} className="w-full text-center text-xs text-primary hover:text-primary/80 transition-colors">
              Back to Sign In
            </button>
          </form>
        )}

        {/* ── Success ── */}
        {view === 'done' && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-theme-border p-8 space-y-5 text-center">
            <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
            <h2 className="text-lg font-bold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Password Reset
            </h2>
            <p className="text-sm text-text-muted">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={backToLogin}
              className="w-full py-2.5 rounded-lg primary-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </div>
        )}

        <p className="text-center text-xs text-text-muted mt-6">v1.0.0</p>
      </div>
    </div>
  )
}
