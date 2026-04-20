import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as loginRequest } from '../api/authApi'
import type { AuthUser, LoginRequest } from '../types/auth'
import { setForbiddenHandler, setUnauthorizedHandler } from '../api/axios'
import {
  getStoredUser,
  getToken,
  removeStoredUser,
  removeToken,
  setStoredUser,
  setToken,
} from '../utils/tokenStorage'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  updateUser: (nextUser: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setTokenState] = useState<string | null>(getToken())
  const [user, setUser] = useState<AuthUser | null>(getStoredUser())

  const clearSession = useCallback(() => {
    removeToken()
    removeStoredUser()

    setTokenState(null)
    setUser(null)
  }, [])

  async function login(data: LoginRequest) {
    const response = await loginRequest(data)

    setToken(response.token)
    setStoredUser(response.user)

    setTokenState(response.token)
    setUser(response.user)
  }

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const updateUser = useCallback((nextUser: AuthUser) => {
    setStoredUser(nextUser)
    setUser(nextUser)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()

      if (typeof window === 'undefined' || window.location.pathname === '/login') {
        return
      }

      window.location.replace('/login?reason=session-expired')
    })

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [clearSession])

  useEffect(() => {
    setForbiddenHandler(() => {
      if (typeof window === 'undefined') {
        return
      }

      window.location.replace('/?reason=forbidden')
    })

    return () => {
      setForbiddenHandler(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      logout,
      updateUser,
    }),
    [logout, token, updateUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
