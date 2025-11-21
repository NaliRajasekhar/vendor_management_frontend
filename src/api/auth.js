import axios from 'axios'
// const base = import.meta.env.VITE_API_BASE_URL
import { apiBase as base } from './base.js'
import { authHeader } from '../lib/session.js'

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

export async function fetchCurrentUser() {
  const { data } = await axios.get(`${base}/api/auth/me`, {
    headers: authHeader()
  })
  return data
}

