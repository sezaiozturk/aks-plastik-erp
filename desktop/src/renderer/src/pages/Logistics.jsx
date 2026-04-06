import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

const LOGISTIC_STATUSES = ['Production Completed', 'E-WayBill', 'In Delivery', 'E-Invoice', 'Delivered']

const statusStyle = {
  'Production Completed': 'bg-green-100 text-green-700',
  'E-WayBill':   'bg-orange-100 text-orange-700',
  'In Delivery': 'bg-blue-100 text-blue-700',
  'E-Invoice':   'bg-teal-100 text-teal-700',
  Delivered:     'bg-green-200 text-green-900',
}

const statusNext = {
  'Production Completed': 'E-WayBill',
  'E-WayBill':   'In Delivery',
  'In Delivery': 'E-Invoice',
  'E-Invoice':   'Delivered',
}

const statusIcon = {
  'Production Completed': 'done_all',
  'E-WayBill':   'receipt_long',
  'In Delivery': 'local_shipping',
  'E-Invoice':   'request_quote',
  Delivered:     'inventory',
}

const statusColor = {
  'Production Completed': 'text-green-600',
  'E-WayBill':   'text-orange-500',
  'In Delivery': 'text-blue-500',
  'E-Invoice':   'text-teal-600',
  Delivered:     'text-green-700',
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onAdvance, canAct, canChangeTo }) {
  const [confirming, setConfirming] = useState(false)
  const subtotal = (order.items || []).reduce(
    (s, it) => s + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 0), 0
  )
  const vatAmount = subtotal * ((order.vat || 0) / 100)
  const currency = order.items?.[0]?.currency || 'USD'
  const next = statusNext[order.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-mono text-text-muted mb-1">{order.code}</p>
            <h2 className="text-xl font-bold text-on-surface">{order.customer?.name || '—'}</h2>
            <p className="text-sm text-text-muted mt-0.5">Sales Rep: {order.salesRep?.name || order.employee?.name || '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusStyle[order.status] || 'bg-surface-container-high text-text-muted'}`}>
              {order.status}
            </span>
            <button onClick={onClose} className="text-text-muted hover:text-error">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border border-theme-border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-high text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-semibold">Stock No</th>
                <th className="text-left px-4 py-2.5 font-semibold">Product</th>
                <th className="text-right px-4 py-2.5 font-semibold">Qty</th>
                <th className="text-right px-4 py-2.5 font-semibold">Unit Price</th>
                <th className="text-right px-4 py-2.5 font-semibold">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((it, i) => (
                <tr key={i} className="border-t border-theme-border">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{it.product?.stockNo || '—'}</td>
                  <td className="px-4 py-3 text-on-surface font-medium">{it.productName}</td>
                  <td className="px-4 py-3 text-right text-text-muted">{it.quantity}</td>
                  <td className="px-4 py-3 text-right text-on-surface">
                    <span className="text-xs text-text-muted mr-1">{it.currency || 'USD'}</span>
                    {parseFloat(it.unitPrice).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-on-surface">
                    <span className="text-xs text-text-muted mr-1">{it.currency || 'USD'}</span>
                    {(parseFloat(it.unitPrice) * parseInt(it.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-1 text-sm mb-4">
          <span className="text-text-muted">Subtotal: <span className="text-on-surface font-medium">{currency} {subtotal.toFixed(2)}</span></span>
          {order.vat > 0 && (
            <span className="text-text-muted">VAT ({order.vat}%): <span className="text-on-surface font-medium">+{currency} {vatAmount.toFixed(2)}</span></span>
          )}
          <span className="font-bold text-on-surface text-base border-t border-theme-border pt-1 mt-0.5">
            Total: {currency} {parseFloat(order.totalAmount).toFixed(2)}
          </span>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-surface-container-high rounded-xl px-4 py-3 text-sm text-text-muted mb-4">
            <span className="font-semibold text-on-surface mr-2">Notes:</span>{order.notes}
          </div>
        )}

        {/* Advance status — logistic staff only */}
        {canAct && next && canChangeTo(next) && !confirming && (
          <div className="flex justify-end">
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
            >
              <span className="material-symbols-outlined text-base">arrow_forward</span>
              Mark as {next}
            </button>
          </div>
        )}
        {canAct && next && canChangeTo(next) && confirming && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
            <p className="text-xs text-amber-700 flex-1">
              Change status to <strong>{next}</strong>?
            </p>
            <button onClick={() => setConfirming(false)} className="text-xs text-text-muted hover:text-on-surface px-2 py-1 rounded transition">
              Cancel
            </button>
            <button onClick={() => onAdvance(order.id, next)} className="text-xs font-semibold text-white bg-primary hover:opacity-90 px-3 py-1 rounded-lg transition">
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Logistics() {
  const { orders, updateOrder, refreshOrders, statusPermissions } = useData()
  const { isAdmin, user: currentUser } = useAuth()
  const canAct = isAdmin || currentUser?.department === 'Logistic Department'
  const canChangeTo = (status) => isAdmin || (statusPermissions[currentUser?.department] || []).includes(status)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [detailOrder, setDetailOrder] = useState(null)

  useEffect(() => { refreshOrders() }, [])

  // Logistics sees orders from Completed onwards
  const logisticOrders = orders.filter((o) => LOGISTIC_STATUSES.includes(o.status))

  const filtered = logisticOrders.filter((o) => {
    if (filterStatus && o.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const inCode = o.code.toLowerCase().includes(q)
      const inCustomer = (o.customer?.name || '').toLowerCase().includes(q)
      const inProduct = (o.items || []).some((it) => it.productName.toLowerCase().includes(q))
      if (!inCode && !inCustomer && !inProduct) return false
    }
    return true
  })

  const counts = LOGISTIC_STATUSES.reduce((acc, s) => {
    acc[s] = logisticOrders.filter((o) => o.status === s).length
    return acc
  }, {})

  async function handleAdvance(id, nextStatus) {
    const order = orders.find((o) => o.id === id)
    if (!order) return
    await updateOrder(id, {
      customerId: order.customerId,
      employeeId: order.employeeId,
      salesRepId: order.salesRepId,
      status: nextStatus,
      vat: order.vat,
      notes: order.notes,
      items: (order.items || []).map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        currency: it.currency || 'USD',
        productId: it.productId || null,
      })),
    })
    setDetailOrder((prev) => prev?.id === id ? { ...prev, status: nextStatus } : prev)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Logistics</h1>
          <p className="text-sm text-text-muted mt-0.5">{logisticOrders.length} orders in logistics</p>
        </div>
        <button
          onClick={refreshOrders}
          className="flex items-center gap-1.5 border border-theme-border px-3 py-2 rounded-xl text-sm text-text-muted hover:bg-hover-bg transition"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {LOGISTIC_STATUSES.map((s) => (
          <div
            key={s}
            className="rounded-2xl border border-theme-border bg-surface-container-lowest p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`material-symbols-outlined text-2xl ${statusColor[s]}`}>{statusIcon[s]}</span>
              <span className="text-2xl font-bold text-on-surface">{counts[s] || 0}</span>
            </div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{s}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-theme-border rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            placeholder="Search order, customer, product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {LOGISTIC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterStatus) && (
          <button
            onClick={() => { setSearch(''); setFilterStatus('') }}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-error transition"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-4 font-semibold">Order</th>
              <th className="text-left px-4 py-4 font-semibold">Customer</th>
              <th className="text-left px-4 py-4 font-semibold">Products</th>
              <th className="text-right px-4 py-4 font-semibold">Qty</th>
              <th className="text-right px-4 py-4 font-semibold">Total</th>
              <th className="text-left px-4 py-4 font-semibold">Status</th>
              <th className="text-left px-4 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-text-muted">No orders found</td>
              </tr>
            ) : (
              filtered.map((o) => {
                const currency = o.items?.[0]?.currency || 'USD'
                const productSummary = (o.items || []).map((it) => `${it.quantity}× ${it.productName}`).join(', ')
                const totalQty = (o.items || []).reduce((s, it) => s + (parseInt(it.quantity) || 0), 0)
                const createdAt = o.createdAt ? new Date(o.createdAt) : null
                const dateStr = createdAt ? createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                const next = statusNext[o.status]
                return (
                  <tr
                    key={o.id}
                    className="border-b border-theme-border hover:bg-hover-bg transition-colors cursor-pointer"
                    onClick={() => setDetailOrder(o)}
                  >
                    <td className="px-4 py-4 font-mono text-xs text-text-muted font-semibold">{o.code}</td>
                    <td className="px-4 py-4 font-medium text-on-surface">{o.customer?.name || '—'}</td>
                    <td className="px-4 py-4 text-sm text-on-surface max-w-[220px] truncate" title={productSummary}>{productSummary || '—'}</td>
                    <td className="px-4 py-4 text-right text-text-muted">{totalQty}</td>
                    <td className="px-4 py-4 text-right font-semibold text-on-surface">
                      <span className="text-xs text-text-muted mr-1">{currency}</span>
                      {parseFloat(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle[o.status] || 'bg-surface-container-high text-text-muted'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-text-muted whitespace-nowrap">{dateStr}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onAdvance={async (id, next) => { await handleAdvance(id, next); setDetailOrder(null) }}
          canAct={canAct}
          canChangeTo={canChangeTo}
        />
      )}
    </div>
  )
}
