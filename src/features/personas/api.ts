import { supabase } from '@/lib/supabase'
import type { DatosPersona, Persona, TipoPersona } from './types'

type FilaPersona = {
  id: number
  tipo_persona_id: number
  nombres: string
  apellido_paterno: string
  apellido_materno: string | null
  dni: string
  correo: string | null
  activo: boolean
}

function convertirPersona(
  fila: FilaPersona,
  tiposPorId: Map<number, string>,
): Persona {
  return {
    id: fila.id,
    tipoPersonaId: fila.tipo_persona_id,
    tipoPersona: tiposPorId.get(fila.tipo_persona_id) ?? 'Sin tipo',
    nombres: fila.nombres,
    apellidoPaterno: fila.apellido_paterno,
    apellidoMaterno: fila.apellido_materno,
    dni: fila.dni,
    correo: fila.correo,
    activo: fila.activo,
  }
}

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
  const [personasConsulta, tiposConsulta] = await Promise.all([
    supabase
      .from('personas')
      .select(
        'id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni, correo, activo',
      )
      .order('apellido_paterno')
      .limit(100),
    supabase.from('tipos_persona').select('id, nombre'),
  ])
  if (personasConsulta.error) throw personasConsulta.error
  if (tiposConsulta.error) throw tiposConsulta.error

  const tiposPorId = new Map(
    (tiposConsulta.data ?? []).map((tipo) => [tipo.id, tipo.nombre]),
  )
  return ((personasConsulta.data ?? []) as FilaPersona[]).map((fila) =>
    convertirPersona(fila, tiposPorId),
  )
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
      'id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni, correo, activo',
    )
    .single()
  if (error) throw error
  const { data: tipo, error: errorTipo } = await supabase
    .from('tipos_persona')
    .select('id, nombre')
    .eq('id', datos.tipoPersonaId)
    .single()
  if (errorTipo) throw errorTipo

  return convertirPersona(data as FilaPersona, new Map([[tipo.id, tipo.nombre]]))
}
