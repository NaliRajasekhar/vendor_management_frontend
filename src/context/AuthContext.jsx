import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, loginApi } from '../api/auth.js'
import { clearSession, getTokenExpiration, readSession, writeSession } from '../lib/session.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())
  const user = session?.user || null

  // Remove any legacy auth cache
  useEffect(() => {
    try {
      window.localStorage.removeItem('auth:user')
    } catch {}
  }, [])

  useEffect(() => {
    if (session) writeSession(session)
    else clearSession()
  }, [session])

  useEffect(() => {
    if (!session?.expiresAt) return
    const remaining = session.expiresAt - Date.now()
    if (remaining <= 0) {
      setSession(null)
      return
    }
    const timer = setTimeout(() => setSession(null), remaining)
    return () => clearTimeout(timer)
  }, [session?.expiresAt])

  useEffect(() => {
    let ignore = false
    async function hydrate() {
      if (!session?.token) return
      try {
        const { user: refreshed } = await fetchCurrentUser()
        if (!ignore && refreshed) {
          setSession(current => current ? { ...current, user: refreshed } : current)
        }
      } catch {
        if (!ignore) setSession(null)
      }
    }
    hydrate()
    return () => { ignore = true }
  }, [session?.token])

  const login = useCallback(async (email, password) => {
    if (!email || !password) throw new Error('Email and password required')
    const data = await loginApi(email, password)
    const expiresAt = getTokenExpiration(data.token)
    const nextSession = { token: data.token, user: data.user, expiresAt }
    writeSession(nextSession)
    setSession(nextSession)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const hasRole = useCallback((...roles) => {
    if (!user) return false
    const allowed = roles.flat().filter(Boolean)
    if (allowed.length === 0) return true
    return allowed.includes(user.role)
  }, [user])

  const value = useMemo(() => ({
    user,
    token: session?.token || null,
    expiresAt: session?.expiresAt || null,
    login,
    logout,
    hasRole,
    isAuthenticated: Boolean(session?.token && user)
  }), [session, user, login, logout, hasRole])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
