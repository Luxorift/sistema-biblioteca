import { supabase } from '@/lib/supabase'
import type {
  CopiaDisponible,
  DatosPrestamo,
  PersonaPrestataria,
  PrestamoConfirmado,
} from './types'

export async function obtenerCopiasDisponibles(): Promise<CopiaDisponible[]> {
  const [
    { data: ejemplares, error: errorEjemplares },
    { data: materiales, error: errorMateriales },
    { data: ubicaciones, error: errorUbicaciones },
  ] = await Promise.all([
    supabase
      .from('ejemplares')
      .select('id, codigo, material_id, ubicacion_id')
      .eq('estado', 'disponible')
      .order('codigo'),
    supabase.from('materiales').select('id, titulo'),
    supabase.from('ubicaciones').select('id, estante, nivel'),
  ])
  if (errorEjemplares) throw errorEjemplares
  if (errorMateriales) throw errorMateriales
  if (errorUbicaciones) throw errorUbicaciones
  const titulos = new Map(
    ((materiales ?? []) as { id: number; titulo: string }[]).map((fila) => [
      fila.id,
      fila.titulo,
    ]),
  )
  const lugares = new Map(
    ((ubicaciones ?? []) as { id: number; estante: string; nivel: number }[]).map(
      (fila) => [fila.id, `Estante ${fila.estante}, nivel ${fila.nivel}`],
    ),
  )
  return (
    (ejemplares ?? []) as {
      id: number
      codigo: string
      material_id: number
      ubicacion_id: number | null
    }[]
  ).map((fila) => ({
    id: fila.id,
    codigo: fila.codigo,
    titulo: titulos.get(fila.material_id) ?? 'Material sin título',
    ubicacion: fila.ubicacion_id ? (lugares.get(fila.ubicacion_id) ?? null) : null,
  }))
}

export async function obtenerPersonasActivas(): Promise<PersonaPrestataria[]> {
  const [{ data: personas, error: errorPersonas }, { data: tipos, error: errorTipos }] =
    await Promise.all([
      supabase
        .from('personas')
        .select('id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni')
        .eq('activo', true)
        .order('apellido_paterno'),
      supabase.from('tipos_persona').select('id, nombre'),
    ])
  if (errorPersonas) throw errorPersonas
  if (errorTipos) throw errorTipos
  const tiposPorId = new Map(
    ((tipos ?? []) as { id: number; nombre: string }[]).map((fila) => [
      fila.id,
      fila.nombre,
    ]),
  )
  return (
    (personas ?? []) as {
      id: number
      tipo_persona_id: number
      nombres: string
      apellido_paterno: string
      apellido_materno: string | null
      dni: string
    }[]
  ).map((fila) => ({
    id: fila.id,
    nombreCompleto:
      `${fila.apellido_paterno} ${fila.apellido_materno ?? ''}, ${fila.nombres}`.replace(
        /\s+,/,
        ',',
      ),
    dni: fila.dni,
    tipo: tiposPorId.get(fila.tipo_persona_id) ?? 'Sin tipo',
  }))
}

export async function registrarPrestamo(
  datos: DatosPrestamo,
  copia: CopiaDisponible,
  persona: PersonaPrestataria,
): Promise<PrestamoConfirmado> {
  const { error } = await supabase.from('prestamos').insert({
    ejemplar_id: datos.ejemplarId,
    persona_id: datos.personaId,
    fecha_prestamo: `${datos.fechaPrestamo}T12:00:00`,
    fecha_limite: datos.tieneFechaLimite ? datos.fechaLimite : null,
  })
  if (error) throw error
  return {
    codigo: copia.codigo,
    titulo: copia.titulo,
    persona: persona.nombreCompleto,
    fechaPrestamo: datos.fechaPrestamo,
    fechaLimite: datos.tieneFechaLimite ? datos.fechaLimite : null,
  }
}
