import { supabase } from '@/lib/supabase'
import type { DatosActualizarMaterial, MaterialEncontrado } from './types'

const ESTADOS_NO_ACTIVOS = new Set(['baja'])

type Catalogo = { id: number; nombre: string }
type EjemplarFila = { id: number; estado: string }

async function resolverEditorialId(nombre: string): Promise<number | null> {
  const limpio = nombre.trim()
  if (!limpio) return null
  const { data: lista, error: errorLista } = await supabase
    .from('editoriales')
    .select('id, nombre')
  if (errorLista) throw errorLista
  const clave = limpio.toLocaleLowerCase()
  const existente = ((lista ?? []) as { id: number; nombre: string }[]).find(
    (fila) => fila.nombre.toLocaleLowerCase() === clave,
  )
  if (existente) return existente.id
  const { data, error } = await supabase
    .from('editoriales')
    .insert({ nombre: limpio })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') {
      const { data: otra, error: errorOtra } = await supabase
        .from('editoriales')
        .select('id, nombre')
      if (errorOtra) throw errorOtra
      const coincidencia = ((otra ?? []) as { id: number; nombre: string }[]).find(
        (fila) => fila.nombre.toLocaleLowerCase() === clave,
      )
      if (coincidencia) return coincidencia.id
    }
    throw error
  }
  return (data as { id: number }).id
}

async function sincronizarAutores(materialId: number, autores: string[]) {
  const { error: errorBorrado } = await supabase
    .from('material_autores')
    .delete()
    .eq('material_id', materialId)
  if (errorBorrado) throw errorBorrado
  let orden = 0
  for (const nombre of autores) {
    const limpio = nombre.trim()
    if (!limpio) continue
    const { error: errorAutor } = await supabase.from('autores').insert({ nombre: limpio })
    if (errorAutor && errorAutor.code !== '23505') throw errorAutor
    const { data: filaAutor, error: errorBusqueda } = await supabase
      .from('autores')
      .select('id, nombre')
      .ilike('nombre', limpio)
      .limit(1)
      .maybeSingle()
    if (errorBusqueda) throw errorBusqueda
    if (!filaAutor) continue
    orden += 1
    const { error: errorEnlace } = await supabase.from('material_autores').insert({
      material_id: materialId,
      autor_id: (filaAutor as { id: number }).id,
      orden,
    })
    if (errorEnlace) throw errorEnlace
  }
}

async function obtenerEjemplaresActivos(materialId: number): Promise<EjemplarFila[]> {
  const { data, error } = await supabase
    .from('ejemplares')
    .select('id, estado')
    .eq('material_id', materialId)
  if (error) throw error
  return ((data ?? []) as EjemplarFila[]).filter(
    (fila) => !ESTADOS_NO_ACTIVOS.has(fila.estado),
  )
}

async function marcarEjemplaresBaja(ids: number[]): Promise<void> {
  for (const id of ids) {
    const { error } = await supabase
      .from('ejemplares')
      .update({ estado: 'baja' })
      .eq('id', id)
      .in('estado', ['disponible', 'en_reparacion'])
    if (error) throw error
  }
}

async function ajustarDisponibles(
  ejemplares: EjemplarFila[],
  cantidadObjetivo: number,
): Promise<void> {
  const disponibles = ejemplares.filter((fila) => fila.estado === 'disponible')
  const enReparacion = ejemplares.filter((fila) => fila.estado === 'en_reparacion')
  const actual = disponibles.length
  if (cantidadObjetivo === actual) return
  if (cantidadObjetivo > actual) {
    const faltan = cantidadObjetivo - actual
    const ids = enReparacion.slice(0, faltan).map((fila) => fila.id)
    for (const id of ids) {
      const { error } = await supabase
        .from('ejemplares')
        .update({ estado: 'disponible' })
        .eq('id', id)
        .eq('estado', 'en_reparacion')
      if (error) throw error
    }
    return
  }
  const sobran = actual - cantidadObjetivo
  const ids = disponibles.slice(0, sobran).map((fila) => fila.id)
  for (const id of ids) {
    const { error } = await supabase
      .from('ejemplares')
      .update({ estado: 'en_reparacion' })
      .eq('id', id)
      .eq('estado', 'disponible')
    if (error) throw error
  }
}

export class ErrorAjusteCopias extends Error {
  constructor(
    readonly codigo:
      | 'prestados_bloquean'
      | 'disponibles_invalidos'
      | 'no_reducir_total',
  ) {
    super(codigo)
    this.name = 'ErrorAjusteCopias'
  }
}

export async function ajustarCopiasMaterial(
  materialId: number,
  cantidadTotal: number,
  cantidadDisponibles: number,
): Promise<void> {
  let ejemplares = await obtenerEjemplaresActivos(materialId)
  const prestados = ejemplares.filter((fila) => fila.estado === 'prestado').length
  if (cantidadTotal < prestados) {
    throw new ErrorAjusteCopias('prestados_bloquean')
  }
  const maxDisponibles = cantidadTotal - prestados
  if (cantidadDisponibles > maxDisponibles) {
    throw new ErrorAjusteCopias('disponibles_invalidos')
  }

  if (cantidadTotal > ejemplares.length) {
    const { error } = await supabase.rpc('agregar_ejemplares', {
      p_material_id: materialId,
      p_cantidad: cantidadTotal - ejemplares.length,
      p_ubicacion_id: null,
    })
    if (error) throw error
    ejemplares = await obtenerEjemplaresActivos(materialId)
  }

  if (cantidadTotal < ejemplares.length) {
    const faltan = ejemplares.length - cantidadTotal
    const paraBaja = [
      ...ejemplares.filter((fila) => fila.estado === 'disponible'),
      ...ejemplares.filter((fila) => fila.estado === 'en_reparacion'),
    ]
      .slice(0, faltan)
      .map((fila) => fila.id)
    if (paraBaja.length < faltan) {
      throw new ErrorAjusteCopias('no_reducir_total')
    }
    await marcarEjemplaresBaja(paraBaja)
    ejemplares = await obtenerEjemplaresActivos(materialId)
  }

  await ajustarDisponibles(ejemplares, cantidadDisponibles)
}

export async function actualizarMaterial(
  materialId: number,
  datos: DatosActualizarMaterial,
): Promise<void> {
  const editorialId = await resolverEditorialId(datos.editorial)
  const { error: errorMaterial } = await supabase
    .from('materiales')
    .update({
      titulo: datos.titulo.trim(),
      tipo_material_id: datos.tipoMaterialId,
      categoria_id: datos.categoriaId,
      editorial_id: editorialId,
      anio_publicacion: datos.anio,
    })
    .eq('id', materialId)
  if (errorMaterial) {
    if (errorMaterial.code === '23505') {
      throw new Error('MATERIAL_DUPLICADO')
    }
    throw errorMaterial
  }
  await sincronizarAutores(materialId, datos.autores)
  await ajustarCopiasMaterial(
    materialId,
    datos.cantidadCopias,
    datos.cantidadDisponibles,
  )
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
