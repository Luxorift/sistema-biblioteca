import type { Session } from '@supabase/supabase-js'
import { createContext } from 'react'
import type { Perfil } from './types'

export interface AuthContextValue {
  session: Session | null
  /** Perfil (nombre y rol) del usuario con sesión; null si no tiene o no hay sesión. */
  perfil: Perfil | null
  /** true mientras se verifica la sesión y se carga el perfil. */
  cargando: boolean
  salir: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
