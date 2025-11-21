import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getVendorClientsByVendor } from '../api/search.js'
import { getVendor, downloadVendorMsa } from '../api/vendors.js'
import { notifyError } from '../lib/notify.js'

export default function VendorPreview() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingMsa, setDownloadingMsa] = useState(false)
  
  const handleMsaView = async () => {
    if (!item?.id) return
    try {
      setDownloadingMsa(true)
      await downloadVendorMsa(item.id)
    } catch (err) {
      const msg = err?.message || 'Unable to open MSA file'
      notifyError(msg)
    } finally {
      setDownloadingMsa(false)
    }
  }

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const data = await getVendorClientsByVendor(vendorId, { limit: 1, offset: 0 })
        const first = data?.items?.[0]
        if (!first) {
          if (active) setItem(null)
          return
        }
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

  const infoRows = [
    { label: 'Vendor', value: item?.vendor || '-' },
    { label: 'Client', value: item?.client || '-' },
    { label: 'Implementation', value: item?.implementation || '-' },
    { label: 'Point of Contact', value: item?.name || '-' },
    { label: 'Email', value: item?.email || '-' },
    { label: 'Phone', value: item?.phone || '-' },
    { label: 'City', value: item?.city || '-' },
    { label: 'State', value: item?.state || '-' },
    {
      label: 'MSA File',
      value: (item?.id && item?.msvFileUrl)
        ? (
          <button
            type="button"
            className="text-link"
            onClick={handleMsaView}
            disabled={downloadingMsa}
          >
            {downloadingMsa ? 'Opening...' : 'View file'}
          </button>
        )
        : '-'
    },
  ]

  const displayName = (item?.vendor || '').trim() || 'Vendor'
  const initials = displayName.charAt(0).toUpperCase()
  const counterpart = item?.client ? `Client | ${item.client}` : 'Client details unavailable'
  const isPrimary = item?.isPrimary === true
  const statusText = isPrimary ? 'Active' : 'Inactive'
  const mailIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  )
  const phoneIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )

  return (
    <div className="app">
      <h1 className="title">Vendor Preview</h1>
      <div className="card preview-card">
        {loading && <div className="help" style={{color:'#64748b'}}>Loading...</div>}
        {error && <div className="alert error">{error}</div>}
        {!loading && !error && !item && (
          <div className="help" style={{color:'#64748b'}}>No records found for this vendor.</div>
        )}
        {!loading && !error && item && (
          <>
            <section className="preview-head">
              <div>
                <p className="preview-label">Vendor</p>
                <div className="preview-identity">
                  <div className="preview-avatar" aria-hidden="true">{initials}</div>
                  <div>
                    <div className="preview-name">{displayName}</div>
                    <div className="preview-caption">{counterpart}</div>
                  </div>
                </div>
              </div>
              <div className="preview-head-meta">
                <div className="preview-status-block">
                  <span className="preview-status-label">Status</span>
                  <span className={`preview-status-pill ${isPrimary ? 'active' : 'inactive'}`}>{statusText}</span>
                </div>
                <div className="preview-contact">
                  <div className="preview-contact-row">
                    <span className="preview-contact-icon" aria-hidden="true">{mailIcon}</span>
                    <span>{item.email || '-'}</span>
                  </div>
                  <div className="preview-contact-row">
                    <span className="preview-contact-icon" aria-hidden="true">{phoneIcon}</span>
                    <span>{item.phone || '-'}</span>
                  </div>
                </div>
              </div>
            </section>
            <section className="preview-section">
              <h2 className="preview-section-title">Basic info</h2>
              <div className="preview-info-grid">
                {infoRows.map((row) => (
                  <div key={row.label} className="preview-info-row">
                    <div className="preview-info-label">{row.label}</div>
                    <div className="preview-info-value">{row.value}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        <div className="preview-actions">
          <button className="btn" onClick={() => navigate(-1)}>Back</button>
          {item?.id && (
            <Link className="btn primary" to={`/vendors/${encodeURIComponent(item.id)}/edit`}>Edit</Link>
          )}
        </div>
      </div>
    </div>
  )
}
