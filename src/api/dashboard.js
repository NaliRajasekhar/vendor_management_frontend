import axios from 'axios'
const base = import.meta.env.VITE_API_BASE_URL || ''

export async function getDashboardSummary() {
  const { data } = await axios.get(`${base}/api/dashboard/summary`)
  return data
}

