# Edge Function: crear-usuario

Función segura de Supabase para que los administradores creen cuentas de nuevos usuarios (admin o bibliotecario) sin exponer la clave `service_role` en el frontend.

## Despliegue en Supabase

Para desplegar esta función en tu proyecto Supabase:

```bash
supabase functions deploy crear-usuario
```

Las variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` se inyectan automáticamente en el entorno de Supabase Edge Functions.
