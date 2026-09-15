import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type Props = { allowedRoles?: Array<'Administrador' | 'Bibliotecario'> }

export function ProtectedRoute({ allowedRoles }: Props) {
  const { perfil, isLoading } = useAuth()

  if (isLoading) return <p className="p-8 text-center" role="status">Cargando su sesión…</p>
  if (!perfil) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(perfil.rol)) {
    return <Navigate to={perfil.rol === 'Administrador' ? '/admin' : '/dashboard'} replace />
  }
  return <Outlet />
}
