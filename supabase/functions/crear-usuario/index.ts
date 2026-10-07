import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CrearUsuarioBody {
  email?: string
  password?: string
  nombre?: string
  rol?: 'admin' | 'bibliotecario'
}

serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({
          error: 'Variables de entorno de Supabase no configuradas en la Edge Function.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 1. Verificar la identidad y rol del usuario llamador
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Se requiere token de sesión.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseLlamador = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const {
      data: { user: llamadorAuth },
      error: llamadorAuthError,
    } = await supabaseLlamador.auth.getUser()

    if (llamadorAuthError || !llamadorAuth) {
      return new Response(
        JSON.stringify({ error: 'Sesión no válida o expirada. Vuelve a iniciar sesión.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Consultar el perfil del llamador
    const { data: perfilLlamador, error: perfilLlamadorError } = await supabaseLlamador
      .from('perfiles')
      .select('rol, activo')
      .eq('id', llamadorAuth.id)
      .single()

    if (perfilLlamadorError || !perfilLlamador) {
      return new Response(
        JSON.stringify({ error: 'Perfil de usuario llamador no encontrado.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!perfilLlamador.activo || perfilLlamador.rol !== 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Acceso denegado. Solo administradores pueden crear nuevos usuarios.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 2. Parsear y validar los datos del nuevo usuario
    const body: CrearUsuarioBody = await req.json().catch(() => ({}))
    const email = body.email?.trim().toLowerCase()
    const password = body.password?.trim()
    const nombre = body.nombre?.trim()
    const rol = body.rol

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Ingresa un correo electrónico válido.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!nombre || nombre.length < 2) {
      return new Response(
        JSON.stringify({ error: 'El nombre completo debe tener al menos 2 letras.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (rol !== 'admin' && rol !== 'bibliotecario') {
      return new Response(
        JSON.stringify({ error: "El rol debe ser 'admin' o 'bibliotecario'." }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 3. Crear el usuario en auth con la clave service_role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: usuarioCreado, error: errorCrearAuth } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre },
      })

    if (errorCrearAuth || !usuarioCreado.user) {
      const mensaje = errorCrearAuth?.message?.includes('already registered')
        ? 'Ya existe un usuario con ese correo electrónico.'
        : errorCrearAuth?.message || 'Error al crear la cuenta en Supabase Auth.'
      return new Response(JSON.stringify({ error: mensaje }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Crear la fila correspondiente en la tabla perfiles
    const { data: perfilCreado, error: errorPerfil } = await supabaseAdmin
      .from('perfiles')
      .upsert({
        id: usuarioCreado.user.id,
        nombre,
        rol,
        activo: true,
      })
      .select('id, nombre, rol, activo, created_at')
      .single()

    if (errorPerfil) {
      return new Response(
        JSON.stringify({
          error:
            'Usuario creado en autenticación, pero falló al crear el perfil: ' +
            errorPerfil.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        usuario: {
          ...perfilCreado,
          email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error inesperado del servidor.'
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
