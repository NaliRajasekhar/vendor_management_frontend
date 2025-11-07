import axios from 'axios'
const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export async function postContact(data) {
  try {
    // If an MSV file is present (File object), use multipart endpoint
    if (data && data.msvFile instanceof File) {
      const form = new FormData()
      // Append scalar fields
      const keys = ['vendor','implementation','client','isPrimary','name','phone','email','department','state','city','msaSignedDate']
      for (const k of keys) if (typeof data[k] !== 'undefined') form.append(k, String(data[k]))
      form.append('msv', data.msvFile)
      const res = await axios.post(`${base}/api/vendors/with-file`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data || {}
    }

    // Fallback to JSON if no file
    const res = await axios.post(`${base}/api/vendors`, data, {
      headers: { 'Content-Type': 'application/json' }
    })
    return res.data || {}
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Request failed'
    throw new Error(msg)
  }
}
