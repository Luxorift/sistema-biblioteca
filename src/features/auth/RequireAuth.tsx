import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingScreen } from '@/components/feedback/LoadingScreen'
import { NoAccessPage } from './NoAccessPage'
import type { Rol } from './types'
import { useAuth } from './useAuth'

interface RequireAuthProps {
  /** Si se indica, solo esos roles pueden entrar. Ej: <RequireAuth roles={['admin']} /> */
  roles?: Rol[]
}

// Protege un grupo de rutas: exige sesión, perfil activo y (opcionalmente) un rol.
export function RequireAuth({ roles }: RequireAuthProps) {
  const { session, perfil, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <LoadingScreen />
  if (!session)
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  if (!perfil || !perfil.activo) return <NoAccessPage />
  if (roles && !roles.includes(perfil.rol)) return <Navigate to="/" replace />

  return <Outlet />
}
