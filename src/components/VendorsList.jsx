import { Link } from 'react-router-dom'
import EditIcon from '@mui/icons-material/Edit'
import { useEffect, useState } from 'react'
import { listVendors } from '../api/vendors.js'
import { notifyError } from '../lib/notify.js'
import { useAuth } from '../context/AuthContext.jsx'
import RowsPerPage from './controls/RowsPerPage.jsx'

export default function VendorsList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [limitInput, setLimitInput] = useState('10')

  const { hasRole } = useAuth()
  const canEdit = hasRole('admin', 'employee')
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await listVendors({ activeOnly: true })
        if (!cancelled) { setItems(data); setOffset(0) }
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to load vendors'
        if (!cancelled) setError(msg)
        notifyError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])
  const pageItems = items.slice(offset, offset + limit)
  const next = () => setOffset(o => Math.min(items.length, o + limit))
  const prev = () => setOffset(o => Math.max(0, o - limit))
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil((items.length || 1) / limit))
  const isLastPage = offset + limit >= items.length
  const safeTotal = items.length
  const rangeStart = safeTotal === 0 ? 0 : offset + 1
  const rangeEnd = Math.min(offset + pageItems.length, safeTotal)

  function formatYmd(input) {
    if (!input) return '-'
    const dt = new Date(input)
    if (isNaN(dt)) return '-'
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return (
    <div className="app">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 className="title">Active Vendors List</h1>
        <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'flex-end'}}>
        <div className="card-controls"><RowsPerPage value={limit} onChange={(n)=>{ setLimit(n); setOffset(0) }} /></div>

        </div>
      </div>
      <div className="card">
        {loading && <div className="help" style={{color:'#64748b'}}>Loading vendors…</div>}
        {error && <div className="alert error">{error}</div>}
        {!loading && !error && items.length === 0 && <div className="help" style={{color:'#64748b'}}>No vendors yet. Add one from the form.</div>}
        {!loading && !error && items.length > 0 && (
          <>
          <div className="help" style={{ color:'#64748b', padding: '8px 12px' }}>
            Showing {rangeStart}-{rangeEnd} of {safeTotal} records
          </div>
          <div className="results-grid vendors vendors-list">
            <div style={{fontWeight:600}}>Client</div>
            <div style={{fontWeight:600}}>Implementation</div>
            <div style={{fontWeight:600}}>Vendor Name</div>
            <div style={{fontWeight:600}}>Status</div>
            <div style={{fontWeight:600}}>Created</div>
            <div style={{fontWeight:600}}>Edit</div>

            {pageItems.map((v, i) => (
              <>
              <div key={`vl-${i}-client`}>
                  {v.client}
                </div>
                <div key={`vl-${i}-impl`}>{v.implementation || '-'}</div>
                <div key={`vl-${i}-vendor`}>{v.vendor || '-'}</div>
                
                <div key={`vl-${i}-status`}>
                  {(() => {
                    const isActive = v.isPrimary !== false
                    return (
                      <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    )
                  })()}
                </div>
                <div key={`vl-${i}-created`}>{formatYmd(v.updatedAt || v.updated_at)}</div>
                <div key={`vl-${i}-edit`}>
                  {canEdit ? (
                    <Link to={`/vendors/${v.id}/edit`} aria-label="Edit vendor" title="Edit">
                      <EditIcon style={{ verticalAlign:'middle', color:'#334155' }} fontSize="small" />
                    </Link>
                  ) : (
                    <span style={{ color:'#94a3b8' }}>—</span>
                  )}
                </div>
              </>
            ))}
          </div>
          </>
        )}
      </div>
      {!loading && items.length > 0 && (
        <div className="pagination" style={{display:'flex',gap:8,justifyContent:'flex-end',alignItems:'center'}}>
          <button className="btn" onClick={prev} disabled={offset===0}>Prev</button>
          <div className="pages" style={{display:'flex',gap:6,alignItems:'center'}}>
            {(() => {
              const pages = new Set([1, currentPage-2, currentPage-1, currentPage, currentPage+1, totalPages])
              const filtered = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a,b)=>a-b)
              return filtered.map((p,i) => (
                <button key={`vp-${p}-${i}`} className={`page ${p===currentPage?'active':''}`} onClick={()=>{ setOffset((p-1)*limit) }}>
                  {p}
                </button>
              ))
            })()}
          </div>
          <button className="btn" onClick={next} disabled={isLastPage}>Next</button>
        </div>
      )}
    </div>
  )
}




