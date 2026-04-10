import { useEffect, useRef, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import EquipmentDetailsPage from './pages/EquipmentDetailsPage'
import EquipmentListPage from './pages/EquipmentListPage'
import LoginPage from './pages/LoginPage'
import MyCheckoutsPage from './pages/MyCheckoutsPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'
import { REGISTRATION_ENABLED } from './config/runtime'

interface AuthPageRouteProps {
  children: ReactNode
}

function AuthPageRoute({ children }: AuthPageRouteProps) {
  const { isAuthenticated, logout } = useAuth()
  const wasAuthenticatedOnEntry = useRef(isAuthenticated)

  useEffect(() => {
    if (wasAuthenticatedOnEntry.current) {
      logout()
    }
  }, [logout])

  if (wasAuthenticatedOnEntry.current && isAuthenticated) {
    return null
  }

  return children
}

function AppNotice() {
  const location = useLocation()
  const { language } = useLanguage()
  const reason = new URLSearchParams(location.search).get('reason')

  if (reason !== 'forbidden') {
    return null
  }

  return (
    <p className="form-error">
      {language === 'en'
        ? 'You do not have permission to access that action or page.'
        : 'Nincs jogosultságod az adott oldal vagy művelet eléréséhez.'}
    </p>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  function renderFallbackRoute() {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />
    }

    return <NotFoundPage />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <EquipmentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipment/:id"
        element={
          <ProtectedRoute>
            <EquipmentDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-checkouts"
        element={
          <ProtectedRoute>
            <MyCheckoutsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <AuthPageRoute>
            <LoginPage />
          </AuthPageRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthPageRoute>
            {REGISTRATION_ENABLED ? <RegisterPage /> : <Navigate to="/" replace />}
          </AuthPageRoute>
        }
      />
      <Route path="*" element={renderFallbackRoute()} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="app-shell__glow app-shell__glow--left" />
        <div className="app-shell__glow app-shell__glow--right" />

        <Navbar />

        <main className="app">
          <AppNotice />
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
