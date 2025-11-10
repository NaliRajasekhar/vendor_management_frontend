import axios from 'axios'
// const base = import.meta.env.VITE_API_BASE_URL
import { apiBase as base } from './base.js'

export async function loginApi(email, password) {
  try {
    const { data } = await axios.post(`${base}/api/auth/login`, { email, password }, {
      headers: { 'Content-Type': 'application/json' }
    })
    return data
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Login failed'
    throw new Error(msg)
  }
}

