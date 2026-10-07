import { supabase } from '@/lib/supabase'
import type { CopiaParaEtiqueta } from './types'

export async function obtenerCopiasParaEtiquetas(): Promise<CopiaParaEtiqueta[]> {
  const [
    ejemplaresRes,
    materialesRes,
    ubicacionesRes,
    tiposRes,
    relacionesRes,
    autoresRes,
  ] = await Promise.all([
    supabase
      .from('ejemplares')
      .select('id, codigo, material_id, ubicacion_id, estado')
      .neq('estado', 'baja')
      .order('codigo'),
    supabase
      .from('materiales')
      .select('id, titulo, tipo_material_id')
      .order('titulo'),
    supabase.from('ubicaciones').select('id, estante, nivel'),
    supabase.from('tipos_material').select('id, nombre'),
    supabase.from('material_autores').select('material_id, autor_id, orden'),
    supabase.from('autores').select('id, nombre'),
  ])

  if (ejemplaresRes.error) throw ejemplaresRes.error
  if (materialesRes.error) throw materialesRes.error
  if (ubicacionesRes.error) throw ubicacionesRes.error
  if (tiposRes.error) throw tiposRes.error
  if (relacionesRes.error) throw relacionesRes.error
  if (autoresRes.error) throw autoresRes.error

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

  return (ejemplaresRes.data ?? []).flatMap((ejemplar) => {
    const mat = materialesPorId.get(ejemplar.material_id)
    if (!mat) return []
    return [
      {
        id: ejemplar.id,
        codigo: ejemplar.codigo,
        materialId: ejemplar.material_id,
        titulo: mat.titulo,
        autores: mat.autores,
        ubicacion: ejemplar.ubicacion_id
          ? (ubicacionesPorId.get(ejemplar.ubicacion_id) ?? null)
          : null,
        tipo: mat.tipo,
        estado: ejemplar.estado,
      },
    ]
  })
}
