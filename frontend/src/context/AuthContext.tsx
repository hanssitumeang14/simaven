import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { authApi, type LoginInput, type RegisterInput, type RegisterVendorInput } from '@/api/auth'
import { ApiRequestError } from '@/lib/api-client'
import { authToken } from '@/lib/auth-token'
import type { User } from '@/types/user'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  registerVendor: (input: RegisterVendorInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authToken.get()) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch((error) => {
        if (error instanceof ApiRequestError && error.status === 401) authToken.clear()
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function login(input: LoginInput) {
    const res = await authApi.login(input)
    authToken.set(res.access_token)
    setUser(res.user)
  }

  async function register(input: RegisterInput) {
    const res = await authApi.register(input)
    authToken.set(res.access_token)
    setUser(res.user)
  }

  async function registerVendor(input: RegisterVendorInput) {
    const res = await authApi.registerVendor(input)
    authToken.set(res.access_token)
    setUser(res.user)
  }

  function logout() {
    authToken.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, registerVendor, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
