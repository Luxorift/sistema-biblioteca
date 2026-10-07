// Convierte los errores técnicos de Supabase en frases claras para el bibliotecario.
export function mensajeErrorLogin(error: unknown): string {
  const texto = error instanceof Error ? error.message.toLowerCase() : ''

  if (texto.includes('invalid login credentials')) {
    return 'El correo o la contraseña no son correctos. Revisa y vuelve a intentar.'
  }
  if (texto.includes('email not confirmed')) {
    return 'Tu correo aún no está confirmado. Pide ayuda al administrador.'
  }
  if (texto.includes('failed to fetch') || texto.includes('network')) {
    return 'No hay conexión a internet. Revisa tu conexión e intenta de nuevo.'
  }
  return 'No se pudo iniciar sesión. Intenta de nuevo en un momento.'
}
