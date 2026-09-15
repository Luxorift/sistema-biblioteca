import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRedirect } from './components/RoleRedirect'
import { AuthProvider } from './hooks/useAuth'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { Login } from './pages/Login'
import { RecuperarPassword } from './pages/RecuperarPassword'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-contrasena" element={<RecuperarPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Bibliotecario']} />}>
              <Route index element={<DashboardPage />} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Administrador']} />}>
              <Route index element={<AdminPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
