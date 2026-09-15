import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import nodemailer from 'npm:nodemailer@6.9.15'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const smtpHost = Deno.env.get('SMTP_HOST')
const smtpPort = Deno.env.get('SMTP_PORT')
const smtpUser = Deno.env.get('SMTP_USER')
const smtpPass = Deno.env.get('SMTP_PASS')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

function requireSmtpConfiguration() {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !supabaseUrl || !serviceRoleKey) {
    throw new Error('La configuración SMTP no está completa en los secretos de la función.')
  }
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Método no permitido.', { status: 405 })
  }

  try {
    requireSmtpConfiguration()
    const { email } = await request.json()
    if (typeof email !== 'string' || !email.includes('@')) {
      return new Response('Correo electrónico no válido.', { status: 400 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (usersError) throw usersError
    const user = users.users.find((item) => item.email?.toLocaleLowerCase() === email.toLocaleLowerCase())

    // Se conserva una respuesta neutra para no revelar si una cuenta existe.
    if (!user) return Response.json({ ok: true })

    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    const codigo = String(100000 + (values[0] % 900000))
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const { error: insertError } = await adminClient.from('codigos_recuperacion').insert({
      perfil_id: user.id,
      codigo,
      expira_en: expiraEn,
      usado: false,
    })
    if (insertError) throw insertError

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: smtpUser,
      to: email,
      subject: 'Código de recuperación - Sistema de Biblioteca',
      text: `Su código de recuperación es ${codigo}. Vence en 10 minutos.`,
    })
    return Response.json({ ok: true, perfilId: user.id })
  } catch (error) {
    console.error('No se pudo enviar el código de recuperación.', error)
    return new Response('No fue posible enviar el código.', { status: 500 })
  }
})
