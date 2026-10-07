import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { cerrarSesion, obtenerPerfil } from './api'
import { AuthContext, type AuthContextValue } from './AuthContext'

// Mantiene la sesión de Supabase y el perfil (rol) del usuario disponibles para toda la app.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [verificandoSesion, setVerificandoSesion] = useState(true)

  useEffect(() => {
    // Sesión guardada de visitas anteriores (el navegador la conserva).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setVerificandoSesion(false)
    })

    // Se dispara al iniciar o cerrar sesión. Aquí solo se guarda el estado.
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const usuarioId = session?.user.id
  const consultaPerfil = useQuery({
    queryKey: ['perfil', usuarioId],
    queryFn: () => obtenerPerfil(usuarioId!),
    enabled: Boolean(usuarioId),
  })

  const valor = useMemo<AuthContextValue>(
    () => ({
      session,
      perfil: consultaPerfil.data ?? null,
      cargando: verificandoSesion || consultaPerfil.isLoading,
      salir: async () => {
        await cerrarSesion()
        queryClient.clear() // no dejar datos del usuario anterior en memoria
      },
    }),
    [
      session,
      consultaPerfil.data,
      consultaPerfil.isLoading,
      verificandoSesion,
      queryClient,
    ],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
