import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import EquipmentDetailsPage from './pages/EquipmentDetailsPage'
import EquipmentListPage from './pages/EquipmentListPage'
import LoginPage from './pages/LoginPage'
import MyCheckoutsPage from './pages/MyCheckoutsPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="app-shell__glow app-shell__glow--left" />
        <div className="app-shell__glow app-shell__glow--right" />

        <Navbar />

        <main className="app">
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
