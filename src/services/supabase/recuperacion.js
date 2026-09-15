import { supabase } from './client'

export async function requestRecoveryCode(email) {
  const { data, error } = await supabase.functions.invoke('enviar-codigo', {
    body: { email },
  })

  if (error) throw error
  return data
}

export async function validateRecoveryCode(perfilId, codigo) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('codigos_recuperacion')
    .select('id')
    .eq('perfil_id', perfilId)
    .eq('codigo', codigo)
    .eq('usado', false)
    .gt('expira_en', now)
    .maybeSingle()

  if (error) throw error
  return data?.id ?? null
}

export async function updatePasswordWithRecoveryCode(codeId, nuevaPassword) {
  const { error: passwordError } = await supabase.auth.updateUser({ password: nuevaPassword })
  if (passwordError) throw passwordError

  const { data: usedCode, error: updateError } = await supabase
    .from('codigos_recuperacion')
    .update({ usado: true })
    .eq('id', codeId)
    .eq('usado', false)
    .select('id')
    .maybeSingle()

  if (updateError) throw updateError
  if (!usedCode) throw new Error('El código ya fue utilizado.')
}
