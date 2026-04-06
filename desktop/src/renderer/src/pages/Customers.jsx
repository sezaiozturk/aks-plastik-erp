import { useState } from 'react'
import { useData } from '../context/DataContext'
import InitialsAvatar from '../components/InitialsAvatar'

const badgeStyles = {
  active: 'bg-primary-fixed text-on-primary-fixed-variant',
  review: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  clear: 'bg-primary-fixed text-on-primary-fixed-variant',
  pending: 'bg-primary-fixed text-on-primary-fixed-variant',
}

const ITEMS_PER_PAGE = 5

const emptyForm = {
  companyName: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  phone: '',
  email: '',
  latitude: '',
  longitude: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
}

function AddCustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.companyName.trim()) e.companyName = 'Required'
    if (!form.address.trim()) e.address = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.postalCode.trim()) e.postalCode = 'Required'
    if (!form.country.trim())   e.country    = 'Required'
    if (!form.phone.trim()) e.phone = 'Required'
    else if (!/^[+\d\s\-().]{7,}$/.test(form.phone)) e.phone = 'Invalid phone number'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address'
    if (!form.contactName.trim()) e.contactName = 'Required'
    if (!form.contactPhone.trim()) e.contactPhone = 'Required'
    else if (!/^[+\d\s\-().]{7,}$/.test(form.contactPhone)) e.contactPhone = 'Invalid phone number'
    if (!form.contactEmail.trim()) e.contactEmail = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Invalid email address'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave(form)
  }

  const fields = [
    { id: 'companyName',  label: 'Company Name',        icon: 'business',           type: 'text',  placeholder: 'e.g. Acme Corporation', col: 2 },
    { id: 'address',      label: 'Address',             icon: 'location_on',        type: 'text',  placeholder: 'Street address',         col: 2 },
    { id: 'city',         label: 'City',                icon: 'apartment',          type: 'text',  placeholder: 'City',                   col: 1 },
    { id: 'postalCode',   label: 'Postal Code',         icon: 'markunread_mailbox', type: 'text',  placeholder: 'ZIP / Postal code',      col: 1 },
    { id: 'country',      label: 'Country',             icon: 'public',             type: 'text',  placeholder: 'Country',                col: 2 },
    { id: 'phone',        label: 'Company Phone',       icon: 'phone',              type: 'tel',   placeholder: '+1 (555) 000-0000',      col: 1 },
    { id: 'email',        label: 'Company Email',       icon: 'mail',               type: 'email', placeholder: 'info@company.com',       col: 1 },
    { id: 'latitude',     label: 'Latitude',            icon: 'my_location',        type: 'text',  placeholder: 'e.g. 41.0082',           col: 1 },
    { id: 'longitude',    label: 'Longitude',           icon: 'explore',            type: 'text',  placeholder: 'e.g. 28.9784',           col: 1 },
    { id: 'divider',      label: '',                    icon: '',                   type: '',      placeholder: '',                       col: 'divider' },
    { id: 'contactName',  label: 'Contact Person',      icon: 'person',             type: 'text',  placeholder: 'Full name',              col: 2 },
    { id: 'contactPhone', label: 'Contact Phone',       icon: 'phone_in_talk',      type: 'tel',   placeholder: '+1 (555) 000-0000',      col: 1 },
    { id: 'contactEmail', label: 'Contact Email',       icon: 'forward_to_inbox',   type: 'email', placeholder: 'person@company.com',     col: 1 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl shadow-inverse-surface/20 w-full max-w-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined fill-icon">person_add</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-on-surface">New Customer</h2>
              <p className="text-xs text-on-surface-variant">Add a new partner to the directory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="px-8 py-6 grid grid-cols-2 gap-5 max-h-[60vh] overflow-y-auto">
          {fields.map(({ id, label, icon, type, placeholder, col }) => {
            if (col === 'divider') return (
              <div key={id} className="col-span-2 flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-surface-container-high" />
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">contact_phone</span>
                  Contact Person
                </span>
                <div className="flex-1 h-px bg-surface-container-high" />
              </div>
            )
            return (
              <div key={id} className={col === 2 ? 'col-span-2' : 'col-span-1'}>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                  {label}
                </label>
                <div
                  className={`flex items-center gap-2 bg-surface-container-high rounded-lg px-3 py-2.5 transition-all ${
                    errors[id]
                      ? 'ring-2 ring-error'
                      : 'focus-within:ring-2 focus-within:ring-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] flex-shrink-0">
                    {icon}
                  </span>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[id]}
                    onChange={set(id)}
                    className="bg-transparent border-none outline-none text-sm text-on-surface w-full placeholder-slate-400"
                  />
                </div>
                {errors[id] && (
                  <p className="text-[10px] text-error font-medium mt-1">{errors[id]}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl primary-gradient text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">save</span>
            Save Customer
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-container-low last:border-0">
      <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
        <p className="text-sm font-semibold text-on-surface mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

function CustomerDetailModal({ customer, reports, onClose, onSave, onDelete }) {
  const { isAdmin } = useData()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState({
    companyName:  customer.name,
    address:      customer.address      || '',
    city:         customer.city         || '',
    postalCode:   customer.postalCode   || '',
    country:      customer.country      || '',
    phone:        customer.phone        || '',
    email:        customer.email        || '',
    latitude:     customer.latitude != null ? String(customer.latitude) : '',
    longitude:    customer.longitude != null ? String(customer.longitude) : '',
    contactName:  customer.contactName  || '',
    contactPhone: customer.contactPhone || '',
    contactEmail: customer.contactEmail || '',
  })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.companyName.trim()) e.companyName = 'Required'
    if (!form.address.trim())     e.address     = 'Required'
    if (!form.city.trim())        e.city        = 'Required'
    if (!form.postalCode.trim())   e.postalCode   = 'Required'
    if (!form.country.trim())      e.country      = 'Required'
    if (!form.phone.trim())        e.phone        = 'Required'
    else if (!/^[+\d\s\-().]{7,}$/.test(form.phone)) e.phone = 'Invalid phone number'
    if (!form.email.trim())        e.email        = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address'
    if (form.latitude && isNaN(parseFloat(form.latitude))) e.latitude = 'Must be a number'
    if (form.longitude && isNaN(parseFloat(form.longitude))) e.longitude = 'Must be a number'
    if (!form.contactName.trim())  e.contactName  = 'Required'
    if (!form.contactPhone.trim()) e.contactPhone = 'Required'
    else if (!/^[+\d\s\-().]{7,}$/.test(form.contactPhone)) e.contactPhone = 'Invalid phone number'
    if (!form.contactEmail.trim()) e.contactEmail = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Invalid email address'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave(customer.id, form)
    setEditing(false)
    setErrors({})
  }

  function handleCancel() {
    setForm({
      companyName:  customer.name,
      address:      customer.address      || '',
      city:         customer.city         || '',
      postalCode:   customer.postalCode   || '',
      country:      customer.country      || '',
      phone:        customer.phone        || '',
      email:        customer.email        || '',
      latitude:     customer.latitude != null ? String(customer.latitude) : '',
      longitude:    customer.longitude != null ? String(customer.longitude) : '',
      contactName:  customer.contactName  || '',
      contactPhone: customer.contactPhone || '',
      contactEmail: customer.contactEmail || '',
    })
    setErrors({})
    setEditing(false)
  }

  const editFields = [
    { id: 'companyName',  label: 'Company Name',   icon: 'business',           type: 'text',  col: 2 },
    { id: 'address',      label: 'Address',         icon: 'location_on',        type: 'text',  col: 2 },
    { id: 'city',         label: 'City',            icon: 'apartment',          type: 'text',  col: 1 },
    { id: 'postalCode',   label: 'Postal Code',     icon: 'markunread_mailbox', type: 'text',  col: 1 },
    { id: 'country',      label: 'Country',         icon: 'public',             type: 'text',  col: 2 },
    { id: 'phone',        label: 'Company Phone',   icon: 'phone',              type: 'tel',   col: 1 },
    { id: 'email',        label: 'Company Email',   icon: 'mail',               type: 'email', col: 1 },
    { id: 'latitude',     label: 'Latitude',         icon: 'my_location',        type: 'text',  col: 1 },
    { id: 'longitude',    label: 'Longitude',        icon: 'explore',            type: 'text',  col: 1 },
    { id: 'divider',      label: '',                icon: '',                   type: '',      col: 'divider' },
    { id: 'contactName',  label: 'Contact Person',  icon: 'person',             type: 'text',  col: 2 },
    { id: 'contactPhone', label: 'Contact Phone',   icon: 'phone_in_talk',      type: 'tel',   col: 1 },
    { id: 'contactEmail', label: 'Contact Email',   icon: 'forward_to_inbox',   type: 'email', col: 1 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl shadow-inverse-surface/20 w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header banner */}
        <div className="primary-gradient px-8 pt-8 pb-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-surface-container-lowest/20 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                {customer.initials}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white leading-tight">
                  {editing ? 'Edit Customer' : customer.name}
                </h2>
                <p className="text-blue-200 text-xs font-medium mt-0.5">ID: #{customer.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-surface-container-lowest/10 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {!editing && (
            <div className="flex items-center gap-3 mt-5">
              <div className="bg-surface-container-lowest/10 rounded-lg px-3 py-1.5 text-center">
                <p className="text-white font-black text-lg leading-none">
                  {(reports || []).filter((r) => r.customerId === customer.id).length}
                </p>
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mt-0.5">Total Tasks</p>
              </div>
              {customer.flagged && (
                <span className="ml-auto bg-tertiary-fixed text-tertiary text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Review Required
                </span>
              )}
            </div>
          )}
        </div>

        {/* View mode */}
        {!editing && (
          <div className="px-8 py-4 overflow-y-auto flex-1">
            <DetailRow icon="location_on"        label="Address"        value={customer.address} />
            <DetailRow icon="apartment"          label="City"           value={customer.city || customer.region} />
            <DetailRow icon="markunread_mailbox" label="Postal Code"    value={customer.postalCode} />
            <DetailRow icon="public"             label="Country"        value={customer.country} />
            <DetailRow icon="phone"              label="Company Phone"  value={customer.phone} />
            <DetailRow icon="mail"               label="Company Email"  value={customer.email} />
            {/* Contact person section */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-surface-container-high" />
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">contact_phone</span>
                Contact Person
              </span>
              <div className="flex-1 h-px bg-surface-container-high" />
            </div>
            <DetailRow icon="person"           label="Name"  value={customer.contactName} />
            <DetailRow icon="phone_in_talk"    label="Phone" value={customer.contactPhone} />
            <DetailRow icon="forward_to_inbox" label="Email" value={customer.contactEmail} />
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <div className="px-8 py-6 grid grid-cols-2 gap-5 overflow-y-auto flex-1">
            {editFields.map(({ id, label, icon, type, col }) => {
              if (col === 'divider') return (
                <div key={id} className="col-span-2 flex items-center gap-3 pt-2">
                  <div className="flex-1 h-px bg-surface-container-high" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">contact_phone</span>
                    Contact Person
                  </span>
                  <div className="flex-1 h-px bg-surface-container-high" />
                </div>
              )
              return (
                <div key={id} className={col === 2 ? 'col-span-2' : 'col-span-1'}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                    {label}
                  </label>
                  <div
                    className={`flex items-center gap-2 bg-surface-container-high rounded-lg px-3 py-2.5 transition-all ${
                      errors[id]
                        ? 'ring-2 ring-error'
                        : 'focus-within:ring-2 focus-within:ring-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px] flex-shrink-0">
                      {icon}
                    </span>
                    <input
                      type={type}
                      value={form[id]}
                      onChange={set(id)}
                      className="bg-transparent border-none outline-none text-sm text-on-surface w-full placeholder-slate-400"
                    />
                  </div>
                  {errors[id] && (
                    <p className="text-[10px] text-error font-medium mt-1">{errors[id]}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Confirmation bar */}
        {isAdmin && confirming && (
          <div className="mx-8 mb-4 px-5 py-4 bg-error-container rounded-2xl flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-error-container">warning</span>
              <div>
                <p className="text-sm font-bold text-on-error-container">Delete this customer?</p>
                <p className="text-xs text-on-error-container/70 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 rounded-xl text-on-error-container text-xs font-bold hover:bg-error-container/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(customer.id)}
                className="px-4 py-2 rounded-xl bg-error text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 flex items-center justify-between flex-shrink-0 border-t border-surface-container-low">
          {!editing ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-2.5 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Edit
                </button>
                {isAdmin && (
                <button
                  onClick={() => setConfirming((v) => !v)}
                  className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center gap-2 ${
                    confirming
                      ? 'border-error bg-error text-white'
                      : 'border-error text-error hover:bg-error hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Delete
                </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl primary-gradient text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl primary-gradient text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, reports } = useData()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  function handleSave(form) {
    addCustomer(form)
    setShowModal(false)
    setPage(1)
  }

  const filtered = customers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contactName || c.contact || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.country || '').toLowerCase().includes(q)
    )
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="p-8 min-h-screen bg-page-bg">
      {showModal && (
        <AddCustomerModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          reports={reports}
          onClose={() => setSelectedCustomer(null)}
          onSave={(id, form) => {
            updateCustomer(id, form)
            setSelectedCustomer((prev) => ({
              ...prev,
              name:         form.companyName,
              address:      form.address,
              city:         form.city,
              postalCode:   form.postalCode,
              country:      form.country,
              region:       `${form.city}, ${form.postalCode}`,
              phone:        form.phone,
              email:        form.email,
              contactName:  form.contactName,
              contactPhone: form.contactPhone,
              contactEmail: form.contactEmail,
            }))
          }}
          onDelete={(id) => {
            deleteCustomer(id)
            setSelectedCustomer(null)
          }}
        />
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
            Customer Directory
          </h1>
          <p className="text-on-surface-variant text-base">
            Manage customers and review regional service coverage across your global accounts.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 rounded-xl primary-gradient text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-primary/10 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      {(() => {
        const uniqueCountries = new Set(customers.map((c) => c.country).filter(Boolean)).size
        const uniqueCities    = new Set(customers.map((c) => c.city).filter(Boolean)).size
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Customers',        value: customers.length, icon: 'groups',        color: 'bg-surface-tint'      },
              { label: 'Service Countries', value: uniqueCountries,  icon: 'public',        color: 'bg-primary-container' },
              { label: 'Service Cities',    value: uniqueCities,     icon: 'location_city', color: 'bg-secondary'         },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-surface-container-lowest rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-surface leading-none">{value.toLocaleString()}</p>
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Search */}
      <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl mb-8 w-full max-w-sm">
        <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400"
        />
      </div>

      {/* Customer Table */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low">
              {['Customers', 'Contact Person', 'City & Country', 'Tasks', 'Details'].map(
                (h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.map((customer) => (
              <tr
                key={customer.id}
                className="group hover:bg-surface-container-low transition-colors cursor-pointer border-b border-surface-container-low"
                onClick={() => setSelectedCustomer(customer)}
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <InitialsAvatar initials={customer.initials} size="lg" />
                    <div>
                      <div className="font-bold text-on-surface text-base">{customer.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="font-semibold text-on-surface">{customer.contactName || '—'}</div>
                </td>
                <td className="px-6 py-5 text-on-surface-variant text-sm font-medium">
                  {[customer.city, customer.country].filter(Boolean).join(', ') || customer.region}
                </td>
                <td className="px-6 py-5">
                  {(() => {
                    const ct = (reports || []).filter((r) => r.customerId === customer.id)
                    const counts = [
                      { label: 'Open',     col: 'open',        cls: 'status-cancelled-badge'  },
                      { label: 'In Prog',  col: 'in-progress', cls: 'status-progress-badge'    },
                      { label: 'Review',   col: 'review',      cls: 'status-scheduled-badge'  },
                      { label: 'Done',     col: 'completed',   cls: 'status-completed-badge' },
                    ]
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-on-surface w-6">{ct.length}</span>
                        {counts.map(({ label, col, cls }) => {
                          const n = ct.filter((r) => r.column === col).length
                          return (
                            <span key={col} className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cls}`}>
                              {n} {label}
                            </span>
                          )
                        })}
                      </div>
                    )
                  })()}
                </td>
                <td className="px-6 py-5 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer) }}
                    className="text-primary font-bold text-sm px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 px-2">
          <p className="text-sm text-on-surface-variant">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{' '}
            <span className="font-bold">{filtered.length}</span> customers
          </p>
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            {/* Page numbers with ellipsis */}
            {(() => {
              const pages = []
              const delta = 2
              const left  = page - delta
              const right = page + delta

              let prev = null
              for (let p = 1; p <= totalPages; p++) {
                if (p === 1 || p === totalPages || (p >= left && p <= right)) {
                  if (prev !== null && p - prev > 1) {
                    pages.push('...')
                  }
                  pages.push(p)
                  prev = p
                }
              }

              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-on-surface-variant text-sm">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                      p === page
                        ? 'primary-gradient text-white shadow-md shadow-primary/20'
                        : 'hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    {p}
                  </button>
                )
              )
            })()}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
