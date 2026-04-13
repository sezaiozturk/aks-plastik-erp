const isDev = !window.electron || import.meta.env.DEV

export const API_URL = isDev
  ? 'http://localhost:3001/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')

