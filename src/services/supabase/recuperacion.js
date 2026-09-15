import { supabase } from './client'

export async function requestRecoveryCode(email) {
  const { data, error } = await supabase.functions.invoke('enviar-codigo', {
    body: { email },
  })

  if (error) throw error
  return data
}

export async function resetPasswordWithRecoveryCode(email, codigo, nuevaPassword) {
  const { error } = await supabase.functions.invoke('validar-codigo', {
    body: { email, codigo, nuevaPassword },
  })

  if (error) throw error
}
