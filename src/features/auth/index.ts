// Puerta de entrada pública de la feature "auth".
// Otras partes de la app importan desde "@/features/auth", no desde sus archivos internos.
export { AuthProvider } from './AuthProvider'
export { LoginPage } from './LoginPage'
export { RequireAuth } from './RequireAuth'
export { etiquetaRol } from './types'
export type { Perfil, Rol } from './types'
export { useAuth } from './useAuth'
