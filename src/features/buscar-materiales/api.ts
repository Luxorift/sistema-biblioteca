import { supabase } from '@/lib/supabase'
import type { MaterialEncontrado } from './types'

type Catalogo = { id: number; nombre: string }

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
      supabase.from('ejemplares').select('material_id, codigo, estado, ubicacion_id'),
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
    material_id: number
    codigo: string
    estado: string
    ubicacion_id: number | null
  }[]) {
    copiasPorMaterial.set(fila.material_id, [
      ...(copiasPorMaterial.get(fila.material_id) ?? []),
      {
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
    tipo: tiposPorId.get(fila.tipo_material_id) ?? 'Sin tipo',
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
