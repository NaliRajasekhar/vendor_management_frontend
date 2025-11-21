export const SESSION_STORAGE_KEY = 'auth:session'

function getLocalStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function decodeBase64Url(value) {
  if (!value) return ''
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
    return globalThis.atob(padded)
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8')
  }
  return ''
}

export function decodeJwtPayload(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const decoded = decodeBase64Url(parts[1])
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function getTokenExpiration(token) {
  const payload = decodeJwtPayload(token)
  return payload?.exp ? payload.exp * 1000 : null
}

export function readSession() {
  const storage = getLocalStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.expiresAt && parsed.expiresAt <= Date.now()) {
      storage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeSession(session) {
  const storage = getLocalStorage()
  if (!storage) return
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  const storage = getLocalStorage()
  if (!storage) return
  storage.removeItem(SESSION_STORAGE_KEY)
}

export function getAuthToken() {
  const session = readSession()
  return session?.token || null
}

export function authHeader(additional = {}) {
  const token = getAuthToken()
  if (!token) return { ...(additional || {}) }
  return { ...(additional || {}), Authorization: `Bearer ${token}` }
}

