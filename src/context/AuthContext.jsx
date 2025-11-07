import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginApi } from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('auth:user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem('auth:user', JSON.stringify(user))
    else localStorage.removeItem('auth:user')
  }, [user])

  const login = async (email, password) => {
    if (!email || !password) throw new Error('Email and password required')
    const data = await loginApi(email, password)
    setUser({ email: data.email })
  }

  const logout = () => setUser(null)

  const value = useMemo(() => ({ user, login, logout, isAuthenticated: !!user }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
