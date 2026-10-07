import { supabase } from '@/lib/supabase'
import type {
  DatosMaterial,
  EjemplarCreado,
  MaterialSimilar,
  ResultadoRegistro,
} from './types'

export async function buscarSimilares(titulo: string): Promise<MaterialSimilar[]> {
  const { data, error } = await supabase.rpc('buscar_similares', {
    p_titulo: titulo,
    p_umbral: 0.45,
  })
  if (error) throw error
  const similares = (data ?? []) as Omit<MaterialSimilar, 'copias'>[]
  if (!similares.length) return []
  const ids = similares.map(({ id }) => id)
  const { data: ejemplares, error: errorEjemplares } = await supabase
    .from('ejemplares')
    .select('material_id')
    .in('material_id', ids)
  if (errorEjemplares) throw errorEjemplares
  const copiasPorMaterial = new Map<number, number>()
  for (const ejemplar of (ejemplares ?? []) as { material_id: number }[])
    copiasPorMaterial.set(
      ejemplar.material_id,
      (copiasPorMaterial.get(ejemplar.material_id) ?? 0) + 1,
    )
  return similares.map((material) => ({
    ...material,
    copias: copiasPorMaterial.get(material.id) ?? 0,
  }))
}
export async function registrarMaterial(
  datos: DatosMaterial,
): Promise<ResultadoRegistro> {
  const { data, error } = await supabase.rpc('registrar_material', {
    p_titulo: datos.titulo,
    p_tipo_material_id: datos.tipoMaterialId,
    p_categoria_id: datos.categoriaId,
    p_editorial: datos.editorial || null,
    p_anio: datos.anio,
    p_autores: datos.autores,
  })
  if (error) throw error
  const resultado = (data as { material_id: number; ya_existia: boolean }[] | null)?.[0]
  if (!resultado) throw new Error('No se recibió la confirmación del material.')
  return { materialId: resultado.material_id, yaExistia: resultado.ya_existia }
}
export async function agregarEjemplares(
  materialId: number,
  cantidad: number,
  ubicacionId: number | null,
): Promise<EjemplarCreado[]> {
  const { data, error } = await supabase.rpc('agregar_ejemplares', {
    p_material_id: materialId,
    p_cantidad: cantidad,
    p_ubicacion_id: ubicacionId,
  })
  if (error) throw error
  return (data ?? []) as EjemplarCreado[]
}
