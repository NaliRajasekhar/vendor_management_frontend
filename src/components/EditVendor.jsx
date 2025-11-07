import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ContactForm from './ContactForm.jsx'
import { getVendor, updateVendor } from '../api/vendors.js'
import { notifyError, notifySuccess } from '../lib/notify.js'

export default function EditVendor() {
  const { id } = useParams()
  const nav = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getVendor(id)
        if (!cancelled) setVendor(data)
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to load vendor'
        if (!cancelled) setError(msg)
        notifyError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="app">
        <h1 className="title">Edit Vendor</h1>
        <div className="card"><div className="help" style={{color:'#64748b'}}>Loading…</div></div>
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="app">
        <h1 className="title">Vendor Not Found</h1>
        <div className="card">
          <div className="help">{error || "The vendor you're looking for does not exist."}</div>
        </div>
      </div>
    )
  }

  async function handleSubmit(values) {
    try {
      await updateVendor(id, values)
      notifySuccess('Vendor updated successfully')
      nav('/vendors')
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to update vendor'
      notifyError(msg)
      throw e
    }
  }

  return (
    <div className="app">
      <h1 className="title">Edit Vendor</h1>
      <ContactForm initialValues={vendor} onSubmit={handleSubmit} submitLabel="Update" />
    </div>
  )
}
