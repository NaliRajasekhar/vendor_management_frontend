import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/contact.css'
import { validateForm, firstErrorKey } from '../lib/validation.js'
import { postContact } from '../api/index.js'
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
  department: '',
  state: '',
  city: '',
  msaSignedDate: '',
  msvFileUrl: ''
}

// United States states and a small set of example cities per state.
// Extend CITIES_BY_STATE as needed without changing form logic.
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

const CITIES_BY_STATE = {
  AL: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'],
  AK: ['Anchorage', 'Juneau', 'Fairbanks'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'],
  AR: ['Little Rock', 'Fayetteville', 'Fort Smith'],
  CA: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Sacramento'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'],
  CT: ['Bridgeport', 'New Haven', 'Stamford', 'Hartford'],
  DE: ['Wilmington', 'Dover', 'Newark'],
  DC: ['Washington'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
  GA: ['Atlanta', 'Savannah', 'Augusta', 'Columbus'],
  HI: ['Honolulu', 'Hilo', 'Kailua'],
  ID: ['Boise', 'Meridian', 'Idaho Falls'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Springfield'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport'],
  KS: ['Wichita', 'Overland Park', 'Kansas City'],
  KY: ['Louisville', 'Lexington', 'Bowling Green'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport'],
  ME: ['Portland', 'Lewiston', 'Bangor'],
  MD: ['Baltimore', 'Frederick', 'Gaithersburg'],
  MA: ['Boston', 'Worcester', 'Springfield'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Ann Arbor'],
  MN: ['Minneapolis', 'Saint Paul', 'Rochester'],
  MS: ['Jackson', 'Gulfport', 'Southaven'],
  MO: ['Kansas City', 'St. Louis', 'Springfield'],
  MT: ['Billings', 'Missoula', 'Great Falls'],
  NE: ['Omaha', 'Lincoln', 'Bellevue'],
  NV: ['Las Vegas', 'Henderson', 'Reno'],
  NH: ['Manchester', 'Nashua', 'Concord'],
  NJ: ['Newark', 'Jersey City', 'Paterson'],
  NM: ['Albuquerque', 'Las Cruces', 'Santa Fe'],
  NY: ['New York', 'Buffalo', 'Rochester', 'Syracuse'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman'],
  OR: ['Portland', 'Eugene', 'Salem'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown'],
  RI: ['Providence', 'Warwick', 'Cranston'],
  SC: ['Columbia', 'Charleston', 'Greenville'],
  SD: ['Sioux Falls', 'Rapid City'],
  TN: ['Nashville', 'Memphis', 'Knoxville'],
  TX: ['Houston', 'San Antonio', 'Dallas', 'Austin'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo'],
  VT: ['Burlington', 'South Burlington', 'Rutland'],
  VA: ['Virginia Beach', 'Norfolk', 'Richmond'],
  WA: ['Seattle', 'Spokane', 'Tacoma'],
  WV: ['Charleston', 'Huntington', 'Morgantown'],
  WI: ['Milwaukee', 'Madison', 'Green Bay'],
  WY: ['Cheyenne', 'Casper', 'Laramie'],
}

export default function ContactForm({ initialValues, onSubmit, submitLabel = 'Save' }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialValues || initialForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const fieldRefs = useRef({})
  const [msvFile, setMsvFile] = useState(null)
  const [departmentMode, setDepartmentMode] = useState('list') // 'list' | 'other'

  // Sync incoming initial values (Edit page) into local form state
  useEffect(() => {
    if (!initialValues) return
    const normDate = initialValues.msaSignedDate ? String(initialValues.msaSignedDate).slice(0, 10) : ''
    const normIsPrimary = (initialValues.isPrimary === true) || (initialValues.isPrimary === 'true') || (initialValues.isPrimary === 1) || (initialValues.isPrimary === '1')
    setForm((f) => ({ ...f, ...initialValues, msaSignedDate: normDate, isPrimary: normIsPrimary }))
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
          <input id="email" ref={(el)=>fieldRefs.current.email=el} aria-invalid={Boolean(touched.email && currentErrors.email)}
            type="email" placeholder="name@company.com" value={form.email} onChange={update('email')} onBlur={()=>setTouched(t=>({...t, email:true}))} />
          {touched.email && currentErrors.email && <span className="help error">{currentErrors.email}</span>}
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
            <option value="Engineering">Engineering</option>
            <option value="Implementation">Implementation</option>
            <option value="Support">Support</option>
            <option value="Sales">Sales</option>
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
          <label htmlFor="state">State</label>
          <SearchableSelect
            id="state"
            value={form.state}
            onChange={(val)=> setForm(f=>({ ...f, state: val }))}
            options={US_STATES.map(s => ({ value: s.code, label: `${s.name} (${s.code})` }))}
            placeholder="Search state (e.g., New, CA, TX)"
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
              Current file: <a href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/vendors/${encodeURIComponent(form.id || '')}/msv`} target="_blank" rel="noreferrer">View</a>
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



