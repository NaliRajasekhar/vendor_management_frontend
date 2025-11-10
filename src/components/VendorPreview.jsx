import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getVendorClientsByVendor } from '../api/search.js'
import { getVendor } from '../api/vendors.js'
import { notifyError } from '../lib/notify.js'

export default function VendorPreview() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:400'

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        // Get one representative vendor_client row for this vendor
        const data = await getVendorClientsByVendor(vendorId, { limit: 1, offset: 0 })
        const first = data?.items?.[0]
        if (!first) {
          setItem(null)
          return
        }
        // Fetch full mapped detail (includes msvFileUrl) using existing endpoint
        const detail = await getVendor(first.id)
        if (active) setItem(detail)
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to load'
        if (active) setError(msg)
        notifyError(msg)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [vendorId])

  return (
    <div className="app">
      <h1 className="title">Vendor Preview</h1>
      <div className="card" style={{display:'flex',flexDirection:'column'}}>
        {loading && <div className="help" style={{color:'#64748b'}}>Loading…</div>}
        {error && <div className="alert error">{error}</div>}
        {!loading && !error && !item && (
          <div className="help" style={{color:'#64748b'}}>No records found for this vendor.</div>
        )}
        {!loading && !error && item && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'8px'}}>
            <div style={{fontWeight:600}}>Vendor</div>
            <div>{item.vendor || '-'}</div>
            <div style={{fontWeight:600}}>Client</div>
            <div>{item.client || '-'}</div>
            <div style={{fontWeight:600}}>Implementation</div>
            <div>{item.implementation || '-'}</div>
            <div style={{fontWeight:600}}>Point of Contact</div>
            <div>{item.name || '-'}</div>
            <div style={{fontWeight:600}}>Email</div>
            <div>{item.email || '-'}</div>
            <div style={{fontWeight:600}}>Phone</div>
            <div>{item.phone || '-'}</div>
            <div style={{fontWeight:600}}>City</div>
            <div>{item.city || '-'}</div>
            <div style={{fontWeight:600}}>State</div>
            <div>{item.state || '-'}</div>
            <div style={{fontWeight:600}}>MSA File</div>
            <div>
              {item.id && item.msvFileUrl ? (
                <a href={`${apiBase}/api/vendors/${encodeURIComponent(item.id)}/msv`}>
                  View
                </a>
              ) : '-' }
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'auto'}}>
          <button className="btn" onClick={() => navigate(-1)}>Back</button>
          {item?.id && (
            <Link className="btn primary" to={`/vendors/${encodeURIComponent(item.id)}/edit`}>Edit</Link>
          )}
        </div>
      </div>
    </div>
  )
}
