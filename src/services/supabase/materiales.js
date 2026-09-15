import { supabase } from './client'

export async function getMateriales() {
  const { data, error } = await supabase
    .from('materiales')
    .select('id, titulo, tipo_material, estado, detalles_extra, creado_en')
    .order('titulo', { ascending: true })

  if (error) throw error
  return data
}
