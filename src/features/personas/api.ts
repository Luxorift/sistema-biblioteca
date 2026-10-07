import { supabase } from '@/lib/supabase'
import type { DatosPersona, Persona, TipoPersona } from './types'

export async function obtenerTiposPersona(): Promise<TipoPersona[]> {
  const { data, error } = await supabase
    .from('tipos_persona')
    .select('id, nombre')
    .order('nombre')
  if (error) throw error
  return (data ?? []) as TipoPersona[]
}

export async function crearTipoPersona(nombre: string): Promise<TipoPersona> {
  const { data, error } = await supabase
    .from('tipos_persona')
    .insert({ nombre: nombre.trim() })
    .select('id, nombre')
    .single()
  if (error) throw error
  return data as TipoPersona
}

export async function obtenerPersonas(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from('personas')
    .select(
      'id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni, correo, activo, tipos_persona(nombre)',
    )
    .order('apellido_paterno')
    .limit(100)
  if (error) throw error
  return (
    (data ?? []) as unknown as {
      id: number
      tipo_persona_id: number
      nombres: string
      apellido_paterno: string
      apellido_materno: string | null
      dni: string
      correo: string | null
      activo: boolean
      tipos_persona: { nombre: string }[]
    }[]
  ).map((fila) => ({
    id: fila.id,
    tipoPersonaId: fila.tipo_persona_id,
    tipoPersona: fila.tipos_persona[0]?.nombre ?? 'Sin tipo',
    nombres: fila.nombres,
    apellidoPaterno: fila.apellido_paterno,
    apellidoMaterno: fila.apellido_materno,
    dni: fila.dni,
    correo: fila.correo,
    activo: fila.activo,
  }))
}

export async function crearPersona(datos: DatosPersona): Promise<Persona> {
  const { data, error } = await supabase
    .from('personas')
    .insert({
      tipo_persona_id: datos.tipoPersonaId,
      nombres: datos.nombres.trim(),
      apellido_paterno: datos.apellidoPaterno.trim(),
      apellido_materno: datos.apellidoMaterno.trim() || null,
      dni: datos.dni.trim(),
      correo: datos.correo.trim() || null,
    })
    .select(
      'id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni, correo, activo, tipos_persona(nombre)',
    )
    .single()
  if (error) throw error
  const fila = data as unknown as {
    id: number
    tipo_persona_id: number
    nombres: string
    apellido_paterno: string
    apellido_materno: string | null
    dni: string
    correo: string | null
    activo: boolean
    tipos_persona: { nombre: string }[]
  }
  return {
    id: fila.id,
    tipoPersonaId: fila.tipo_persona_id,
    tipoPersona: fila.tipos_persona[0]?.nombre ?? 'Sin tipo',
    nombres: fila.nombres,
    apellidoPaterno: fila.apellido_paterno,
    apellidoMaterno: fila.apellido_materno,
    dni: fila.dni,
    correo: fila.correo,
    activo: fila.activo,
  }
}
