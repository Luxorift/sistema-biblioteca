import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getPerfil, signInWithPassword, signOut as signOutRequest } from '../services/supabase/auth'
import { supabase } from '../services/supabase/client'

type Rol = 'Administrador' | 'Bibliotecario'
type Perfil = { id: string; nombre: string; rol: Rol }
type AuthContextValue = {
  perfil: Perfil | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<Perfil>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function loadPerfil(userId: string) {
  return getPerfil(userId) as Promise<Perfil>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user && isMounted) {
        try {
          setPerfil(await loadPerfil(session.user.id))
        } catch {
          setPerfil(null)
        }
      }
      if (isMounted) setIsLoading(false)
    }

    restoreSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setPerfil(null)
        setIsLoading(false)
        return
      }
      try {
        setPerfil(await loadPerfil(session.user.id))
      } catch {
        setPerfil(null)
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    perfil,
    isLoading,
    async signIn(email, password) {
      const user = await signInWithPassword(email, password)
      const nextPerfil = await loadPerfil(user.id)
      setPerfil(nextPerfil)
      return nextPerfil
    },
    async signOut() {
      await signOutRequest()
      setPerfil(null)
    },
  }), [perfil, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return context
}
