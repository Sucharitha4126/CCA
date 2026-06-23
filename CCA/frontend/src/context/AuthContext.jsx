import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('sentinel_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/api/users/me')
        setUser(data)
      } catch {
        localStorage.removeItem('sentinel_token')
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [token])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('sentinel_token', data.access_token)
    setToken(data.access_token)
    const profile = await api.get('/api/users/me', { headers: { Authorization: `Bearer ${data.access_token}` } })
    setUser(profile.data)
    return data
  }

  const register = async (payload) => {
    console.log('[register] submitting banking signup', { email: payload.email, account_number: payload.account_number })
    const { data } = await api.post('/api/auth/register', payload)
    localStorage.setItem('sentinel_token', data.access_token)
    setToken(data.access_token)
    const profile = await api.get('/api/users/me', { headers: { Authorization: `Bearer ${data.access_token}` } })
    setUser(profile.data)
    console.log('[register] account created', { user_id: profile.data.id, email: profile.data.email })
    return data
  }

  const logout = () => {
    localStorage.removeItem('sentinel_token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({ token, user, loading, login, register, logout, setUser }), [token, user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
