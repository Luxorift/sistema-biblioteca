import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import nodemailer from 'npm:nodemailer@6.9.15'

const smtpHost = Deno.env.get('SMTP_HOST')
const smtpPort = Deno.env.get('SMTP_PORT')
const smtpUser = Deno.env.get('SMTP_USER')
const smtpPass = Deno.env.get('SMTP_PASS')

function requireSmtpConfiguration() {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('La configuración SMTP no está completa en los secretos de la función.')
  }
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Método no permitido.', { status: 405 })
  }

  try {
    requireSmtpConfiguration()
    const { destinatario, codigo } = await request.json()
    if (typeof destinatario !== 'string' || typeof codigo !== 'string' || !/^\d{6}$/.test(codigo)) {
      return new Response('Datos de recuperación no válidos.', { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: smtpUser,
      to: destinatario,
      subject: 'Código de recuperación - Sistema de Biblioteca',
      text: `Su código de recuperación es ${codigo}. Vence en 10 minutos.`,
    })
    return Response.json({ ok: true })
  } catch (error) {
    console.error('No se pudo enviar el código de recuperación.', error)
    return new Response('No fue posible enviar el código.', { status: 500 })
  }
})
