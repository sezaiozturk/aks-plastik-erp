import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useData } from '../context/DataContext'

const ITEMS_PER_PAGE = 10

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'AED', 'SAR', 'JPY', 'CNY', 'INR', 'CAD', 'AUD']

const emptyForm = {
  stockNo: '',
  name: '',
  description: '',
  category: '',
  unit: 'pcs',
  currency: 'USD',
  price: '',
  stock: '',
  minStock: '',
}

function Modal({ title, form, setForm, onClose, onSave, errors }) {
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const inputCls = (field) =>
    `w-full bg-surface-container-lowest border rounded px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition ${
      errors[field] ? 'border-error' : 'border-theme-border'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-error">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Stock No *</label>
              <input className={inputCls('stockNo')} value={form.stockNo} onChange={set('stockNo')} placeholder="e.g. SKU-0012" />
              {errors.stockNo && <p className="text-xs text-error mt-1">{errors.stockNo}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Name *</label>
              <input className={inputCls('name')} value={form.name} onChange={set('name')} />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Category</label>
              <input className={inputCls('category')} value={form.category} onChange={set('category')} placeholder="e.g. Electronics" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Unit</label>
              <input className={inputCls('unit')} value={form.unit} onChange={set('unit')} placeholder="pcs / kg / m" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Currency</label>
              <select className={inputCls('currency')} value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Price *</label>
              <input type="number" min="0" step="0.01" className={inputCls('price')} value={form.price} onChange={set('price')} />
              {errors.price && <p className="text-xs text-error mt-1">{errors.price}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Stock</label>
              <input type="number" min="0" className={inputCls('stock')} value={form.stock} onChange={set('stock')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Min Stock</label>
              <input type="number" min="0" className={inputCls('minStock')} value={form.minStock} onChange={set('minStock')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Description</label>
            <textarea rows={2} className={inputCls('description')} value={form.description} onChange={set('description')} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
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

function DeleteConfirmModal({ product, onClose, onConfirm }) {
  const [typed, setTyped] = useState('')
  const match = typed === product.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-5 bg-error/10 border-b border-error/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-error/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-error text-2xl">delete_forever</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-on-surface">Delete Product</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">This action cannot be undone.</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-on-surface-variant">
            Type <span className="font-bold text-on-surface">{product.name}</span> to confirm deletion.
          </p>
          <input
            autoFocus
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={product.name}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input-border bg-input-bg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error"
          />
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!match}
              className="flex-1 px-4 py-2.5 rounded-lg bg-error text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductDetailModal({ product, onClose, onEdit, onDelete, isAdmin }) {
  const stockBadge = (p) => {
    if (p.stock === 0) return { label: 'Out of Stock', cls: 'bg-error/10 text-error' }
    if (p.stock <= p.minStock) return { label: 'Low Stock', cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' }
    return { label: 'In Stock', cls: 'bg-primary-fixed text-on-primary-fixed-variant' }
  }
  const badge = stockBadge(product)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="primary-gradient px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-surface-container-lowest/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white">inventory_2</span>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white leading-tight">{product.name}</h2>
                {product.stockNo && (
                  <p className="text-blue-200 text-xs font-mono mt-0.5">{product.stockNo}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-surface-container-lowest/10 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Category</p>
              <p className="text-sm font-semibold text-on-surface">{product.category || '—'}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Unit</p>
              <p className="text-sm font-semibold text-on-surface">{product.unit || 'pcs'}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Price</p>
              <p className="text-sm font-semibold text-on-surface">
                <span className="text-xs text-on-surface-variant mr-1">{product.currency || 'USD'}</span>
                {parseFloat(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Status</p>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Stock</p>
              <p className="text-sm font-semibold text-on-surface">
                {product.stock} <span className="text-xs text-on-surface-variant">{product.unit || 'pcs'}</span>
              </p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Min Stock</p>
              <p className="text-sm font-semibold text-on-surface">
                {product.minStock} <span className="text-xs text-on-surface-variant">{product.unit || 'pcs'}</span>
              </p>
            </div>
          </div>

          {product.description && (
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Description</p>
              <p className="text-sm text-on-surface">{product.description}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {isAdmin && (
            <>
              <button
                onClick={onDelete}
                className="px-4 py-2.5 rounded-xl border-2 border-error/40 text-error text-sm font-bold hover:bg-error hover:text-white transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Delete
              </button>
              <button
                onClick={onEdit}
                className="flex-1 py-2.5 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Edit
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className={`${isAdmin ? '' : 'flex-1'} py-2.5 px-5 rounded-xl primary-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const PRODUCT_COLUMNS = ['Stock No', 'Name', 'Category', 'Unit', 'Currency', 'Price', 'Stock', 'Min Stock', 'Description']

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, isAdmin } = useData()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [viewProduct, setViewProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [importing, setImporting] = useState(false)
  const importRef = useRef(null)

  function validate(f) {
    const e = {}
    if (!f.stockNo.trim()) e.stockNo = 'Required'
    if (!f.name.trim()) e.name = 'Required'
    if (!f.price.toString().trim() || isNaN(parseFloat(f.price))) e.price = 'Valid price required'
    return e
  }

  function openAdd() {
    setForm(emptyForm)
    setErrors({})
    setShowAdd(true)
  }

  function openEdit(item) {
    setForm({
      stockNo: item.stockNo || '',
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      unit: item.unit || 'pcs',
      currency: item.currency || 'USD',
      price: item.price,
      stock: item.stock,
      minStock: item.minStock,
    })
    setErrors({})
    setEditItem(item)
  }

  async function handleAdd() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    await addProduct(form)
    setShowAdd(false)
  }

  async function handleEdit() {
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    await updateProduct(editItem.id, form)
    setEditItem(null)
  }

  async function handleDelete() {
    await deleteProduct(deleteTarget.id)
    setDeleteTarget(null)
  }

  function handleExport() {
    const rows = products.map((p) => ({
      'Stock No': p.stockNo || '',
      'Name': p.name,
      'Category': p.category || '',
      'Unit': p.unit || '',
      'Currency': p.currency || 'USD',
      'Price': p.price,
      'Stock': p.stock,
      'Min Stock': p.minStock,
      'Description': p.description || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = PRODUCT_COLUMNS.map((_, i) => ({ wch: i === 1 ? 30 : 14 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    XLSX.writeFile(wb, 'products.xlsx')
  }

  function handleTemplate() {
    const ws = XLSX.utils.json_to_sheet([{}], { header: PRODUCT_COLUMNS })
    ws['!cols'] = PRODUCT_COLUMNS.map((_, i) => ({ wch: i === 1 ? 30 : 14 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    XLSX.writeFile(wb, 'products_template.xlsx')
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
      for (const row of rows) {
        const name = String(row['Name'] || '').trim()
        if (!name) continue
        await addProduct({
          stockNo: String(row['Stock No'] || ''),
          name,
          category: String(row['Category'] || ''),
          unit: String(row['Unit'] || 'pcs'),
          currency: String(row['Currency'] || 'USD'),
          price: parseFloat(row['Price']) || 0,
          stock: parseInt(row['Stock']) || 0,
          minStock: parseInt(row['Min Stock']) || 0,
          description: String(row['Description'] || ''),
        })
      }
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.stockNo || '').toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const stockBadge = (product) => {
    if (product.stock === 0) return { label: 'Out of Stock', cls: 'bg-error/10 text-error' }
    if (product.stock <= product.minStock) return { label: 'Low Stock', cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' }
    return { label: 'In Stock', cls: 'bg-primary-fixed text-on-primary-fixed-variant' }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Products</h1>
          <p className="text-sm text-text-muted mt-0.5">{products.length} total products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTemplate} className="flex items-center gap-1.5 border border-theme-border px-3 py-2 rounded-xl text-sm text-text-muted hover:bg-hover-bg transition">
            <span className="material-symbols-outlined text-base">download</span>
            Template
          </button>
          <button onClick={() => importRef.current.click()} disabled={importing} className="flex items-center gap-1.5 border border-theme-border px-3 py-2 rounded-xl text-sm text-text-muted hover:bg-hover-bg transition disabled:opacity-40">
            <span className="material-symbols-outlined text-base">upload</span>
            {importing ? 'Importing…' : 'Import'}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 border border-theme-border px-3 py-2 rounded-xl text-sm text-text-muted hover:bg-hover-bg transition">
            <span className="material-symbols-outlined text-base">table_view</span>
            Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 primary-gradient text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-primary/10 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-base">add</span>
            Add Product
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-theme-border rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-theme-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-4 font-semibold">Stock No</th>
              <th className="text-left px-6 py-4 font-semibold">Name</th>
              <th className="text-left px-6 py-4 font-semibold">Category</th>
              <th className="text-right px-6 py-4 font-semibold">Price</th>
              <th className="text-right px-6 py-4 font-semibold">Stock</th>
              <th className="text-left px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-text-muted">
                  No products found
                </td>
              </tr>
            ) : (
              paginated.map((p) => {
                const badge = stockBadge(p)
                return (
                  <tr key={p.id} onClick={() => setViewProduct(p)} className="border-b border-theme-border hover:bg-hover-bg transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-on-surface">{p.stockNo || '—'}</td>
                    <td className="px-6 py-4 font-semibold text-on-surface">{p.name}</td>
                    <td className="px-6 py-4 text-text-muted">{p.category || '—'}</td>
                    <td className="px-6 py-4 text-right font-medium text-on-surface">
                      <span className="text-xs text-text-muted mr-1">{p.currency || 'USD'}</span>
                      {parseFloat(p.price).toFixed(2)}
                      <span className="text-xs text-text-muted"> /{p.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-on-surface">{p.stock}<span className="text-xs text-text-muted ml-1">{p.unit || 'pcs'}</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
          <span>{filtered.length} products</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Prev</button>
            <span className="px-3 py-1.5">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-theme-border disabled:opacity-40 hover:bg-hover-bg transition">Next</button>
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Product" form={form} setForm={setForm} errors={errors} onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {editItem && (
        <Modal title="Edit Product" form={form} setForm={setForm} errors={errors} onClose={() => setEditItem(null)} onSave={handleEdit} />
      )}
      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          isAdmin={isAdmin}
          onClose={() => setViewProduct(null)}
          onEdit={() => { setViewProduct(null); openEdit(viewProduct) }}
          onDelete={() => { setDeleteTarget(viewProduct); setViewProduct(null) }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
