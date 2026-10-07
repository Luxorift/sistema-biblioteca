import { supabase } from '@/lib/supabase'
import type { DatosActualizarPersona, DatosPersona, Persona, TipoPersona } from './types'

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
  prestamosActivos = 0,
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
    prestamosActivos,
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
  const [personasConsulta, tiposConsulta, prestamosConsulta] = await Promise.all([
    supabase
      .from('personas')
      .select(
        'id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni, correo, activo',
      )
      .order('apellido_paterno')
      .limit(100),
    supabase.from('tipos_persona').select('id, nombre'),
    supabase
      .from('prestamos')
      .select('persona_id')
      .is('fecha_devolucion', null),
  ])
  if (personasConsulta.error) throw personasConsulta.error
  if (tiposConsulta.error) throw tiposConsulta.error
  if (prestamosConsulta.error) throw prestamosConsulta.error

  const tiposPorId = new Map(
    (tiposConsulta.data ?? []).map((tipo) => [tipo.id, tipo.nombre]),
  )
  const prestamosPorPersona = new Map<number, number>()
  for (const prestamo of (prestamosConsulta.data ?? []) as { persona_id: number }[]) {
    prestamosPorPersona.set(
      prestamo.persona_id,
      (prestamosPorPersona.get(prestamo.persona_id) ?? 0) + 1,
    )
  }

  return ((personasConsulta.data ?? []) as FilaPersona[]).map((fila) =>
    convertirPersona(fila, tiposPorId, prestamosPorPersona.get(fila.id) ?? 0),
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

  return convertirPersona(data as FilaPersona, new Map([[tipo.id, tipo.nombre]]), 0)
}

export class ErrorPersonaConPrestamosActivos extends Error {
  constructor(readonly prestamosPendientes: number) {
    super('PERSONA_CON_PRESTAMOS_ACTIVOS')
    this.name = 'ErrorPersonaConPrestamosActivos'
  }
}

export async function actualizarPersona(
  personaId: number,
  datos: DatosActualizarPersona,
): Promise<Persona> {
  // Regla de seguridad y consistencia: si se intenta desactivar, verificar préstamos abiertos
  if (!datos.activo) {
    const { count, error: errorPrestamos } = await supabase
      .from('prestamos')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', personaId)
      .is('fecha_devolucion', null)
    if (errorPrestamos) throw errorPrestamos
    if ((count ?? 0) > 0) {
      throw new ErrorPersonaConPrestamosActivos(count ?? 0)
    }
  }

  // Notar que el DNI no se incluye en el update para no permitir modificar el identificador sensible
  const { data, error } = await supabase
    .from('personas')
    .update({
      tipo_persona_id: datos.tipoPersonaId,
      nombres: datos.nombres.trim(),
      apellido_paterno: datos.apellidoPaterno.trim(),
      apellido_materno: datos.apellidoMaterno.trim() || null,
      correo: datos.correo.trim() || null,
      activo: datos.activo,
    })
    .eq('id', personaId)
    .select(
      'id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni, correo, activo',
    )
    .single()
  if (error) throw error

  const [tipoConsulta, prestamosConsulta] = await Promise.all([
    supabase
      .from('tipos_persona')
      .select('id, nombre')
      .eq('id', datos.tipoPersonaId)
      .single(),
    supabase
      .from('prestamos')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', personaId)
      .is('fecha_devolucion', null),
  ])
  if (tipoConsulta.error) throw tipoConsulta.error

  return convertirPersona(
    data as FilaPersona,
    new Map([[tipoConsulta.data.id, tipoConsulta.data.nombre]]),
    prestamosConsulta.count ?? 0,
  )
}
