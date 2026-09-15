import { supabase } from './supabase/client'

export type AdminMaterial = { id: string; titulo: string; tipo: string; estado: string; detalles_extra: Record<string, unknown> | null }
export type AdminMiembro = { id: string; nombre_completo: string; tipo: string; codigo: string; contacto: string | null }
export type AdminPerfil = { id: string; nombre: string; rol: 'Administrador' | 'Bibliotecario' }
export type MaterialInput = Omit<AdminMaterial, 'id'>
export type MiembroInput = Omit<AdminMiembro, 'id'>
export type PerfilInput = AdminPerfil

async function run(query: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await query
  if (error) throw error
}

export async function getAdminData() {
  const [materialesResult, miembrosResult, perfilesResult] = await Promise.all([
    supabase.from('materiales').select('id, titulo, tipo, estado, detalles_extra').order('titulo'),
    supabase.from('miembros').select('id, nombre_completo, tipo, codigo, contacto').order('nombre_completo'),
    supabase.from('perfiles').select('id, nombre, rol').order('nombre'),
  ])
  if (materialesResult.error) throw materialesResult.error
  if (miembrosResult.error) throw miembrosResult.error
  if (perfilesResult.error) throw perfilesResult.error
  return {
    materiales: (materialesResult.data ?? []) as AdminMaterial[],
    miembros: (miembrosResult.data ?? []) as AdminMiembro[],
    perfiles: (perfilesResult.data ?? []) as AdminPerfil[],
  }
}

export const createMaterial = (input: MaterialInput) => run(supabase.from('materiales').insert(input))
export const updateMaterial = (id: string, input: MaterialInput) => run(supabase.from('materiales').update(input).eq('id', id))
export const deleteMaterial = (id: string) => run(supabase.from('materiales').delete().eq('id', id))
export const createMiembro = (input: MiembroInput) => run(supabase.from('miembros').insert(input))
export const updateMiembro = (id: string, input: MiembroInput) => run(supabase.from('miembros').update(input).eq('id', id))
export const deleteMiembro = (id: string) => run(supabase.from('miembros').delete().eq('id', id))
export const createPerfil = (input: PerfilInput) => run(supabase.from('perfiles').insert(input))
export const updatePerfil = (id: string, input: Omit<PerfilInput, 'id'>) => run(supabase.from('perfiles').update(input).eq('id', id))
export const deletePerfil = (id: string) => run(supabase.from('perfiles').delete().eq('id', id))
