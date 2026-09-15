import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders })
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Configuración de recuperación no disponible.' }, 500)

  try {
    const { email, codigo, nuevaPassword } = await request.json()
    if (typeof email !== 'string' || typeof codigo !== 'string' || typeof nuevaPassword !== 'string') {
      return json({ error: 'Datos de recuperación no válidos.' }, 400)
    }
    if (!/^\d{6}$/.test(codigo) || nuevaPassword.length < 8) {
      return json({ error: 'El código o la nueva contraseña no cumplen los requisitos.' }, 400)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (usersError) throw usersError
    const user = users.users.find((item) => item.email?.toLocaleLowerCase() === email.toLocaleLowerCase())
    if (!user) return json({ error: 'El código no es válido, ya fue usado o venció.' }, 400)

    const { data: recoveryCode, error: codeError } = await adminClient
      .from('codigos_recuperacion')
      .select('id')
      .eq('perfil_id', user.id)
      .eq('codigo', codigo)
      .eq('usado', false)
      .gt('expira_en', new Date().toISOString())
      .maybeSingle()
    if (codeError) throw codeError
    if (!recoveryCode) return json({ error: 'El código no es válido, ya fue usado o venció.' }, 400)

    const { error: passwordError } = await adminClient.auth.admin.updateUserById(user.id, { password: nuevaPassword })
    if (passwordError) throw passwordError

    const { data: usedCode, error: usedError } = await adminClient
      .from('codigos_recuperacion')
      .update({ usado: true })
      .eq('id', recoveryCode.id)
      .eq('usado', false)
      .select('id')
      .maybeSingle()
    if (usedError) throw usedError
    if (!usedCode) return json({ error: 'El código ya fue utilizado.' }, 409)

    return json({ ok: true })
  } catch (error) {
    console.error('No se pudo completar la recuperación de contraseña.', error)
    return json({ error: 'No fue posible actualizar la contraseña.' }, 500)
  }
})
