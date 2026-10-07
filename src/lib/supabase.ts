import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Único cliente de Supabase de toda la app. Se importa desde los archivos api.ts de cada feature.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)
