import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function RoleRedirect() {
  const { perfil, isLoading } = useAuth()
  if (isLoading) return <p className="p-8 text-center" role="status">Cargando su sesión…</p>
  if (!perfil) return <Navigate to="/login" replace />
  return <Navigate to={perfil.rol === 'Administrador' ? '/admin' : '/dashboard'} replace />
}
