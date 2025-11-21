// const base = import.meta.env.VITE_API_BASE_URL || 'http://10.0.12.127:5100'
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
  // If a new MSV file is present, use multipart endpoint
  if (patch && patch.msvFile instanceof File) {
    const form = new FormData()
    const keys = ['vendor','implementation','client','isPrimary','name','phone','email','designation','department','state','city','msaSignedDate']
    for (const k of keys) {
      if (typeof patch[k] !== 'undefined') form.append(k, String(patch[k]))
    }
    form.append('msv', patch.msvFile)
    const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}/with-file`, {
      method: 'PUT',
      headers: authHeader(),
      body: form
    })
    return handle(res)
  }

  const payload = { ...patch }
  delete payload.msvFile

  const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
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

function extractFilename(disposition) {
  if (!disposition) return 'msa-file'
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
  if (match && match[1]) return match[1].replace(/['"]/g, '')
  return 'msa-file'
}

// Download MSA file with auth header (anchors cannot send Authorization)
export async function downloadVendorMsa(id) {
  const res = await fetch(`${base}/api/vendors/${encodeURIComponent(id)}/msv`, {
    headers: authHeader()
  })
  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized to view MSA file. Please sign in again.')
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch MSA file (status ${res.status})`)
  }
  const blob = await res.blob()
  const filename = extractFilename(res.headers.get('content-disposition'))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
