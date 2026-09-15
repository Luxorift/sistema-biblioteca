import { supabase } from './client'

const RECOVERY_DURATION_MS = 10 * 60 * 1000

function generateRecoveryCode() {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return String(100000 + (values[0] % 900000))
}

export async function requestRecoveryCode(perfilId) {
  const codigo = generateRecoveryCode()
  const expiraEn = new Date(Date.now() + RECOVERY_DURATION_MS).toISOString()

  const { error } = await supabase.from('codigos_recuperacion').insert({
    perfil_id: perfilId,
    codigo,
    expira_en: expiraEn,
    usado: false,
  })

  if (error) throw error

  // El canal de entrega debe estar protegido (por ejemplo, una Edge Function).
  // No se muestra el código en la interfaz ni se guarda en el navegador.
  return { expiraEn }
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
  if (!data) return false

  // La condición evita que el mismo código sea aceptado simultáneamente dos veces.
  const { data: codeUsed, error: updateError } = await supabase
    .from('codigos_recuperacion')
    .update({ usado: true })
    .eq('id', data.id)
    .eq('usado', false)
    .select('id')
    .maybeSingle()

  if (updateError) throw updateError
  return Boolean(codeUsed)
}
