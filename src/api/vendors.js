// const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
import { apiBase as base } from './base.js'


async function handle(res) {
  if (!res.ok) {
    try {
      const data = await res.json()
      const msg = data?.message || `Request failed with ${res.status}`
      throw new Error(msg)
    } catch {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed with ${res.status}`)
    }
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return null
}

export async function listVendors({ activeOnly = true } = {}) {
  const res = await fetch(`${base}/api/vendors`)
  const data = await handle(res)
  return activeOnly ? data.filter(v => v.active !== false) : data
}

export async function getVendor(id) {
  const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}`)
  return handle(res)
}

export async function createVendor(payload) {
  const res = await fetch(`${base}/api/vendors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return handle(res)
}

export async function updateVendor(id, patch) {
  const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  return handle(res)
}

export async function deleteVendor(id) {
  const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (res.status === 204) return true
  await handle(res)
  return true
}
