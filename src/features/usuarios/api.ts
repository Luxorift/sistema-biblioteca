import { supabase } from '@/lib/supabase'
import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
  UsuarioSistema,
} from './types'

export async function obtenerUsuarios(): Promise<UsuarioSistema[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, activo, created_at')
    .order('nombre', { ascending: true })

  if (error) {
    throw new Error('No se pudieron obtener los usuarios del sistema: ' + error.message)
  }

  return (data ?? []) as UsuarioSistema[]
}

export async function crearUsuario(input: CrearUsuarioInput): Promise<UsuarioSistema> {
  const { data, error } = await supabase.functions.invoke<{
    ok: boolean
    usuario: UsuarioSistema
    error?: string
  }>('crear-usuario', {
    body: input,
  })

  if (error) {
    // Si la Edge function devolvió un error HTTP con mensaje personalizado en el body
    let mensaje = error.message
    try {
      if ('context' in error && error.context) {
        const respuesta = error.context as Response
        const cuerpo = await respuesta.json()
        if (cuerpo && typeof cuerpo === 'object' && 'error' in cuerpo) {
          mensaje = String(cuerpo.error)
        }
      }
    } catch {
      // Si no pudo parsear el contexto, mantenemos el mensaje base
    }

    if (mensaje.includes('FunctionsFetchError') || mensaje.includes('Failed to send')) {
      throw new Error(
        'No se pudo conectar con la Edge Function "crear-usuario". Asegúrate de haberla desplegado en Supabase ejecutando: supabase functions deploy crear-usuario',
      )
    }

    throw new Error(mensaje || 'Ocurrió un error al intentar crear el usuario.')
  }

  if (!data?.ok || !data?.usuario) {
    throw new Error(data?.error || 'No se recibió la confirmación del nuevo usuario.')
  }

  return data.usuario
}

export async function actualizarUsuario(
  id: string,
  input: ActualizarUsuarioInput,
): Promise<UsuarioSistema> {
  const { data, error } = await supabase
    .from('perfiles')
    .update(input)
    .eq('id', id)
    .select('id, nombre, rol, activo, created_at')
    .single()

  if (error) {
    throw new Error('No se pudo actualizar el usuario: ' + error.message)
  }

  return data as UsuarioSistema
}

export async function cambiarEstadoUsuario(
  id: string,
  activo: boolean,
): Promise<UsuarioSistema> {
  const { data, error } = await supabase
    .from('perfiles')
    .update({ activo })
    .eq('id', id)
    .select('id, nombre, rol, activo, created_at')
    .single()

  if (error) {
    throw new Error(
      `No se pudo ${activo ? 'activar' : 'desactivar'} el usuario: ${error.message}`,
    )
  }

  return data as UsuarioSistema
}
