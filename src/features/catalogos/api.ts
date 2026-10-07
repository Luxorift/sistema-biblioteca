import { supabase } from '@/lib/supabase'
import type { OpcionCatalogo, TipoCatalogo, Ubicacion } from './types'

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
  if (error) throw error
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
  if (error) throw error
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
