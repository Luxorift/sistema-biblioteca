import { supabase } from '@/lib/supabase'
import type { MaterialEncontrado } from './types'

interface FilaMaterial {
  id: number
  titulo: string
  anio_publicacion: number | null
  tipos_material: { nombre: string }[]
  categorias: { nombre: string }[]
  editoriales: { nombre: string }[]
  material_autores: { autores: { nombre: string }[] }[]
  ejemplares: {
    codigo: string
    estado: string
    ubicaciones: { estante: string; nivel: number }[]
  }[]
}

function convertirMaterial(fila: FilaMaterial): MaterialEncontrado {
  return {
    id: fila.id,
    titulo: fila.titulo,
    tipo: fila.tipos_material[0]?.nombre ?? 'Sin tipo',
    categoria: fila.categorias[0]?.nombre ?? null,
    editorial: fila.editoriales[0]?.nombre ?? null,
    anio: fila.anio_publicacion,
    autores: fila.material_autores.flatMap(({ autores }) =>
      autores.map(({ nombre }) => nombre),
    ),
    copias: fila.ejemplares.map((ejemplar) => ({
      codigo: ejemplar.codigo,
      estado: ejemplar.estado,
      ubicacion: ejemplar.ubicaciones[0]
        ? `Estante ${ejemplar.ubicaciones[0].estante}, nivel ${ejemplar.ubicaciones[0].nivel}`
        : null,
    })),
  }
}

export async function buscarMateriales(termino: string): Promise<MaterialEncontrado[]> {
  const texto = termino.trim()
  const patron = `%${texto}%`
  const { data: autores, error: errorAutores } = await supabase
    .from('autores')
    .select('id')
    .ilike('nombre', patron)
  if (errorAutores) throw errorAutores

  const idsAutores = ((autores ?? []) as { id: number }[]).map(({ id }) => id)
  const { data: relaciones, error: errorRelaciones } = idsAutores.length
    ? await supabase
        .from('material_autores')
        .select('material_id')
        .in('autor_id', idsAutores)
    : { data: [], error: null }
  if (errorRelaciones) throw errorRelaciones

  const idsPorAutor = ((relaciones ?? []) as { material_id: number }[]).map(
    ({ material_id }) => material_id,
  )
  const filtro = idsPorAutor.length
    ? `titulo.ilike.${patron},id.in.(${idsPorAutor.join(',')})`
    : `titulo.ilike.${patron}`
  const { data, error } = await supabase
    .from('materiales')
    .select(
      'id, titulo, anio_publicacion, tipos_material(nombre), categorias(nombre), editoriales(nombre), material_autores(autores(nombre)), ejemplares(codigo, estado, ubicaciones(estante, nivel))',
    )
    .or(filtro)
    .order('titulo')
    .limit(50)
  if (error) throw error
  return ((data ?? []) as unknown as FilaMaterial[]).map(convertirMaterial)
}
