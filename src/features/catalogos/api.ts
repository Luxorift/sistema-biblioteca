import { supabase } from '@/lib/supabase'
import type {
  OpcionCatalogo,
  TipoCatalogo,
  TipoCatalogoSimple,
  Ubicacion,
} from './types'

// ─── Funciones existentes (compatibilidad) ──────────────────────────────────

export async function obtenerCatalogo(tabla: TipoCatalogo): Promise<OpcionCatalogo[]> {
  const { data, error } = await supabase.from(tabla).select('id, nombre').order('nombre')
  if (error) throw error
  return (data ?? []) as OpcionCatalogo[]
}

export async function crearCatalogo(
  tabla: TipoCatalogo,
  nombre: string,
): Promise<OpcionCatalogo> {
  const { data, error } = await supabase
    .from(tabla)
    .insert({ nombre: nombre.trim() })
    .select('id, nombre')
    .single()
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un registro con ese nombre.')
    }
    throw error
  }
  return data as OpcionCatalogo
}

export async function obtenerUbicaciones(): Promise<Ubicacion[]> {
  const { data, error } = await supabase
    .from('ubicaciones')
    .select('id, estante, nivel')
    .order('estante')
    .order('nivel')
  if (error) throw error
  return (data ?? []) as Ubicacion[]
}

export async function crearUbicacion(estante: string, nivel: number): Promise<Ubicacion> {
  const { data, error } = await supabase
    .from('ubicaciones')
    .insert({ estante: estante.trim().toUpperCase(), nivel })
    .select('id, estante, nivel')
    .single()
  if (error) {
    if (error.code === '23505') {
      throw new Error(`La ubicación Estante ${estante}, Nivel ${nivel} ya existe.`)
    }
    throw error
  }
  return data as Ubicacion
}

export async function obtenerEditoriales(): Promise<string[]> {
  const { data, error } = await supabase
    .from('editoriales')
    .select('nombre')
    .order('nombre')
  if (error) throw error
  return ((data ?? []) as { nombre: string }[]).map(({ nombre }) => nombre)
}

// ─── Administración completa de catálogos simples ───────────────────────────

export async function obtenerCatalogoSimple(
  tabla: TipoCatalogoSimple,
): Promise<OpcionCatalogo[]> {
  const { data, error } = await supabase
    .from(tabla)
    .select('id, nombre')
    .order('nombre', { ascending: true })

  if (error) {
    throw new Error(`Error al obtener los registros de ${tabla}: ${error.message}`)
  }

  return (data ?? []) as OpcionCatalogo[]
}

export async function crearCatalogoSimple(
  tabla: TipoCatalogoSimple,
  nombre: string,
): Promise<OpcionCatalogo> {
  const { data, error } = await supabase
    .from(tabla)
    .insert({ nombre: nombre.trim() })
    .select('id, nombre')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un registro registrado con ese nombre.')
    }
    throw new Error(`Error al crear en ${tabla}: ${error.message}`)
  }

  return data as OpcionCatalogo
}

export async function actualizarCatalogoSimple(
  tabla: TipoCatalogoSimple,
  id: number,
  nombre: string,
): Promise<OpcionCatalogo> {
  const { data, error } = await supabase
    .from(tabla)
    .update({ nombre: nombre.trim() })
    .eq('id', id)
    .select('id, nombre')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe otro registro con ese nombre.')
    }
    throw new Error(`Error al actualizar en ${tabla}: ${error.message}`)
  }

  return data as OpcionCatalogo
}

export async function eliminarCatalogoSimple(
  tabla: TipoCatalogoSimple,
  id: number,
): Promise<void> {
  const { error } = await supabase.from(tabla).delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'No se puede eliminar porque este registro está siendo utilizado por uno o más libros, materiales o personas. Primero reasigna o elimina los registros vinculados.',
      )
    }
    throw new Error(`Error al eliminar en ${tabla}: ${error.message}`)
  }
}

// ─── Actualización y eliminación de ubicaciones ──────────────────────────────

export async function actualizarUbicacion(
  id: number,
  estante: string,
  nivel: number,
): Promise<Ubicacion> {
  const { data, error } = await supabase
    .from('ubicaciones')
    .update({ estante: estante.trim().toUpperCase(), nivel })
    .eq('id', id)
    .select('id, estante, nivel')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Ya existe una ubicación con Estante ${estante} y Nivel ${nivel}.`)
    }
    throw new Error(`Error al actualizar la ubicación: ${error.message}`)
  }

  return data as Ubicacion
}

export async function eliminarUbicacion(id: number): Promise<void> {
  const { error } = await supabase.from('ubicaciones').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'No se puede eliminar esta ubicación porque tiene copias de libros asignadas a este estante y nivel.',
      )
    }
    throw new Error(`Error al eliminar la ubicación: ${error.message}`)
  }
}
