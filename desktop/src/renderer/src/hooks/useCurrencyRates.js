import { useState, useEffect, useCallback } from 'react'

const CACHE_KEY  = 'aks_currency_rates_cache'
const CONFIG_KEY = 'aks_currency_api_config'
const CACHE_TTL  = 60 * 60 * 1000 // 1 hour

export const DEFAULT_RATES_URL  = 'https://open.er-api.com/v6/latest/USD'
export const DEFAULT_RATES_PATH = 'rates'
export const DEFAULT_BASE       = 'USD'

function getAtPath(obj, path) {
  if (!path) return obj
  return path.split('.').reduce((o, k) => o?.[k], obj)
}

export function loadRatesConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') } catch { return {} }
}

export function saveRatesConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
  // Bust the cache so next fetch uses new config
  localStorage.removeItem(CACHE_KEY)
}

export function useCurrencyRates() {
  const [rates, setRates]           = useState(null)   // { USD: 1, EUR: 0.92, ... }
  const [base, setBase]             = useState(DEFAULT_BASE)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const applyCache = useCallback(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setRates(cached.rates)
        setBase(cached.base || DEFAULT_BASE)
        setLastUpdated(new Date(cached.timestamp))
        return true
      }
    } catch {}
    return false
  }, [])

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const cfg        = loadRatesConfig()
      const url        = cfg.url        || DEFAULT_RATES_URL
      const ratesPath  = cfg.ratesPath  || DEFAULT_RATES_PATH
      const baseCur    = cfg.base       || DEFAULT_BASE
      const headers    = cfg.apiKey ? { [cfg.apiKeyHeader || 'Authorization']: cfg.apiKey } : {}

      const res  = await fetch(url, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const json = await res.json()

      const ratesObj = getAtPath(json, ratesPath)
      if (!ratesObj || typeof ratesObj !== 'object') {
        throw new Error(`No rates found at path "${ratesPath}". Check your JSON path setting.`)
      }

      const cache = { rates: ratesObj, base: baseCur, timestamp: Date.now() }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      setRates(ratesObj)
      setBase(baseCur)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!applyCache()) fetchRates()
  }, [applyCache, fetchRates])

  /** Rate of `currency` relative to base (e.g. base=USD, currency=EUR → 0.92) */
  function getRate(currency) {
    if (!rates) return null
    if (currency === base) return 1
    return rates[currency] ?? null
  }

  /** Convert amount from one currency to another */
  function convert(amount, from, to) {
    if (!rates || from === to) return amount
    const fromRate = from === base ? 1 : (rates[from] ?? 1)
    const toRate   = to   === base ? 1 : (rates[to]   ?? 1)
    return (amount / fromRate) * toRate
  }

  return { rates, base, loading, error, lastUpdated, fetchRates, getRate, convert }
}
