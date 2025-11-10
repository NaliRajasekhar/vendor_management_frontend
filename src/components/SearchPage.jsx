import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchVendors, searchClients, uploadVendorClientsCsv, searchGlobalVendorClients } from '../api/search.js'
import RowsPerPage from './controls/RowsPerPage.jsx'
import { notifyError, notifySuccess } from '../lib/notify.js'
import { apiBase as apiBase } from '../api/base.js'

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
      alert("apibase", apiBase);
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

  return (
    <div className="app">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <h1 className="title">Search List</h1>

              <div className="card-controls"><RowsPerPage value={limit} onChange={(n)=>{ setLimit(n); setOffset(0) }} /></div>
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
      {/* <div className="card" style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
       <span style={{color:'#64748b'}}>Limit</span>
        <input
          type="text"
          value={limitInput}
          onChange={(e)=>{
            const v = e.target.value
            if (v === '' || /^\d+$/.test(v)) setLimitInput(v)
          }}
          onBlur={() => {
            const n = Math.min(Math.max(parseInt(limitInput || String(limit), 10) || limit, 1), 500)
            setLimit(n)
            setLimitInput(String(n))
            setOffset(0)
            runSearch(true)
          }}
          onKeyDown={(e)=>{
            if (e.key === 'Enter') {
              const n = Math.min(Math.max(parseInt(limitInput || String(limit), 10) || limit, 1), 500)
              setLimit(n)
              setLimitInput(String(n))
              setOffset(0)
              runSearch(true)
            }
          }}
          style={{width:80}}
        />
        </div> */}
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
                      <Link className="no-underline" to={`/vendor/${encodeURIComponent(r.vendor_id)}`}>{r.vendor_name}</Link>
                    </div>
                    <div key={`v-${i}-w`} title={r.website || ''}>{r.website || '-'}</div>
                    <div key={`v-${i}-c`} title={r.vendor_city || ''}>{r.vendor_city || '-'}</div>
                    <div key={`v-${i}-s`} title={r.vendor_state || ''}>{r.vendor_state || '-'}</div>
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
                <div style={{fontWeight:600}}>Vendor Name</div>
                <div style={{fontWeight:600}}>Client</div>
                <div style={{fontWeight:600}}>Implementation</div>
                <div style={{fontWeight:600}}>Point of Contact</div>
                <div style={{fontWeight:600}}>Email</div>
                <div style={{fontWeight:600}}>State</div>
                <div style={{fontWeight:600}}>Phone</div>
                <div style={{fontWeight:600}}>City</div>
                <div style={{fontWeight:600}}>Status</div>
                {items.map((r, i) => (
                  <>
                    <div key={`c-${i}-vn`} title={r.vendor_name || ''}>
                      {r.vendor_name ? <Link className="no-underline" to={`/vendor/${encodeURIComponent(r.vendor_id || '')}`}>{r.vendor_name}</Link> : '-'}
                    </div>
                    <div key={`c-${i}-cn`} title={r.client_name || ''}>
                      {r.client_name ? <Link className="no-underline" to={`/vendors/${encodeURIComponent(r.id)}`}>{r.client_name}</Link> : '-'}
                    </div>
                    <div key={`c-${i}-imp`} title={r.implementation_partner_name || ''}>{r.implementation_partner_name || '-'}</div>
                    <div key={`c-${i}-poc`} title={r.contact_person_name || ''}>{r.contact_person_name || '-'}</div>
                    <div key={`c-${i}-em`} title={r.email || ''}>{r.email || '-'}</div>
                    <div key={`c-${i}-stt`} title={r.client_state || ''}>{r.client_state || '-'}</div>
                    <div key={`c-${i}-ph`} title={r.phone || ''}>{formatUSPhone(r.phone)}</div>
                    <div key={`c-${i}-cty`} title={r.client_city || ''}>{r.client_city || '-'}</div>
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


