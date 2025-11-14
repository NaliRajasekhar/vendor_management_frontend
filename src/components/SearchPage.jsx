import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchVendors, searchClients, uploadVendorClientsCsv, searchGlobalVendorClients } from '../api/search.js'
import RowsPerPage from './controls/RowsPerPage.jsx'
import { notifyError, notifySuccess } from '../lib/notify.js'
import { apiBase as apiBase } from '../api/base.js'

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default function SearchPage() {
  const [mode, setMode] = useState('clients') // 'vendors' | 'clients'
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(10)
  const [limitInput, setLimitInput] = useState('10')
  const [offset, setOffset] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  
  const [total, setTotal] = useState(0)

  const fetcher = useMemo(() => (mode === 'vendors' ? searchVendors : searchClients), [mode])
  const trimmedQuery = useMemo(() => (q || '').trim(), [q])
  const normalizedQuery = trimmedQuery.toLowerCase()

  async function runSearch(resetOffset = false, explicitOffset) {
    try {
      setLoading(true)
      setError('')
      const useOffset = resetOffset ? 0 : (typeof explicitOffset === 'number' ? explicitOffset : offset)
      let rows = []
      if (q && q.trim().length > 0) {
        const res = await searchGlobalVendorClients(q.trim(), { limit, offset: useOffset })
        rows = res.items || []
        setTotal(Number(res.total || 0))
      } else {
        const res = await fetcher(q, { limit, offset: useOffset })
        rows = res.items || []
        setTotal(Number(res.total || 0))
      }
      setItems(rows)
      if (resetOffset) setOffset(0)
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to search'
      setError(msg)
      notifyError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runSearch(true) }, [mode])

  // Auto-run search when typing 3+ characters (or cleared to empty)
  useEffect(() => {
    const term = String(q || '').trim()
    const shouldSearch = term.length >= 3 || term.length === 0
    if (!shouldSearch) return
    const t = setTimeout(() => { runSearch(true) }, 300)
    return () => clearTimeout(t)
  }, [q])  

  const next = () => { const totalPages = Math.max(1, Math.ceil((total || 0) / limit)); const newPage = Math.min(totalPages, Math.floor(offset / limit) + 2); const newOffset = (newPage - 1) * limit; setOffset(newOffset); runSearch(false, newOffset) }
  const prev = () => { const newPage = Math.max(1, Math.floor(offset / limit)); const newOffset = (newPage - 1) * limit; setOffset(newOffset); runSearch(false, newOffset) }
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit))
  const isLastPage = currentPage >= totalPages && !loading
  function goToPage(p) {
    const newOffset = (p - 1) * limit
    setOffset(newOffset)
    runSearch(false, newOffset)
  }

  async function onUploadChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    setError('')
    try {
      const res = await uploadVendorClientsCsv(file)
      setUploadResult(res)
      notifySuccess(`Inserted ${res.inserted} rows, failed ${res.failed}.`)
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Upload failed'
      setError(msg)
      notifyError(msg)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function downloadCsvTemplate() {
    // Try backend-provided template first, then fallback to local generation
    const url = `${apiBase}/api/bulk/vendor-clients/template`
    try {
      const res = await fetch(url)
      if (res.ok) {
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'vendor-clients-template.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
        return
      }
    } catch {}
    // Fallback: generate a simple CSV with headers aligned to upload endpoint
    const headers = [
      'client',
      'implementation',
      'vendor',
      'name',
      'designation',
      'department',
      'phone',
      'email',
      'city',
      'state',
      'msa'
    ]
    const csv = `${headers.join(',')}\r\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'vendor-clients-template.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function formatUSPhone(p) {
    if (!p) return '-'
    const digits = String(p).replace(/\D/g, '')
    let local = ''
    if (digits.length === 11 && digits.startsWith('1')) {
      local = digits.slice(1)
    } else if (digits.length >= 10) {
      local = digits.slice(-10)
    } else {
      return p
    }
    const area = local.slice(0, 3)
    const pre = local.slice(3, 6)
    const line = local.slice(6)
    return `+1 (${area}) ${pre}-${line}`
  }

  const highlightText = (value, fallback = '-') => {
    if (value === null || value === undefined || value === '') return fallback
    if (!trimmedQuery) return value
    const asString = String(value)
    const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi')
    const parts = asString.split(regex)
    if (parts.length === 1) return asString
    return parts.map((part, idx) => {
      if (!part) return null
      if (part.toLowerCase() === normalizedQuery && normalizedQuery) {
        return <mark key={`hit-${idx}`} className="highlight-mark">{part}</mark>
      }
      return <span key={`txt-${idx}`}>{part}</span>
    })
  }

  return (
    <div className="app">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 className="title">Search List</h1>
        <div className="card-controls" style={{display:'flex',alignItems:'center',gap:8}}>
          <RowsPerPage value={limit} onChange={(n)=>{ setLimit(n); setOffset(0) }} />
          <button className="btn" style={{ background: '#fff' }} onClick={downloadCsvTemplate} disabled={uploading} >Download CSV Template</button>
        </div>
      </div>
      <div className="card search-controls">      
        <div className="search-input-wrap">
          <input className="search-input" type="text" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search vendor, client, email, phone, state, implementation, or contact" style={{minWidth:280}} />
          <span className="search-input-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <button className="btn primary" onClick={()=>runSearch(true)} disabled={loading}>Search</button>
        <label className="btn" style={{cursor:'pointer'}}>
          {uploading ? 'Uploading…' : 'Upload CSV'}
          <input type="file" accept=".csv,text/csv" onChange={onUploadChange} style={{display:'none'}} />
        </label>
      </div>
      
      {error && <div className="alert error">{error}</div>}
      {uploadResult && (
        <>
          <div className="alert success">Inserted {uploadResult.inserted} rows, failed {uploadResult.failed}.</div>
          {uploadResult.errorReportUrl && (
             
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
              <a
                className="btn" style={{ background: 'var(--card)' }}
                // C:\Logisoft\React\vmanagement\backend\backend\uploads
              //  href={"http://localhost:4000/uploads/csv-upload-errors-1762799333406.csv"}
                
                href={(`${apiBase}${uploadResult.errorReportUrl}`)}
                target="_blank"
                rel="noreferrer"
              >
                Download Error Report
              </a>
            </div>
          )}
        </>
      )}

      <div className="card">
        {loading && <div className="help" style={{color:'#64748b'}}>Loading…</div>}
        {!loading && items.length === 0 && <div className="help" style={{color:'#64748b'}}>No results.</div>}
        {!loading && items.length > 0 && (
          <>
            {(() => {
              const safeTotal = Number.isFinite(total) && total > 0 ? total : (offset + items.length)
              const start = offset + 1
              const end = Math.min(offset + items.length, safeTotal)
              return (
                <div className="help" style={{ color:'#64748b', padding: '8px 12px' }}>
                  Showing {start}-{end} of {safeTotal} records
                </div>
              )
            })()}
            <div className={mode==='vendors' ? 'results-grid vendors' : 'results-grid clients'}>
            {mode === 'vendors' ? (
              <>
                <div style={{fontWeight:600}}>Vendor</div>
                <div style={{fontWeight:600}}>Website</div>
                <div style={{fontWeight:600}}>City</div>
                <div style={{fontWeight:600}}>State</div>
                <div style={{fontWeight:600}}>Status</div>
                {items.map((r, i) => (
                  <>
                    <div key={`v-${i}-n`} title={r.vendor_name || ''}>
                      <Link className="no-underline" to={`/vendor/${encodeURIComponent(r.vendor_id)}`}>
                        {highlightText(r.vendor_name, '')}
                      </Link>
                    </div>
                    <div key={`v-${i}-w`} title={r.website || ''}>{highlightText(r.website)}</div>
                    <div key={`v-${i}-c`} title={r.vendor_city || ''}>{highlightText(r.vendor_city)}</div>
                    <div key={`v-${i}-s`} title={r.vendor_state || ''}>{highlightText(r.vendor_state)}</div>
                    <div key={`v-${i}-st`}>
                      {(() => {
                        const isActive = typeof r.msa !== 'undefined' ? Boolean(r.msa) : true
                        return (
                          <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        )
                      })()}
                    </div>
                  </>
                ))}
              </>
            ) : (
              <>
                <div style={{fontWeight:600}}>Client</div>
                <div style={{fontWeight:600}}>Implementation</div>
                <div style={{fontWeight:600}}>Vendor Name</div>
                <div style={{fontWeight:600}}>Point of Contact</div>
                <div style={{fontWeight:600}}>Designation</div>
                <div style={{fontWeight:600}}>Phone</div>
                <div style={{fontWeight:600}}>Email</div>
                <div style={{fontWeight:600}}>City</div>
                <div style={{fontWeight:600}}>State</div>
                <div style={{fontWeight:600}}>Status</div>
                {items.map((r, i) => (
                  <>
                  <div key={`c-${i}-cn`} className="tooltip-cell" title={r.client_name || ''} data-full={r.client_name || ''}>
                    <span className="truncate">
                      {r.client_name ? (
                        <Link className="no-underline" to={`/vendors/${encodeURIComponent(r.id)}`}>
                          {highlightText(r.client_name, '')}
                        </Link>
                      ) : '-'}
                    </span>
                  </div>
                  <div key={`c-${i}-imp`} className="tooltip-cell" title={r.implementation_partner_name || ''} data-full={r.implementation_partner_name || ''}>
                    <span className="truncate">{highlightText(r.implementation_partner_name)}</span>
                  </div>

                  <div key={`c-${i}-vn`} className="tooltip-cell" title={r.vendor_name || ''} data-full={r.vendor_name || ''}>
                    <span className="truncate">
                      {r.vendor_name ? (
                        <Link className="no-underline" to={`/vendor/${encodeURIComponent(r.vendor_id || '')}`}>
                          {highlightText(r.vendor_name, '')}
                        </Link>
                      ) : '-'}
                    </span>
                  </div>
                  
                  <div key={`c-${i}-poc`} className="tooltip-cell" title={r.contact_person_name || ''} data-full={r.contact_person_name || ''}>
                    <span className="truncate">{highlightText(r.contact_person_name)}</span>
                  </div>
                    <div key={`c-${i}-des`} title={r.designation || ''}>{highlightText(r.designation)}</div>
                    <div key={`c-${i}-ph`} title={r.phone || ''}>{highlightText(formatUSPhone(r.phone))}</div>
                    <div key={`c-${i}-em`} title={r.email || ''}>{highlightText(r.email)}</div>
                    <div key={`c-${i}-cty`} title={r.client_city || ''}>{highlightText(r.client_city)}</div>
                    <div key={`c-${i}-stt`} title={r.client_state || ''}>{highlightText(r.client_state)}</div>
                    <div key={`c-${i}-st`}>
                      {(() => {
                        const isActive = typeof r.msa !== 'undefined' ? Boolean(r.msa) : true
                        return (
                          <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        )
                      })()}
                    </div>
                  </>
                ))}
              </>
            )}
            </div>
          </>
        )}
      </div>

      <div className="pagination" style={{display:'flex',gap:8,justifyContent:'flex-end',alignItems:'center'}}>
        <button className="btn" onClick={prev} disabled={loading || currentPage===1}>Prev</button>
        <div className="pages" style={{display:'flex',gap:6,alignItems:'center'}}>
          {(() => {
            const pages = new Set([1, currentPage-2, currentPage-1, currentPage, currentPage+1, totalPages])
            const filtered = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a,b)=>a-b)
            return filtered.map((p,i) => (
              <button key={`p-${p}-${i}`} className={`page ${p===currentPage?'active':''}`} onClick={()=>goToPage(p)} disabled={loading}>
                {p}
              </button>
            ))
          })()}
        </div>
        <button className="btn" onClick={next} disabled={loading || isLastPage}>Next</button>
      </div>
    </div>
  )
}


