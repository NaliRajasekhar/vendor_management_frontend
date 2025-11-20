// const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
import { apiBase as base } from './base.js'
import { authHeader } from '../lib/session.js'


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
  const res = await fetch(`${base}/api/vendors`, { headers: authHeader() })
  const data = await handle(res)
  return activeOnly ? data.filter(v => v.active !== false) : data
}

export async function getVendor(id) {
  const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}`, { headers: authHeader() })
  return handle(res)
}

export async function createVendor(payload) {
  const res = await fetch(`${base}/api/vendors`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return handle(res)
}

export async function updateVendor(id, patch) {
  const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  return handle(res)
}

export async function deleteVendor(id) {
  const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeader()
  })
  if (res.status === 204) return true
  await handle(res)
  return true
}

// Check if a vendor email is unique. Backend should return JSON { unique: boolean }
export async function checkVendorEmailUnique(email, { excludeId } = {}) {
  const url = new URL(`${base}/api/vendors/check-email`)
  url.searchParams.set('email', String(email || ''))
  if (excludeId) url.searchParams.set('excludeId', String(excludeId))
  const res = await fetch(url.toString(), { headers: authHeader() })
  const data = await handle(res)
  // Fallback: if server returned nothing, assume not unique to be safe
  return Boolean(data && data.unique === true)
}
