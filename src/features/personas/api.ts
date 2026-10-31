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

export interface FiltrosPersonas {
  buscar: string
  tipo: string
  estado: string
  correo: string
  pagina: number
}

export async function obtenerPersonas(
  filtros: FiltrosPersonas,
): Promise<{ personas: Persona[]; total: number }> {
  const { data, error } = await supabase.rpc('buscar_personas', {
    p_buscar: filtros.buscar.trim(),
    p_tipo: filtros.tipo ? Number(filtros.tipo) : null,
    p_activo: filtros.estado ? filtros.estado === 'activo' : null,
    p_correo: filtros.correo ? filtros.correo === 'con-correo' : null,
    p_pagina: filtros.pagina,
    p_tamano: 25,
  })
  if (error) throw error
  const resultado = data as {
    total: number
    personas: (FilaPersona & { tipo_persona: string; prestamos_activos: number })[]
  }
  return {
    total: resultado.total,
    personas: resultado.personas.map((fila) =>
      convertirPersona(
        fila,
        new Map([[fila.tipo_persona_id, fila.tipo_persona]]),
        fila.prestamos_activos,
      ),
    ),
  }
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
