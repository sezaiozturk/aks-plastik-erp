import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import aksLogoUrl from '../assets/aks_logo.png'
import robotoFontUrl from '../assets/Roboto-Regular.ttf'

const ITEMS_PER_PAGE = 10
const ORDER_STATUSES = ['Processing', 'Confirmed', 'In-Production', 'Production Completed', 'E-WayBill', 'In Delivery', 'E-Invoice', 'Delivered']
const ORDER_COLUMNS = ['Order Code', 'Customer', 'Sales Rep', 'Status', 'Notes', 'Product Name', 'Quantity', 'Unit Price', 'Currency']

const SHIPMENT_TYPES = [
  '',
  'Air Freight',
  'Sea Freight (FCL)',
  'Sea Freight (LCL)',
  'Road Freight (FTL)',
  'Road Freight (LTL)',
  'Rail Freight',
  'Multimodal',
  'Express Courier (DHL / FedEx / UPS)',
  'Door-to-Door Delivery',
  'Ex-Works (EXW)',
  'FOB (Free On Board)',
  'CIF (Cost, Insurance & Freight)',
  'DAP (Delivered At Place)',
  'DDP (Delivered Duty Paid)',
]

const PAYMENT_METHODS = [
  '',
  'Bank Transfer (Wire)',
  'Letter of Credit (L/C)',
  'Cash in Advance',
  'Open Account (Net 30)',
  'Open Account (Net 60)',
  'Open Account (Net 90)',
  'Documentary Collection (D/P)',
  'Documentary Collection (D/A)',
  'Credit Card',
  'Cheque',
  'Cash on Delivery (COD)',
  'Escrow',
  'PayPal / Online Payment',
]

const emptyItem = { productName: '', quantity: 1, unitPrice: '', currency: 'USD' }

function emptyForm() {
  return { customerId: '', salesRepId: '', status: 'Processing', vat: '0', notes: '', shipmentType: '', paymentMethod: '', items: [{ ...emptyItem }] }
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
const detailStatusStyle = {
  Processing:    'bg-amber-100 text-amber-700',
  Confirmed:     'bg-primary-fixed text-on-primary-fixed-variant',
  'In-Production': 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  'Production Completed': 'bg-green-100 text-green-700',
  'E-WayBill':   'bg-orange-100 text-orange-700',
  'In Delivery': 'bg-blue-100 text-blue-700',
  'E-Invoice':   'bg-teal-100 text-teal-700',
  Delivered:     'bg-green-200 text-green-900',
}

function OrderDetailModal({ order, onClose, currentUser, onStatusChange }) {
  const { statusPermissions } = useData()
  const [localStatus, setLocalStatus] = useState(order.status)
  const [pendingStatus, setPendingStatus] = useState(null)
  const isAdmin = currentUser?.role === 'admin'
  const isSalesManager = currentUser?.department === 'Sales Manager'
  const canChangeTo = (status) => isAdmin || (statusPermissions[currentUser?.department] || []).includes(status)
  const canChangeStatus = (isAdmin || isSalesManager) && (isAdmin || ORDER_STATUSES.some((s) => canChangeTo(s)))

  const subtotal = (order.items || []).reduce(
    (s, it) => s + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 0), 0
  )
  const vatAmount = subtotal * ((order.vat || 0) / 100)
  const currency = order.items?.[0]?.currency || 'USD'

  function confirmStatusChange() {
    setLocalStatus(pendingStatus)
    onStatusChange(order.id, pendingStatus)
    setPendingStatus(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-mono text-text-muted mb-1">{order.code}</p>
            <h2 className="text-xl font-bold text-on-surface">{order.customer?.name || '—'}</h2>
            <p className="text-sm text-text-muted mt-0.5">Sales Rep: {order.salesRep?.name || order.employee?.name || '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${detailStatusStyle[localStatus] || 'bg-surface-container-high text-text-muted'}`}>
              {localStatus}
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

        {/* Shipment & Payment */}
        {(order.shipmentType || order.paymentMethod) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {order.shipmentType && (
              <div className="bg-surface-container-high rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-text-muted">local_shipping</span>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">Shipment</p>
                  <p className="text-sm text-on-surface font-medium">{order.shipmentType}</p>
                </div>
              </div>
            )}
            {order.paymentMethod && (
              <div className="bg-surface-container-high rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-text-muted">payments</span>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">Payment</p>
                  <p className="text-sm text-on-surface font-medium">{order.paymentMethod}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="bg-surface-container-high rounded-xl px-4 py-3 text-sm text-text-muted mb-4">
            <span className="font-semibold text-on-surface mr-2">Notes:</span>{order.notes}
          </div>
        )}

        {/* Status change */}
        {canChangeStatus && (
          <div className="pt-4 border-t border-theme-border space-y-3">
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-text-muted text-base">swap_horiz</span>
                <label className="text-xs font-semibold text-text-muted whitespace-nowrap">Change Status</label>
                <select
                  value={pendingStatus ?? localStatus}
                  onChange={(e) => setPendingStatus(e.target.value === localStatus ? null : e.target.value)}
                  className="flex-1 bg-surface-container-lowest border border-theme-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              !pendingStatus && ORDER_STATUSES.filter((s) => s !== localStatus && canChangeTo(s)).map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Current: {localStatus}</span>
                  <button
                    onClick={() => setPendingStatus(s)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
                  >
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                    Mark as {s}
                  </button>
                </div>
              ))
            )}
            {pendingStatus && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
                <p className="text-xs text-amber-700 flex-1">
                  Change status from <strong>{localStatus}</strong> to <strong>{pendingStatus}</strong>?
                </p>
                <button onClick={() => setPendingStatus(null)} className="text-xs text-text-muted hover:text-on-surface px-2 py-1 rounded transition">
                  Cancel
                </button>
                <button onClick={confirmStatusChange} className="text-xs font-semibold text-white bg-primary hover:opacity-90 px-3 py-1 rounded-lg transition">
                  Confirm
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
const SALES_DEPTS = ['Sales Manager', 'Sales Representative']

function OrderModal({ title, form, setForm, onClose, onSave, errors, saveError, customers, employees, products, currentUser, salesTeam }) {
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const inputCls = (err) =>
    `w-full bg-surface-container-lowest border rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${err ? 'border-error' : 'border-theme-border'}`

  function setItem(idx, field, value) {
    setForm((f) => {
      const items = f.items.map((it, i) => i === idx ? { ...it, [field]: value } : it)
      return { ...f, items }
    })
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { ...emptyItem }] }))
  }

  function removeItem(idx) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  function fillFromProduct(idx, productId) {
    const prod = products.find((p) => p.id === productId)
    if (prod) {
      setForm((f) => {
        const items = f.items.map((it, i) =>
          i === idx ? { ...it, productName: prod.name, unitPrice: prod.price, productId: prod.id, currency: prod.currency || 'USD' } : it
        )
        return { ...f, items }
      })
    }
  }

  const subtotal = form.items.reduce(
    (s, it) => s + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 0), 0
  )
  const vatRate = parseFloat(form.vat) || 0
  const vatAmount = subtotal * (vatRate / 100)
  const total = subtotal + vatAmount
  const displayCurrency = form.items.find((it) => it.currency)?.currency || 'USD'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Customer *</label>
              <select className={inputCls(errors.customerId)} value={form.customerId} onChange={set('customerId')}>
                <option value="">— Select customer —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.customerId && <p className="text-xs text-error mt-1">{errors.customerId}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Sales Rep *</label>
              {currentUser?.department === 'Sales Representative' ? (
                <input
                  readOnly
                  className={`${inputCls()} bg-surface-container-high cursor-not-allowed`}
                  value={currentUser.name}
                />
              ) : (
                <>
                  <select className={inputCls(errors.salesRepId)} value={form.salesRepId || ''} onChange={(e) => setForm((f) => ({ ...f, salesRepId: e.target.value }))}>
                    <option value="">— Select sales rep —</option>
                    {salesTeam.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
                    ))}
                  </select>
                  {errors.salesRepId && <p className="text-xs text-error mt-1">{errors.salesRepId}</p>}
                </>
              )}
            </div>
          </div>
          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-muted">Line Items *</label>
              <button onClick={addItem} className="text-xs text-primary flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">add</span> Add Line
              </button>
            </div>
            {errors.items && <p className="text-xs text-error mb-2">{errors.items}</p>}
            <div className="flex items-center gap-2 mb-1 px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex-1">Product</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted w-16 text-center">Qty</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted w-28 text-center">Unit Price</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted w-24 text-right">Total</span>
              <span className="w-5" />
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => {
                const itemErr = errors.items && item.productName && (!item.unitPrice || parseInt(item.quantity) < 1)
                return (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    className={`flex-1 border rounded px-2 py-1.5 text-xs bg-surface-container-lowest text-on-surface outline-none focus:border-primary ${errors.items && !item.productName ? 'border-error' : 'border-theme-border'}`}
                    value={item.productId || ''}
                    onChange={(e) => fillFromProduct(idx, e.target.value)}
                  >
                    <option value="">— Select product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.stockNo ? `${p.stockNo} — ${p.name}` : p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number" min="1"
                    className={`w-16 border rounded px-2 py-1.5 text-xs bg-surface-container-lowest text-on-surface outline-none focus:border-primary text-center ${itemErr && parseInt(item.quantity) < 1 ? 'border-error' : 'border-theme-border'}`}
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) => setItem(idx, 'quantity', e.target.value)}
                  />
                  <div className={`w-28 flex items-center border rounded overflow-hidden bg-surface-container-lowest ${itemErr && !item.unitPrice ? 'border-error' : 'border-theme-border'}`}>
                    <span className="px-1.5 text-[10px] text-text-muted border-r border-theme-border bg-surface-container-high">{item.currency || 'USD'}</span>
                    <input
                      type="number" min="0" step="0.01"
                      className="flex-1 px-2 py-1.5 text-xs text-on-surface outline-none bg-transparent"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={(e) => setItem(idx, 'unitPrice', e.target.value)}
                    />
                  </div>
                  <span className="text-xs font-semibold text-on-surface w-24 text-right">
                    {item.currency || 'USD'} {((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
                  </span>
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="text-text-muted hover:text-error">
                      <span className="material-symbols-outlined text-base">remove_circle</span>
                    </button>
                  )}
                </div>
              )})}
            </div>
            <div className="mt-3 flex flex-col items-end gap-1 text-sm">
              <span className="text-text-muted">Subtotal: <span className="text-on-surface font-medium">{displayCurrency} {subtotal.toFixed(2)}</span></span>
              <div className="flex items-center gap-2">
                <label className="text-text-muted text-xs">VAT %</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="w-20 border border-theme-border rounded px-2 py-1 text-xs bg-surface-container-lowest text-on-surface outline-none focus:border-primary text-right"
                  value={form.vat}
                  onChange={(e) => set('vat')(e)}
                />
                <span className="text-text-muted text-xs w-28 text-right">+{displayCurrency} {vatAmount.toFixed(2)}</span>
              </div>
              <span className="font-bold text-on-surface border-t border-theme-border pt-1 mt-0.5">
                Total: {displayCurrency} {total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Shipment Type *</label>
              <select className={inputCls(errors.shipmentType)} value={form.shipmentType} onChange={set('shipmentType')}>
                {SHIPMENT_TYPES.map((s) => <option key={s} value={s}>{s || '— Select shipment type —'}</option>)}
              </select>
              {errors.shipmentType && <p className="text-xs text-error mt-1">{errors.shipmentType}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Payment Method *</label>
              <select className={inputCls(errors.paymentMethod)} value={form.paymentMethod} onChange={set('paymentMethod')}>
                {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p || '— Select payment method —'}</option>)}
              </select>
              {errors.paymentMethod && <p className="text-xs text-error mt-1">{errors.paymentMethod}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Notes</label>
            <textarea rows={2} className={inputCls()} value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        {saveError && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-error/10 border border-error/30 text-xs text-error">
            {saveError}
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">
            Cancel
          </button>
          <button onClick={onSave} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

const statusStyle = {
  Processing:      'bg-amber-100 text-amber-700',
  Confirmed:       'bg-primary-fixed text-on-primary-fixed-variant',
  'In-Production': 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  'Production Completed': 'bg-green-100 text-green-700',
  'E-WayBill':     'bg-orange-100 text-orange-700',
  'In Delivery':   'bg-blue-100 text-blue-700',
  'E-Invoice':     'bg-teal-100 text-teal-700',
  Delivered:       'bg-green-200 text-green-900',
}

// Load bundled Roboto font as base64 for jsPDF (cached after first load)
let robotoBase64Cache = null
async function loadRobotoBase64() {
  if (robotoBase64Cache) return robotoBase64Cache
  const res = await fetch(robotoFontUrl)
  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const chunks = []
  for (let i = 0; i < bytes.length; i += 0x8000) {
    chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)))
  }
  robotoBase64Cache = btoa(chunks.join(''))
  return robotoBase64Cache
}

function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Orders() {
  const { orders, addOrder, updateOrder, deleteOrder, refreshOrders, customers, employees, products, isAdmin } = useData()
  const { user: currentUser, token } = useAuth()
  const [salesTeam, setSalesTeam] = useState([])
  const canDelete = isAdmin || currentUser?.department === 'Sales Manager'
  const canCreate = isAdmin || currentUser?.department === 'Sales Manager' || currentUser?.department === 'Sales Representative'

  useEffect(() => {
    if (!token) return
    fetch('http://localhost:3001/api/auth/salesteam', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setSalesTeam(data))
      .catch(() => {})
  }, [token])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [exportOpen, setExportOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const exportRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleExportExcel() {
    setExportOpen(false)
    const toExport = orders.filter((o) => selected.has(o.id))
    const rows = []
    toExport.forEach((o) => {
      const items = o.items?.length ? o.items : [{}]
      items.forEach((it, idx) => {
        rows.push({
          'Order Code': idx === 0 ? o.code : '',
          'Customer': idx === 0 ? (o.customer?.name || '') : '',
          'Sales Rep': idx === 0 ? (o.salesRep?.name || o.employee?.name || '') : '',
          'Status': idx === 0 ? o.status : '',
          'Notes': idx === 0 ? (o.notes || '') : '',
          'Product Name': it.productName || '',
          'Quantity': it.quantity ?? '',
          'Unit Price': it.unitPrice ?? '',
          'Currency': it.currency || 'USD',
        })
      })
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = ORDER_COLUMNS.map((_, i) => ({ wch: i <= 4 ? 20 : 16 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    XLSX.writeFile(wb, 'orders.xlsx')
  }

  async function handleExport() {
    setExportOpen(false)
    const toExport = orders.filter((o) => selected.has(o.id))
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14

    // Register bundled Roboto for Turkish character support
    try {
      const base64 = await loadRobotoBase64()
      doc.addFileToVFS('Roboto-Regular.ttf', base64)
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
      doc.setFont('Roboto', 'normal')
    } catch (_) { /* fall back to helvetica */ }

    const tf = doc.getFont().fontName === 'Roboto' ? 'Roboto' : 'helvetica'

    // Logo
    try {
      const logoBase64 = await loadImageAsBase64(aksLogoUrl)
      doc.addImage(logoBase64, 'PNG', pageW - margin - 36, 10, 36, 12)
    } catch (_) {}

    // Title
    doc.setFont(tf, 'bold')
    doc.setFontSize(18)
    doc.setTextColor(30, 30, 30)
    doc.text('Orders Report', margin, 18)
    doc.setFont(tf, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin, 24)
    doc.text(`Total orders: ${toExport.length}`, margin, 29)

    // Summary table
    autoTable(doc, {
      startY: 36,
      margin: { left: margin, right: margin },
      head: [['Order Code', 'Customer', 'Sales Rep', 'Items', 'Total', 'Status']],
      body: toExport.map((o) => {
        const cur = o.items?.[0]?.currency || 'USD'
        return [
          o.code,
          o.customer?.name || '—',
          o.salesRep?.name || o.employee?.name || '—',
          o.items?.length ?? 0,
          `${cur} ${parseFloat(o.totalAmount).toFixed(2)}`,
          o.status,
        ]
      }),
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9, font: tf },
      bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40], font: tf },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        3: { halign: 'right', cellWidth: 14 },
        4: { halign: 'right', cellWidth: 28 },
        5: { cellWidth: 24 },
      },
      didDrawPage: (data) => {
        doc.setFont(tf, 'normal')
        doc.setFontSize(8)
        doc.setTextColor(160, 160, 160)
        doc.text(`Page ${data.pageNumber}`, pageW / 2, pageH - 8, { align: 'center' })
      },
    })

    // Detail section — one sub-table per order
    let y = doc.lastAutoTable.finalY + 10

    for (const o of toExport) {
      if (!o.items?.length) continue
      if (y > pageH - 50) { doc.addPage(); y = 16 }

      const cur = o.items?.[0]?.currency || 'USD'

      doc.setFont(tf, 'bold')
      doc.setFontSize(9)
      doc.setTextColor(30, 30, 30)
      doc.text(`${o.code}  —  ${o.customer?.name || '—'}`, margin, y)
      doc.setFont(tf, 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(o.status, pageW - margin, y, { align: 'right' })

      autoTable(doc, {
        startY: y + 3,
        margin: { left: margin + 4, right: margin },
        head: [['Stock No', 'Product', 'Qty', 'Unit Price', 'Line Total']],
        body: o.items.map((it) => [
          it.product?.stockNo || '—',
          it.productName,
          it.quantity,
          `${it.currency || cur} ${parseFloat(it.unitPrice).toFixed(2)}`,
          `${it.currency || cur} ${(parseFloat(it.unitPrice) * parseInt(it.quantity)).toFixed(2)}`,
        ]),
        headStyles: { fillColor: [100, 116, 139], textColor: 255, fontSize: 8, fontStyle: 'bold', font: tf },
        bodyStyles: { fontSize: 8, textColor: [60, 60, 60], font: tf },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 22 },
          2: { halign: 'right', cellWidth: 12 },
          3: { halign: 'right', cellWidth: 26 },
          4: { halign: 'right', cellWidth: 26 },
        },
        foot: [
          ...(o.vat > 0 ? [[
            { content: `VAT (${o.vat}%)`, colSpan: 4, styles: { halign: 'right', fontSize: 8, font: tf } },
            { content: `+${cur} ${(parseFloat(o.totalAmount) - parseFloat(o.totalAmount) / (1 + o.vat / 100)).toFixed(2)}`, styles: { halign: 'right', fontSize: 8, font: tf } },
          ]] : []),
          [
            { content: 'Order Total', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, font: tf } },
            { content: `${cur} ${parseFloat(o.totalAmount).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, font: tf } },
          ],
        ],
        footStyles: { fillColor: [241, 245, 249], textColor: [30, 30, 30] },
      })

      y = doc.lastAutoTable.finalY + 6
    }

    doc.save('orders.pdf')
  }

  function validate(f) {
    const e = {}
    if (!f.customerId) e.customerId = 'Customer is required'
    if (!f.salesRepId && currentUser?.department !== 'Sales Representative') e.salesRepId = 'Sales rep is required'
    if (!f.shipmentType) e.shipmentType = 'Shipment type is required'
    if (!f.paymentMethod) e.paymentMethod = 'Payment method is required'
    const validItems = f.items.filter((it) => it.productName.trim())
    if (!validItems.length) {
      e.items = 'At least one product is required'
    } else {
      const missingPrice = validItems.some((it) => it.unitPrice === '' || it.unitPrice === undefined)
      if (missingPrice) e.items = 'All line items must have a unit price'
      const missingQty = validItems.some((it) => !parseInt(it.quantity) || parseInt(it.quantity) < 1)
      if (missingQty) e.items = 'All line items must have a valid quantity'
    }
    return e
  }

  function openAdd() {
    const base = emptyForm()
    if (currentUser?.department === 'Sales Representative') {
      base.salesRepId = currentUser.id
    }
    setForm(base)
    setErrors({})
    setShowAdd(true)
  }

  function openEdit(item) {
    setForm({
      customerId: item.customerId || '',
      salesRepId: item.salesRepId || '',
      status: item.status || 'Draft',
      vat: item.vat ?? '0',
      notes: item.notes || '',
      shipmentType: item.shipmentType || '',
      paymentMethod: item.paymentMethod || '',
      items: item.items?.length
        ? item.items.map((it) => ({
            productName: it.productName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            currency: it.currency || 'USD',
            productId: it.productId || '',
          }))
        : [{ ...emptyItem }],
    })
    setErrors({})
    setEditItem(item)
  }

  async function handleAdd() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    try {
      setSaveError('')
      await addOrder({ ...form, items: form.items.filter((it) => it.productName.trim()) })
      setShowAdd(false)
    } catch (err) {
      setSaveError(err.message)
    }
  }

  async function handleEdit() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    try {
      setSaveError('')
      await updateOrder(editItem.id, { ...form, items: form.items.filter((it) => it.productName.trim()) })
      setEditItem(null)
    } catch (err) {
      setSaveError(err.message)
    }
  }

  async function handleDelete() {
    await deleteOrder(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  async function handleStatusChange(id, newStatus) {
    const order = orders.find((o) => o.id === id)
    if (!order) return
    await updateOrder(id, {
      customerId: order.customerId,
      employeeId: order.employeeId,
      salesRepId: order.salesRepId,
      status: newStatus,
      vat: order.vat,
      notes: order.notes,
      shipmentType: order.shipmentType || '',
      paymentMethod: order.paymentMethod || '',
      items: (order.items || []).map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        currency: it.currency || 'USD',
        productId: it.productId || null,
      })),
    })
  }

  const filtered = orders.filter((o) => {
    if (search) {
      const q = search.toLowerCase()
      const inCode = o.code.toLowerCase().includes(q)
      const inCustomer = (o.customer?.name || '').toLowerCase().includes(q)
      const inRep = (o.salesRep?.name || o.employee?.name || '').toLowerCase().includes(q)
      const inProduct = (o.items || []).some((it) => it.productName.toLowerCase().includes(q))
      if (!inCode && !inCustomer && !inRep && !inProduct) return false
    }
    if (filterStatus && o.status !== filterStatus) return false
    if (filterDateFrom && new Date(o.createdAt) < new Date(filterDateFrom)) return false
    if (filterDateTo && new Date(o.createdAt) > new Date(filterDateTo + 'T23:59:59')) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const allPageSelected = paginated.length > 0 && paginated.every((o) => selected.has(o.id))
  const somePageSelected = paginated.some((o) => selected.has(o.id))

  function toggleRow(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allPageSelected) {
      setSelected((prev) => { const n = new Set(prev); paginated.forEach((o) => n.delete(o.id)); return n })
    } else {
      setSelected((prev) => { const n = new Set(prev); paginated.forEach((o) => n.add(o.id)); return n })
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Orders</h1>
          <p className="text-sm text-text-muted mt-0.5">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshOrders} className="flex items-center gap-1.5 border border-theme-border px-3 py-2 rounded-xl text-sm text-text-muted hover:bg-hover-bg transition">
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 border border-theme-border px-3 py-2 rounded-xl text-sm text-text-muted hover:bg-hover-bg transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export{selected.size > 0 ? ` (${selected.size})` : ''}
              <span className="material-symbols-outlined text-base">arrow_drop_down</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-surface-container-lowest border border-theme-border rounded-xl shadow-lg z-20 overflow-hidden">
                <button onClick={handleExportExcel} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-hover-bg transition text-left">
                  <span className="material-symbols-outlined text-base text-green-600">table_view</span>
                  Export as Excel
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-hover-bg transition text-left">
                  <span className="material-symbols-outlined text-base text-red-500">picture_as_pdf</span>
                  Export as PDF
                </button>
              </div>
            )}
          </div>
          {canCreate && (
            <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
              <span className="material-symbols-outlined text-base">add</span>
              New Order
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-theme-border rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            placeholder="Search order, customer, rep, product…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted whitespace-nowrap">From</span>
          <input
            type="date"
            className="bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted whitespace-nowrap">To</span>
          <input
            type="date"
            className="bg-surface-container-lowest border border-theme-border rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
          />
        </div>
        {(search || filterStatus || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1) }}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-error transition"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Clear
          </button>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected }}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
              </th>
              <th className="text-left px-4 py-4 font-semibold">Order</th>
              <th className="text-left px-4 py-4 font-semibold">Customer</th>
              <th className="text-left px-4 py-4 font-semibold">Sales Rep</th>
              <th className="text-left px-4 py-4 font-semibold">Stock No</th>
              <th className="text-left px-4 py-4 font-semibold">Product Name</th>
              <th className="text-right px-4 py-4 font-semibold">VAT%</th>
              <th className="text-right px-4 py-4 font-semibold">Total</th>
              <th className="text-left px-4 py-4 font-semibold">Status</th>
              <th className="text-left px-4 py-4 font-semibold">Date</th>
              <th className="text-left px-4 py-4 font-semibold">Time</th>
              {canDelete && <th className="text-right px-4 py-4 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 12 : 11} className="text-center py-16 text-text-muted">No orders found</td>
              </tr>
            ) : (
              paginated.map((o) => {
                const stockNos = (o.items || []).map((it) => it.product?.stockNo).filter(Boolean).join(', ')
                const productNames = (o.items || []).map((it) => it.productName).filter(Boolean).join(', ')
                const currency = o.items?.[0]?.currency || 'USD'
                const createdAt = o.createdAt ? new Date(o.createdAt) : null
                const dateStr = createdAt ? createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                const timeStr = createdAt ? createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
                return (
                  <tr
                    key={o.id}
                    className={`border-b border-theme-border hover:bg-hover-bg transition-colors cursor-pointer ${selected.has(o.id) ? 'bg-primary/5' : ''}`}
                    onClick={() => setDetailOrder(o)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleRow(o.id)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-text-muted font-semibold">{o.code || '—'}</td>
                    <td className="px-4 py-4 font-medium text-on-surface">{o.customer?.name || '—'}</td>
                    <td className="px-4 py-4 text-text-muted">{o.salesRep?.name || o.employee?.name || '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-text-muted">{stockNos || '—'}</td>
                    <td className="px-4 py-4 text-sm text-on-surface max-w-[160px] truncate" title={productNames}>{productNames || '—'}</td>
                    <td className="px-4 py-4 text-right text-text-muted text-sm">{o.vat > 0 ? `${o.vat}%` : '—'}</td>
                    <td className="px-4 py-4 text-right font-semibold text-on-surface">
                      <span className="text-xs text-text-muted mr-1">{currency}</span>
                      {(parseFloat(o.totalAmount) || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle[o.status] || statusStyle.Draft}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-text-muted whitespace-nowrap">{dateStr}</td>
                    <td className="px-4 py-4 text-xs text-text-muted whitespace-nowrap">{timeStr}</td>
                    {canDelete && (
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(o)} className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-primary transition">
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button onClick={() => setConfirmDeleteId(o.id)} className="p-1.5 rounded-lg hover:bg-hover-bg text-text-muted hover:text-error transition">
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
          <span>{filtered.length} orders</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Prev</button>
            <span className="px-3 py-1.5">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Next</button>
          </div>
        </div>
      )}

      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} currentUser={currentUser} onStatusChange={handleStatusChange} />}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">delete_forever</span>
              <h2 className="text-lg font-bold text-on-surface">Delete Order?</h2>
            </div>
            <p className="text-sm text-text-muted mb-6">This action cannot be undone. The order and all its line items will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 border border-theme-border rounded-lg py-2 text-sm text-text-muted hover:bg-hover-bg transition">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 bg-error text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <OrderModal title="New Order" form={form} setForm={setForm} errors={errors} saveError={saveError}
          onClose={() => { setShowAdd(false); setSaveError('') }} onSave={handleAdd}
          customers={customers} employees={employees} products={products} currentUser={currentUser} salesTeam={salesTeam} />
      )}
      {editItem && (
        <OrderModal title="Edit Order" form={form} setForm={setForm} errors={errors} saveError={saveError}
          onClose={() => { setEditItem(null); setSaveError('') }} onSave={handleEdit}
          customers={customers} employees={employees} products={products} currentUser={currentUser} salesTeam={salesTeam} />
      )}
    </div>
  )
}
