import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// Hook para leer quién está conectado: const { perfil, salir } = useAuth()
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return contexto
}
