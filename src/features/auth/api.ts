// Todas las llamadas a Supabase de la autenticación viven aquí.
// Los componentes NO llaman a supabase directamente: usan estas funciones.
import { supabase } from '@/lib/supabase'
import type { Perfil } from './types'

export async function iniciarSesion(correo: string, contrasena: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  })
  if (error) throw error
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Devuelve null si el usuario existe en Supabase Auth pero aún no tiene fila en "perfiles".
export async function obtenerPerfil(usuarioId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, activo')
    .eq('id', usuarioId)
    .maybeSingle()
  if (error) throw error
  return data as Perfil | null
}
