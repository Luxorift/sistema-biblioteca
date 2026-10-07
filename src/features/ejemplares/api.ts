import { supabase } from '@/lib/supabase'
import type {
  DatosActualizarEjemplar,
  EjemplarDetallado,
  EstadoEjemplar,
  PrestamoActivoResumen,
} from './types'

export class ErrorEjemplarPrestadoNoDirecto extends Error {
  constructor() {
    super('EJEMPLAR_PRESTADO_REQUIERE_DEVOLUCION')
    this.name = 'ErrorEjemplarPrestadoNoDirecto'
  }
}

export async function obtenerEjemplaresDetallados(): Promise<EjemplarDetallado[]> {
  const [
    ejemplaresRes,
    materialesRes,
    ubicacionesRes,
    tiposRes,
    relacionesRes,
    autoresRes,
    prestamosRes,
    personasRes,
    tiposPersonaRes,
  ] = await Promise.all([
    supabase
      .from('ejemplares')
      .select('id, codigo, material_id, ubicacion_id, estado, observaciones')
      .order('codigo'),
    supabase
      .from('materiales')
      .select('id, titulo, tipo_material_id')
      .order('titulo'),
    supabase.from('ubicaciones').select('id, estante, nivel'),
    supabase.from('tipos_material').select('id, nombre'),
    supabase.from('material_autores').select('material_id, autor_id, orden'),
    supabase.from('autores').select('id, nombre'),
    supabase
      .from('prestamos')
      .select('id, ejemplar_id, persona_id, fecha_prestamo, fecha_limite')
      .is('fecha_devolucion', null),
    supabase
      .from('personas')
      .select('id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni'),
    supabase.from('tipos_persona').select('id, nombre'),
  ])

  if (ejemplaresRes.error) throw ejemplaresRes.error
  if (materialesRes.error) throw materialesRes.error
  if (ubicacionesRes.error) throw ubicacionesRes.error
  if (tiposRes.error) throw tiposRes.error
  if (relacionesRes.error) throw relacionesRes.error
  if (autoresRes.error) throw autoresRes.error
  if (prestamosRes.error) throw prestamosRes.error
  if (personasRes.error) throw personasRes.error
  if (tiposPersonaRes.error) throw tiposPersonaRes.error

  const tiposPorId = new Map(
    (tiposRes.data ?? []).map((t) => [t.id, t.nombre]),
  )
  const ubicacionesPorId = new Map(
    (ubicacionesRes.data ?? []).map((u) => [
      u.id,
      `Estante ${u.estante}, Nivel ${u.nivel}`,
    ]),
  )
  const autoresPorId = new Map(
    (autoresRes.data ?? []).map((a) => [a.id, a.nombre]),
  )
  const tiposPersonaPorId = new Map(
    (tiposPersonaRes.data ?? []).map((tp) => [tp.id, tp.nombre]),
  )

  const personasPorId = new Map(
    (personasRes.data ?? []).map((p) => [
      p.id,
      {
        nombreCompleto: `${p.apellido_paterno} ${p.apellido_materno ?? ''}, ${p.nombres}`.replace(
          /\s+,/,
          ',',
        ),
        dni: p.dni,
        tipo: tiposPersonaPorId.get(p.tipo_persona_id) ?? 'Sin tipo',
      },
    ]),
  )

  const prestamoActivoPorEjemplar = new Map<number, PrestamoActivoResumen>()
  for (const pr of prestamosRes.data ?? []) {
    const persona = personasPorId.get(pr.persona_id)
    if (persona) {
      prestamoActivoPorEjemplar.set(pr.ejemplar_id, {
        prestamoId: pr.id,
        persona: persona.nombreCompleto,
        dni: persona.dni,
        tipoPersona: persona.tipo,
        fechaPrestamo: pr.fecha_prestamo.slice(0, 10),
        fechaLimite: pr.fecha_limite,
      })
    }
  }

  const autoresPorMaterial = new Map<number, string[]>()
  for (const rel of relacionesRes.data ?? []) {
    const autor = autoresPorId.get(rel.autor_id)
    if (autor) {
      const lista = autoresPorMaterial.get(rel.material_id) ?? []
      lista.push(autor)
      autoresPorMaterial.set(rel.material_id, lista)
    }
  }

  const materialesPorId = new Map(
    (materialesRes.data ?? []).map((m) => [
      m.id,
      {
        titulo: m.titulo,
        tipo: tiposPorId.get(m.tipo_material_id) ?? 'Sin tipo',
        autores: autoresPorMaterial.get(m.id) ?? [],
      },
    ]),
  )

  return (ejemplaresRes.data ?? []).flatMap((fila) => {
    const mat = materialesPorId.get(fila.material_id)
    if (!mat) return []
    return [
      {
        id: fila.id,
        codigo: fila.codigo,
        materialId: fila.material_id,
        titulo: mat.titulo,
        autores: mat.autores,
        tipoMaterial: mat.tipo,
        ubicacionId: fila.ubicacion_id,
        ubicacion: fila.ubicacion_id
          ? (ubicacionesPorId.get(fila.ubicacion_id) ?? null)
          : null,
        estado: fila.estado as EstadoEjemplar,
        observaciones: fila.observaciones,
        prestamoActivo: prestamoActivoPorEjemplar.get(fila.id) ?? null,
      },
    ]
  })
}

export async function actualizarEstadoEjemplar(
  ejemplarId: number,
  datos: DatosActualizarEjemplar,
): Promise<void> {
  // Comprobar si el ejemplar está actualmente prestado
  const { data: actual, error: errorActual } = await supabase
    .from('ejemplares')
    .select('estado')
    .eq('id', ejemplarId)
    .single()
  if (errorActual) throw errorActual

  if (actual.estado === 'prestado' && datos.estado === 'disponible') {
    throw new ErrorEjemplarPrestadoNoDirecto()
  }

  const { error } = await supabase
    .from('ejemplares')
    .update({
      estado: datos.estado,
      ubicacion_id: datos.ubicacionId,
      observaciones: datos.observaciones.trim() || null,
    })
    .eq('id', ejemplarId)

  if (error) throw error
}
