import axios from 'axios'
// const base = import.meta.env.VITE_API_BASE_URL
import { apiBase as base } from './base.js'
import { authHeader } from '../lib/session.js'

export async function searchVendors(q = '', { limit = 50, offset = 0 } = {}) {
  const { data } = await axios.get(`${base}/api/search/vendors`, {
    params: { q, limit, offset },
    headers: authHeader()
  })
  return data
}

export async function searchClients(q = '', { limit = 50, offset = 0 } = {}) {
  const { data } = await axios.get(`${base}/api/search/clients`, {
    params: { q, limit, offset },
    headers: authHeader()
  })
  return data
}

export async function listVendorOptions() {
  const { data } = await axios.get(`${base}/api/search/vendor-options`, {
    headers: authHeader()
  })
  return data?.items || []
}

export async function getVendorClientsByVendor(vendor_id, { q = '', limit = 50, offset = 0 } = {}) {
  const { data } = await axios.get(`${base}/api/search/vendor-clients`, {
    params: { vendor_id, q, limit, offset },
    headers: authHeader()
  })
  return data
}

export async function listClientOptions(params = {}) {
  const { vendor_id } = params || {}
  const { data } = await axios.get(`${base}/api/search/client-options`, {
    params: { vendor_id },
    headers: authHeader()
  })
  return data?.items || []
}

export async function uploadVendorClientsCsv(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axios.post(`${base}/api/bulk/vendor-clients`, form, {
    headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
  return data
}

export async function getVendorsByClient(client_name, { q = '', limit = 50, offset = 0 } = {}) {
  const { data } = await axios.get(`${base}/api/search/client-vendors`, {
    params: { client_name, q, limit, offset },
    headers: authHeader()
  })
  return data
}

export async function searchGlobalVendorClients(q = '', { limit = 50, offset = 0 } = {}) {
  const { data } = await axios.get(`${base}/api/search/global`, {
    params: { q, limit, offset },
    headers: authHeader()
  })
  return data
}

