import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getVendor } from '../api/vendors.js'
import { notifyError } from '../lib/notify.js'

export default function VendorClientPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getVendor(id)
      .then((data) => { if (active) setItem(data) })
      .catch((e) => { const msg = e?.response?.data?.message || e?.message || 'Failed to load'; if (active) setError(msg); notifyError(msg) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  return (
    <div className="app">
      <h1 className="title">Client Preview</h1>
      <div className="card" style={{display:'flex',flexDirection:'column'}}>
        {loading && <div className="help" style={{color:'#64748b'}}>Loading…</div>}
        {error && <div className="alert error">{error}</div>}
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
              {id && item.msvFileUrl ? (
                <a href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/vendors/${encodeURIComponent(id)}/msv`}>
                  View
                </a>
              ) : '-' }
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'auto'}}>
          <button className="btn" onClick={() => navigate(-1)}>Back</button>
          {id && (
            <Link className="btn primary" to={`/vendors/${encodeURIComponent(id)}/edit`}>Edit</Link>
          )}
        </div>
      </div>
    </div>
  )
}
