import { supabase } from '@/lib/supabase'
import type {
  CopiaDisponible,
  DatosPrestamo,
  MaterialPrestable,
  PersonaPrestataria,
  PrestamoConfirmado,
  PrestamoHistorico,
} from './types'

// ─── Funciones de préstamo activo ───────────────────────────────────────────

export async function obtenerMaterialesPrestables(): Promise<MaterialPrestable[]> {
  const [
    ejemplares,
    materiales,
    ubicaciones,
    tipos,
    categorias,
    editoriales,
    relaciones,
    autores,
  ] = await Promise.all([
    supabase
      .from('ejemplares')
      .select('id, codigo, material_id, ubicacion_id, estado')
      .order('codigo'),
    supabase
      .from('materiales')
      .select(
        'id, titulo, editorial_id, anio_publicacion, tipo_material_id, categoria_id',
      )
      .order('titulo'),
    supabase.from('ubicaciones').select('id, estante, nivel'),
    supabase.from('tipos_material').select('id, nombre'),
    supabase.from('categorias').select('id, nombre'),
    supabase.from('editoriales').select('id, nombre'),
    supabase.from('material_autores').select('material_id, autor_id'),
    supabase.from('autores').select('id, nombre'),
  ])
  for (const consulta of [
    ejemplares,
    materiales,
    ubicaciones,
    tipos,
    categorias,
    editoriales,
    relaciones,
    autores,
  ])
    if (consulta.error) throw consulta.error
  const nombresPorId = (filas: { id: number; nombre: string }[]) =>
    new Map(filas.map((fila) => [fila.id, fila.nombre]))
  const tipoPorId = nombresPorId((tipos.data ?? []) as { id: number; nombre: string }[])
  const categoriaPorId = nombresPorId(
    (categorias.data ?? []) as { id: number; nombre: string }[],
  )
  const editorialPorId = nombresPorId(
    (editoriales.data ?? []) as { id: number; nombre: string }[],
  )
  const autorPorId = nombresPorId(
    (autores.data ?? []) as { id: number; nombre: string }[],
  )
  const ubicacionPorId = new Map(
    ((ubicaciones.data ?? []) as { id: number; estante: string; nivel: number }[]).map(
      (fila) => [fila.id, `Estante ${fila.estante}, nivel ${fila.nivel}`],
    ),
  )
  const autoresPorMaterial = new Map<number, string[]>()
  for (const fila of (relaciones.data ?? []) as {
    material_id: number
    autor_id: number
  }[]) {
    const autor = autorPorId.get(fila.autor_id)
    if (autor)
      autoresPorMaterial.set(fila.material_id, [
        ...(autoresPorMaterial.get(fila.material_id) ?? []),
        autor,
      ])
  }
  const copiasPorMaterial = new Map<
    number,
    { total: number; disponibles: CopiaDisponible[] }
  >()
  for (const fila of (ejemplares.data ?? []) as {
    id: number
    codigo: string
    material_id: number
    ubicacion_id: number | null
    estado: string
  }[]) {
    const actual = copiasPorMaterial.get(fila.material_id) ?? {
      total: 0,
      disponibles: [],
    }
    actual.total += 1
    if (fila.estado === 'disponible')
      actual.disponibles.push({
        id: fila.id,
        codigo: fila.codigo,
        titulo: '',
        ubicacion: fila.ubicacion_id
          ? (ubicacionPorId.get(fila.ubicacion_id) ?? null)
          : null,
      })
    copiasPorMaterial.set(fila.material_id, actual)
  }
  return (
    (materiales.data ?? []) as {
      id: number
      titulo: string
      editorial_id: number | null
      anio_publicacion: number | null
      tipo_material_id: number
      categoria_id: number | null
    }[]
  )
    .map((fila) => {
      const copias = copiasPorMaterial.get(fila.id) ?? { total: 0, disponibles: [] }
      return {
        id: fila.id,
        titulo: fila.titulo,
        editorial: fila.editorial_id
          ? (editorialPorId.get(fila.editorial_id) ?? null)
          : null,
        anio: fila.anio_publicacion,
        tipo: tipoPorId.get(fila.tipo_material_id) ?? 'Sin tipo',
        categoria: fila.categoria_id
          ? (categoriaPorId.get(fila.categoria_id) ?? null)
          : null,
        autores: autoresPorMaterial.get(fila.id) ?? [],
        copias: copias.disponibles.map((copia) => ({ ...copia, titulo: fila.titulo })),
        cantidadCopias: copias.total,
      }
    })
    .filter((material) => material.copias.length > 0)
}

export async function obtenerPersonasActivas(): Promise<PersonaPrestataria[]> {
  const [personas, tipos] = await Promise.all([
    supabase
      .from('personas')
      .select('id, tipo_persona_id, nombres, apellido_paterno, apellido_materno, dni')
      .eq('activo', true)
      .order('apellido_paterno'),
    supabase.from('tipos_persona').select('id, nombre'),
  ])
  if (personas.error) throw personas.error
  if (tipos.error) throw tipos.error
  const tiposPorId = new Map(
    ((tipos.data ?? []) as { id: number; nombre: string }[]).map((fila) => [
      fila.id,
      fila.nombre,
    ]),
  )
  return (
    (personas.data ?? []) as {
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
  copias: CopiaDisponible[],
  persona: PersonaPrestataria,
): Promise<PrestamoConfirmado> {
  const { error } = await supabase
    .from('prestamos')
    .insert(
      copias.map((copia) => ({
        ejemplar_id: copia.id,
        persona_id: datos.personaId,
        fecha_prestamo: `${datos.fechaPrestamo}T12:00:00`,
        fecha_limite: datos.tieneFechaLimite ? datos.fechaLimite : null,
      })),
    )
  if (error) throw error
  return {
    codigos: copias.map((copia) => copia.codigo),
    titulo: copias[0]?.titulo ?? 'Material',
    persona: persona.nombreCompleto,
    fechaPrestamo: datos.fechaPrestamo,
    fechaLimite: datos.tieneFechaLimite ? datos.fechaLimite : null,
  }
}

// ─── Historial completo ──────────────────────────────────────────────────────

interface FilaPrestamo {
  id: number
  ejemplar_id: number
  persona_id: number
  fecha_prestamo: string
  fecha_limite: string | null
  fecha_devolucion: string | null
}

interface FilaEjemplar {
  id: number
  codigo: string
  material_id: number
}

interface FilaMaterial {
  id: number
  titulo: string
}

interface FilaPersona {
  id: number
  nombres: string
  apellido_paterno: string
  apellido_materno: string | null
  dni: string
  tipo_persona_id: number
}

interface FilaTipoPersona {
  id: number
  nombre: string
}

const MS_POR_DIA = 1000 * 60 * 60 * 24

function calcularAtraso(
  fechaLimite: string | null,
  fechaDevolucion: string | null,
  hoy: Date,
): { estaAtrasado: boolean; diasAtraso: number } {
  if (!fechaLimite) return { estaAtrasado: false, diasAtraso: 0 }
  const limite = new Date(fechaLimite)
  const referencia = fechaDevolucion ? new Date(fechaDevolucion) : hoy
  const dias = Math.floor((referencia.getTime() - limite.getTime()) / MS_POR_DIA)
  return {
    estaAtrasado: dias > 0,
    diasAtraso: Math.max(0, dias),
  }
}

export async function obtenerPrestamosHistoricos(): Promise<PrestamoHistorico[]> {
  // prestamos no tiene FK directa a materiales: pasa por ejemplares.
  const [resPrestamos, resEjemplares, resMateriales, resPersonas, resTipos] = await Promise.all([
    supabase
      .from('prestamos')
      .select('id, ejemplar_id, persona_id, fecha_prestamo, fecha_limite, fecha_devolucion')
      .order('fecha_prestamo', { ascending: false }),
    supabase.from('ejemplares').select('id, codigo, material_id'),
    supabase.from('materiales').select('id, titulo'),
    supabase
      .from('personas')
      .select('id, nombres, apellido_paterno, apellido_materno, dni, tipo_persona_id'),
    supabase.from('tipos_persona').select('id, nombre'),
  ])

  for (const res of [resPrestamos, resEjemplares, resMateriales, resPersonas, resTipos]) {
    if (res.error) throw res.error
  }

  const ejemplarPorId = new Map(
    (resEjemplares.data as FilaEjemplar[]).map((e) => [e.id, e]),
  )
  const materialPorId = new Map(
    (resMateriales.data as FilaMaterial[]).map((m) => [m.id, m]),
  )
  const personaPorId = new Map(
    (resPersonas.data as FilaPersona[]).map((p) => [p.id, p]),
  )
  const tipoPorId = new Map(
    (resTipos.data as FilaTipoPersona[]).map((t) => [t.id, t.nombre]),
  )

  const hoy = new Date()

  return (resPrestamos.data as FilaPrestamo[]).flatMap((fila) => {
    const ejemplar = ejemplarPorId.get(fila.ejemplar_id)
    const persona = personaPorId.get(fila.persona_id)
    if (!ejemplar || !persona) return []

    const { estaAtrasado, diasAtraso } = calcularAtraso(
      fila.fecha_limite,
      fila.fecha_devolucion,
      hoy,
    )

    const nombreCompleto =
      `${persona.apellido_paterno} ${persona.apellido_materno ?? ''}, ${persona.nombres}`.replace(
        /\s+,/,
        ',',
      )

    return [
      {
        id: fila.id,
        codigo: ejemplar.codigo,
        titulo: materialPorId.get(ejemplar.material_id)?.titulo ?? 'Material sin título',
        persona: nombreCompleto,
        dni: persona.dni,
        tipoPersona: tipoPorId.get(persona.tipo_persona_id) ?? 'Sin tipo',
        fechaPrestamo: fila.fecha_prestamo.slice(0, 10),
        fechaLimite: fila.fecha_limite ? fila.fecha_limite.slice(0, 10) : null,
        fechaDevolucion: fila.fecha_devolucion ? fila.fecha_devolucion.slice(0, 10) : null,
        estaAtrasado,
        diasAtraso,
      },
    ]
  })
}
