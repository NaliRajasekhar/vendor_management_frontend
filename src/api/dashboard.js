import axios from 'axios'
// const base = import.meta.env.VITE_API_BASE_URL
import { apiBase as base } from './base.js'
import { authHeader } from '../lib/session.js'

export async function getDashboardSummary() {
  const { data } = await axios.get(`${base}/api/dashboard/summary`, {
    headers: authHeader()
  })
  return data
}

