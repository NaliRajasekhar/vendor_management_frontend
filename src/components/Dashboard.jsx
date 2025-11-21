import { useEffect, useState } from 'react'
import { getDashboardSummary } from '../api/dashboard.js'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({ vendors: 0, clients: 0, msa: 0, activeVendors: 0, inactiveVendors: 0 })

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getDashboardSummary()
        if (active) setData(res || { vendors: 0, clients: 0, msa: 0, activeVendors: 0, inactiveVendors: 0 })
      } catch (e) {
        if (active) setError(e?.message || 'Failed to load dashboard')
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [])

  const cards = [
    { value: data.vendors, label: 'Total Vendors' },
    { value: data.activeVendors, label: 'Active Vendors' },
    { value: data.inactiveVendors, label: 'Inactive Vendors' },
    { value: data.clients, label: 'Total Clients' },
    { value: data.msa, label: 'Total MSA' },
  ]

  return (
    <div className="app">
      <h1 className="title">Dashboard</h1>
      {error && <div className="alert error">{error}</div>}
      <div className="dash-cards">
        {cards.map((c, i) => (
          <div key={i} className="dash-card">
            <div className="dash-value">{loading ? '—' : c.value}</div>
            <div className="dash-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

