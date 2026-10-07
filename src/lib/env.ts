// Lee y valida las variables de entorno una sola vez.
// Si falta alguna, la app avisa con un mensaje claro en vez de fallar más adelante.
function leer(nombre: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const valor = import.meta.env[nombre]
  if (!valor) {
    throw new Error(
      `Falta la variable ${nombre}. Copia .env.example como .env.local y completa los valores.`,
    )
  }
  return valor
}

export const env = {
  supabaseUrl: leer('VITE_SUPABASE_URL'),
  supabaseAnonKey: leer('VITE_SUPABASE_ANON_KEY'),
} as const
