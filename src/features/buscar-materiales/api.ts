import { supabase } from '@/lib/supabase'
import type { DatosActualizarMaterial, MaterialEncontrado } from './types'

const ESTADOS_NO_ACTIVOS = new Set(['baja'])

type Catalogo = { id: number; nombre: string }
export class ErrorAjusteCopias extends Error {
  constructor(
    readonly codigo: 'prestados_bloquean' | 'disponibles_invalidos' | 'no_reducir_total',
  ) {
    super(codigo)
    this.name = 'ErrorAjusteCopias'
  }
}

export async function actualizarMaterial(
  materialId: number,
  datos: DatosActualizarMaterial,
): Promise<void> {
  const { error } = await supabase.rpc('actualizar_material_con_ubicaciones', {
    p_material_id: materialId,
    p_titulo: datos.titulo,
    p_tipo_material_id: datos.tipoMaterialId,
    p_categoria_id: datos.categoriaId,
    p_editorial: datos.editorial,
    p_anio: datos.anio,
    p_autores: datos.autores,
    p_cantidad_total: datos.cantidadCopias,
    p_cantidad_disponibles: datos.cantidadDisponibles,
    p_ubicaciones_nuevas: datos.ubicacionesNuevas,
  })
  if (!error) return
  if (error.code === '23505') throw new Error('MATERIAL_DUPLICADO')
  for (const codigo of [
    'prestados_bloquean',
    'disponibles_invalidos',
    'no_reducir_total',
  ] as const) {
    if (error.message === codigo) throw new ErrorAjusteCopias(codigo)
  }
  throw error
}

export async function buscarMateriales(): Promise<MaterialEncontrado[]> {
  const { data: materiales, error: errorMateriales } = await supabase
    .from('materiales')
    .select('id, titulo, anio_publicacion, tipo_material_id, categoria_id, editorial_id')
    .order('titulo')
  if (errorMateriales) throw errorMateriales

  const [tipos, categorias, editoriales, autores, relaciones, ejemplares, ubicaciones] =
    await Promise.all([
      supabase.from('tipos_material').select('id, nombre'),
      supabase.from('categorias').select('id, nombre'),
      supabase.from('editoriales').select('id, nombre'),
      supabase.from('autores').select('id, nombre'),
      supabase.from('material_autores').select('material_id, autor_id'),
      supabase.from('ejemplares').select('id, material_id, codigo, estado, ubicacion_id'),
      supabase.from('ubicaciones').select('id, estante, nivel'),
    ])
  for (const consulta of [
    tipos,
    categorias,
    editoriales,
    autores,
    relaciones,
    ejemplares,
    ubicaciones,
  ]) {
    if (consulta.error) throw consulta.error
  }

  const porId = (filas: Catalogo[]) =>
    new Map(filas.map((fila) => [fila.id, fila.nombre]))
  const tiposPorId = porId((tipos.data ?? []) as Catalogo[])
  const categoriasPorId = porId((categorias.data ?? []) as Catalogo[])
  const editorialesPorId = porId((editoriales.data ?? []) as Catalogo[])
  const autoresPorId = porId((autores.data ?? []) as Catalogo[])
  const ubicacionesPorId = new Map(
    ((ubicaciones.data ?? []) as { id: number; estante: string; nivel: number }[]).map(
      (fila) => [fila.id, `Estante ${fila.estante}, nivel ${fila.nivel}`],
    ),
  )
  const autoresPorMaterial = new Map<number, string[]>()
  for (const fila of (relaciones.data ?? []) as {
    material_id: number
    autor_id: number
  }[]) {
    const autor = autoresPorId.get(fila.autor_id)
    if (autor) {
      autoresPorMaterial.set(fila.material_id, [
        ...(autoresPorMaterial.get(fila.material_id) ?? []),
        autor,
      ])
    }
  }
  const copiasPorMaterial = new Map<number, MaterialEncontrado['copias']>()
  for (const fila of (ejemplares.data ?? []) as {
    id: number
    material_id: number
    codigo: string
    estado: string
    ubicacion_id: number | null
  }[]) {
    if (ESTADOS_NO_ACTIVOS.has(fila.estado)) continue
    copiasPorMaterial.set(fila.material_id, [
      ...(copiasPorMaterial.get(fila.material_id) ?? []),
      {
        id: fila.id,
        codigo: fila.codigo,
        estado: fila.estado,
        ubicacion: fila.ubicacion_id
          ? (ubicacionesPorId.get(fila.ubicacion_id) ?? null)
          : null,
      },
    ])
  }
  return (
    (materiales ?? []) as {
      id: number
      titulo: string
      anio_publicacion: number | null
      tipo_material_id: number
      categoria_id: number | null
      editorial_id: number | null
    }[]
  ).map((fila) => ({
    id: fila.id,
    titulo: fila.titulo,
    tipoMaterialId: fila.tipo_material_id,
    tipo: tiposPorId.get(fila.tipo_material_id) ?? 'Sin tipo',
    categoriaId: fila.categoria_id,
    categoria: fila.categoria_id
      ? (categoriasPorId.get(fila.categoria_id) ?? null)
      : null,
    editorial: fila.editorial_id
      ? (editorialesPorId.get(fila.editorial_id) ?? null)
      : null,
    anio: fila.anio_publicacion,
    autores: autoresPorMaterial.get(fila.id) ?? [],
    copias: copiasPorMaterial.get(fila.id) ?? [],
  }))
}
