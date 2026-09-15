import { supabase } from './client'

export async function getMateriales() {
  const { data, error } = await supabase
    .from('materiales')
    .select('*')
    .order('titulo', { ascending: true })

  if (error) throw error
  return data
}
