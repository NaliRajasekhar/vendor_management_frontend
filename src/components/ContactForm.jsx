import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/contact.css'
import { validateForm, firstErrorKey } from '../lib/validation.js'
import { postContact } from '../api/index.js'
import { checkVendorEmailUnique } from '../api/vendors.js'
import { notifyError, notifySuccess } from '../lib/notify.js'
import SearchableSelect from './controls/SearchableSelect.jsx'

const initialForm = {
  vendor: '',
  implementation: '',
  client: '',
  isPrimary: false,
  name: '',
  phone: '',
  email: '',
  designation: '',
  department: '',
  state: '',
  city: '',
  msaSignedDate: '',
  msvFileUrl: ''
}

// United States states and a small set of example cities per state.
// Extend CITIES_BY_STATE as needed without changing form logic.
const US_STATES = [
  { code: 'Alabama', name: 'Alabama' },
  { code: 'Alaska', name: 'Alaska' },
  { code: 'Arizona', name: 'Arizona' },
  { code: 'Arkansas', name: 'Arkansas' },
  { code: 'California', name: 'California' },
  { code: 'Colorado', name: 'Colorado' },
  { code: 'Connecticut', name: 'Connecticut' },
  { code: 'Delaware', name: 'Delaware' },
  { code: 'District of Columbia', name: 'District of Columbia' },
  { code: 'Florida', name: 'Florida' },
  { code: 'Georgia', name: 'Georgia' },
  { code: 'Hawaii', name: 'Hawaii' },
  { code: 'Idaho', name: 'Idaho' },
  { code: 'Illinois', name: 'Illinois' },
  { code: 'Indiana', name: 'Indiana' },
  { code: 'Iowa', name: 'Iowa' },
  { code: 'Kansas', name: 'Kansas' },
  { code: 'Kentucky', name: 'Kentucky' },
  { code: 'Louisiana', name: 'Louisiana' },
  { code: 'Maine', name: 'Maine' },
  { code: 'Maryland', name: 'Maryland' },
  { code: 'Massachusetts', name: 'Massachusetts' },
  { code: 'Michigan', name: 'Michigan' },
  { code: 'Minnesota', name: 'Minnesota' },
  { code: 'Mississippi', name: 'Mississippi' },
  { code: 'Missouri', name: 'Missouri' },
  { code: 'Montana', name: 'Montana' },
  { code: 'Nebraska', name: 'Nebraska' },
  { code: 'Nevada', name: 'Nevada' },
  { code: 'New Hampshire', name: 'New Hampshire' },
  { code: 'New Jersey', name: 'New Jersey' },
  { code: 'New Mexico', name: 'New Mexico' },
  { code: 'New York', name: 'New York' },
  { code: 'North Carolina', name: 'North Carolina' },
  { code: 'North Dakota', name: 'North Dakota' },
  { code: 'Ohio', name: 'Ohio' },
  { code: 'Oklahoma', name: 'Oklahoma' },
  { code: 'Oregon', name: 'Oregon' },
  { code: 'Pennsylvania', name: 'Pennsylvania' },
  { code: 'Rhode Island', name: 'Rhode Island' },
  { code: 'South Carolina', name: 'South Carolina' },
  { code: 'South Dakota', name: 'South Dakota' },
  { code: 'Tennessee', name: 'Tennessee' },
  { code: 'Texas', name: 'Texas' },
  { code: 'Utah', name: 'Utah' },
  { code: 'Vermont', name: 'Vermont' },
  { code: 'Virginia', name: 'Virginia' },
  { code: 'Washington', name: 'Washington' },
  { code: 'West Virginia', name: 'West Virginia' },
  { code: 'Wisconsin', name: 'Wisconsin' },
  { code: 'Wyoming', name: 'Wyoming' },
]

// Abbreviation→Name mapping to normalize legacy values like "NJ" or "ny".
const STATE_ABBREV_TO_NAME = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky',
  LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
}

// Convert various inputs (e.g., "new jersey", "NJ") to canonical state name
function canonicalizeState(input) {
  if (input === undefined || input === null) return ''
  const raw = String(input).trim()
  if (!raw) return ''
  const squished = raw.replace(/\s+/g, ' ')
  const lower = squished.toLowerCase()
  const byName = US_STATES.find(s => s.name.toLowerCase() === lower)
  if (byName) return byName.name
  const abbr = squished.toUpperCase()
  if (STATE_ABBREV_TO_NAME[abbr]) return STATE_ABBREV_TO_NAME[abbr]
  return raw
}

export default function ContactForm({ initialValues, onSubmit, submitLabel = 'Save' }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialValues || initialForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailUniqueError, setEmailUniqueError] = useState('')

  const fieldRefs = useRef({})
  const [msvFile, setMsvFile] = useState(null)
  const [departmentMode, setDepartmentMode] = useState('list') // 'list' | 'other'

  // Sync incoming initial values (Edit page) into local form state
  useEffect(() => {
    if (!initialValues) return
    const normDate = initialValues.msaSignedDate ? String(initialValues.msaSignedDate).slice(0, 10) : ''
    const normIsPrimary = (initialValues.isPrimary === true) || (initialValues.isPrimary === 'true') || (initialValues.isPrimary === 1) || (initialValues.isPrimary === '1')
    const normState = canonicalizeState(initialValues.state)
    setForm((f) => ({ ...f, ...initialValues, state: normState, msaSignedDate: normDate, isPrimary: normIsPrimary }))
    const KNOWN_DEPTS = ['Engineering','Implementation','Support','Sales']
    const dep = (initialValues.department || '').trim()
    if (dep && !KNOWN_DEPTS.includes(dep)) setDepartmentMode('other'); else setDepartmentMode('list')
  }, [initialValues])

  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const update = (key) => (e) => {
    let value
    if (e?.target?.type === 'checkbox') value = e.target.checked
    else if (e?.target?.type === 'file') value = e.target.files?.[0] || null
    else value = e?.target?.value
    setForm((f) => ({ ...f, [key]: value }))
    if (key === 'email') {
      setEmailUniqueError('')
    }
  }

  const reset = () => {
    setForm(initialForm)
    setErrors({})
    setTouched({})
    setSubmitting(false)
    setSubmitError('')
    setSubmitted(false)
  }

  const currentErrors = useMemo(() => validateForm(form), [form])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitted(false)
    setSubmitError('')

    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      const allTouched = Object.keys(initialForm).reduce((acc, k) => { acc[k] = true; return acc }, {})
      setTouched(allTouched)
      const key = firstErrorKey(errs)
      if (key && fieldRefs.current[key]) fieldRefs.current[key].focus()
      return
    }

    // Enforce email uniqueness before submit
    try {
      setEmailChecking(true)
      const unique = await checkVendorEmailUnique(form.email, { excludeId: form?.id })
      if (!unique) {
        setEmailUniqueError('Email already exists')
        setTouched((t) => ({ ...t, email: true }))
        fieldRefs.current.email?.focus()
        return
      }
    } catch (err) {
      // If the check fails (network/server), block submit to avoid duplicates
      setEmailUniqueError('Could not verify email uniqueness')
      setTouched((t) => ({ ...t, email: true }))
      fieldRefs.current.email?.focus()
      return
    } finally {
      setEmailChecking(false)
    }

    try {
      setSubmitting(true)
      if (onSubmit) {
        await onSubmit({ ...form, msvFile })
      } else {
        await postContact({ ...form, msvFile })
      }
      setSubmitted(true)
      notifySuccess('Saved successfully')
      // After successful save, redirect to vendors list
      navigate('/vendors')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save'
      setSubmitError(msg)
      notifyError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="contact-card">
    <form className="contact-form" onSubmit={submit} noValidate>
      {submitError && <div className="alert error">{submitError}</div>}
      {submitted && <div className="alert success">Saved successfully.</div>}
      <div className="form-grid">
        <div className="field">
  <label htmlFor="vendor">Vendor</label>
  <input
    id="vendor"
    ref={(el) => (fieldRefs.current.vendor = el)}
    aria-invalid={Boolean(touched.vendor && currentErrors.vendor)}
    type="text"
    placeholder="Enter vendor name"
    value={form.vendor}
    onChange={update('vendor')}
    onBlur={() => setTouched((t) => ({ ...t, vendor: true }))}
  />
  {touched.vendor && currentErrors.vendor && (
    <span className="help error">{currentErrors.vendor}</span>
  )}
</div>


        <div className="field">
  <label htmlFor="implementation">Implementation</label>
  <input
    id="implementation"
    ref={(el) => (fieldRefs.current.implementation = el)}
    aria-invalid={Boolean(touched.implementation && currentErrors.implementation)}
    type="text"
    placeholder="Enter implementation"
    value={form.implementation}
    onChange={update('implementation')}
    onBlur={() => setTouched((t) => ({ ...t, implementation: true }))}
  />
  {touched.implementation && currentErrors.implementation && (
    <span className="help error">{currentErrors.implementation}</span>
  )}
</div>


        <div className="field">
  <label htmlFor="client">Client</label>
  <input
    id="client"
    ref={(el) => (fieldRefs.current.client = el)}
    aria-invalid={Boolean(touched.client && currentErrors.client)}
    type="text"
    placeholder="Enter client name"
    value={form.client}
    onChange={update('client')}
    onBlur={() => setTouched((t) => ({ ...t, client: true }))}
  />
  {touched.client && currentErrors.client && (
    <span className="help error">{currentErrors.client}</span>
  )}
        </div>


        {/* Full Name Field (replaces first/last) */}
        <div className="field">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            ref={(el) => (fieldRefs.current.name = el)}
            aria-invalid={Boolean(touched.name && currentErrors.name)}
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={update('name')}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          />
          {touched.name && currentErrors.name && (
            <span className="help error">{currentErrors.name}</span>
          )}
        </div>

               <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" ref={(el)=>fieldRefs.current.phone=el} aria-invalid={Boolean(touched.phone && currentErrors.phone)}
            type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={update('phone')} onBlur={()=>setTouched(t=>({...t, phone:true}))} />
          {touched.phone && currentErrors.phone && <span className="help error">{currentErrors.phone}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            ref={(el)=>fieldRefs.current.email=el}
            aria-invalid={Boolean(touched.email && (currentErrors.email || emailUniqueError))}
            type="email"
            placeholder="name@company.com"
            value={form.email}
            onChange={update('email')}
            onBlur={async ()=>{
              setTouched(t=>({...t, email:true}))
              const email = String(form.email || '').trim()
              if (!email) return
              if (currentErrors.email) return
              try {
                setEmailChecking(true)
                const unique = await checkVendorEmailUnique(email, { excludeId: form?.id })
                setEmailUniqueError(unique ? '' : 'Email already exists')
              } catch {
                setEmailUniqueError('Could not verify email uniqueness')
              } finally {
                setEmailChecking(false)
              }
            }}
          />
          {touched.email && currentErrors.email && <span className="help error">{currentErrors.email}</span>}
          {touched.email && !currentErrors.email && emailUniqueError && (
            <span className="help error">{emailUniqueError}</span>
          )}
          {emailChecking && (
            <span className="help" style={{color:'#64748b'}}>Checking email…</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            value={departmentMode === 'other' ? '__OTHER__' : (form.department || '')}
            onChange={(e)=>{
              const val = e.target.value
              if (val === '__OTHER__') {
                setDepartmentMode('other')
                setForm(f=>({ ...f, department: f.department || '' }))
              } else {
                setDepartmentMode('list')
                setForm(f=>({ ...f, department: val }))
              }
            }}
          >
            <option value="">Select department</option>
            <option value="Sales">Sales</option>
            <option value="Recruiting">Recruiting</option>
            <option value="Contracts">Contracts</option>
            <option value="accounts">Accounts</option>
            <option value="support">Support</option>
            <option value="HR">HR</option>
            <option value="operations">Operations</option>
            <option value="immigration">Immigration</option>
            <option value="__OTHER__">Other…</option>
          </select>
          {departmentMode === 'other' && (
            <input
              id="departmentOther"
              type="text"
              placeholder="Enter department"
              value={form.department}
              onChange={update('department')}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div className="field">
          <label htmlFor="designation">Designation</label>
          <input
            id="designation"
            type="text"
            placeholder="e.g., Manager"
            value={form.designation}
            onChange={update('designation')}
          />
        </div>

        <div className="field">
          <label htmlFor="state">State</label>
          <SearchableSelect
            id="state"
            value={form.state}
            onChange={(val)=> setForm(f=>({ ...f, state: val }))}
            options={US_STATES.map(s => ({ value: s.code, label: s.name }))}
            placeholder="Search state (e.g., New, Texas)"
          />
        </div>

        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" type="text" placeholder="Enter city" value={form.city} onChange={update('city')} />
        </div>
        {/* MSV Upload (PDF or DOC) */}
        <div className="field">
          <label htmlFor="msv">MSA Upload (PDF or DOC)</label>
          <input
            id="msv"
            type="file"
            accept=".pdf,.doc,application/pdf,application/msword"
            onChange={(e)=>{
              const file = e.target.files?.[0] || null
              if (file && !['application/pdf','application/msword'].includes(file.type)) {
                e.target.value = ''
                notifyError('Only .pdf and .doc files are allowed')
                return
              }
              setMsvFile(file)
            }}
          />
          {form.msvFileUrl && (
            <div className="help">
              Current file: <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/vendors/${encodeURIComponent(form.id || '')}/msv`} target="_blank" rel="noreferrer">View</a>
            </div>
          )}
        </div>
        <div className="field">
          <label htmlFor="msaSignedDate">MSA Signed Date</label>
          <input
            id="msaSignedDate"
            type="date"
            min="2008-01-01"
            max={todayStr}
            value={form.msaSignedDate || ''}
            onChange={update('msaSignedDate')}
          />
        </div>
        <div className="field switch-field">
          <label htmlFor="isPrimary">MSA Status</label>
          <label className="switch">
            <input id="isPrimary" type="checkbox" checked={Boolean(form.isPrimary)} onChange={update('isPrimary')} />
            <span className="slider" />
          </label>
        </div>


      </div>

            <div className="actions">
        <button type="button" className="btn secondary" onClick={reset} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
    </div>
  )
}



