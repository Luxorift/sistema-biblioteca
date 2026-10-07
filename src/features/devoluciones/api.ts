import { supabase } from '@/lib/supabase'
import type { DevolucionConfirmada, PrestamoPendiente } from './types'

export async function obtenerPrestamosPendientes(): Promise<PrestamoPendiente[]> {
  const [prestamos, ejemplares, materiales, personas, tipos] = await Promise.all([
    supabase
      .from('prestamos')
      .select('id, ejemplar_id, persona_id, fecha_prestamo, fecha_limite')
      .is('fecha_devolucion', null)
      .order('fecha_prestamo'),
    supabase.from('ejemplares').select('id, codigo, material_id'),
    supabase.from('materiales').select('id, titulo'),
    supabase
      .from('personas')
      .select('id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni'),
    supabase.from('tipos_persona').select('id, nombre'),
  ])
  for (const consulta of [prestamos, ejemplares, materiales, personas, tipos])
    if (consulta.error) throw consulta.error
  const ejemplarPorId = new Map(
    (
      (ejemplares.data ?? []) as { id: number; codigo: string; material_id: number }[]
    ).map((fila) => [fila.id, fila]),
  )
  const tituloPorId = new Map(
    ((materiales.data ?? []) as { id: number; titulo: string }[]).map((fila) => [
      fila.id,
      fila.titulo,
    ]),
  )
  const personaPorId = new Map(
    (
      (personas.data ?? []) as {
        id: number
        tipo_persona_id: number
        nombres: string
        apellido_paterno: string
        apellido_materno: string | null
        dni: string
      }[]
    ).map((fila) => [fila.id, fila]),
  )
  const tipoPorId = new Map(
    ((tipos.data ?? []) as { id: number; nombre: string }[]).map((fila) => [
      fila.id,
      fila.nombre,
    ]),
  )
  return (
    (prestamos.data ?? []) as {
      id: number
      ejemplar_id: number
      persona_id: number
      fecha_prestamo: string
      fecha_limite: string | null
    }[]
  ).flatMap((fila) => {
    const ejemplar = ejemplarPorId.get(fila.ejemplar_id)
    const persona = personaPorId.get(fila.persona_id)
    if (!ejemplar || !persona) return []
    return [
      {
        id: fila.id,
        codigo: ejemplar.codigo,
        titulo: tituloPorId.get(ejemplar.material_id) ?? 'Material sin título',
        persona:
          `${persona.apellido_paterno} ${persona.apellido_materno ?? ''}, ${persona.nombres}`.replace(
            /\s+,/,
            ',',
          ),
        dni: persona.dni,
        tipoPersona: tipoPorId.get(persona.tipo_persona_id) ?? 'Sin tipo',
        fechaPrestamo: fila.fecha_prestamo.slice(0, 10),
        fechaLimite: fila.fecha_limite,
      },
    ]
  })
}

export async function registrarDevolucion(
  prestamo: PrestamoPendiente,
  fechaDevolucion: string,
): Promise<DevolucionConfirmada> {
  const { error } = await supabase
    .from('prestamos')
    .update({ fecha_devolucion: `${fechaDevolucion}T12:00:00` })
    .eq('id', prestamo.id)
    .is('fecha_devolucion', null)
  if (error) throw error
  return {
    codigo: prestamo.codigo,
    titulo: prestamo.titulo,
    persona: prestamo.persona,
    fechaDevolucion,
  }
}
