// by Raunak
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../api'
import { getToken, setToken, clearToken, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(!!getToken())

  const logout = useCallback(() => { clearToken(); setUser(null) }, [])

  // Token 30 min me expire hota hai (backend setting) - 401 aate hi login page par bhej do
  useEffect(() => { setUnauthorizedHandler(logout) }, [logout])

  useEffect(() => {
    if (!getToken()) return
    authApi.me().then(setUser).catch(() => clearToken()).finally(() => setBooting(false))
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    setToken(res.access_token)
    setUser(await authApi.me())
  }

  const register = async (name, email, password) => {
    await authApi.register(name, email, password)
    await login(email, password)
  }

  return <AuthContext.Provider value={{ user, booting, login, register, logout }}>{children}</AuthContext.Provider>
}
