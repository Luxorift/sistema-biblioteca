# Configuración segura de SMTP

## Entorno local de Supabase

1. Copie `supabase/functions/.env.example` como `supabase/functions/.env.local`.
2. Reemplace únicamente en `.env.local` los valores de `SMTP_USER` y `SMTP_PASS` por las credenciales reales. No modifique el archivo de ejemplo.
3. Ejecute la función localmente con:

```bash
supabase functions serve enviar-codigo --env-file supabase/functions/.env.local
```

Los archivos `.env` y `.env.local` están excluidos de Git tanto en la raíz como en `supabase/functions`.

## Supabase en la nube

Inicie sesión en la CLI y ejecute este comando desde la raíz del proyecto. Sustituya los valores de ejemplo en su terminal; no los agregue a código, commits ni capturas.

```bash
supabase secrets set --project-ref TU_PROJECT_REF SMTP_HOST="smtp.gmail.com" SMTP_PORT="465" SMTP_USER="tu_correo_real@gmail.com" SMTP_PASS="tu_contraseña_de_aplicacion_real"
```

Después despliegue la función:

```bash
supabase functions deploy enviar-codigo --project-ref TU_PROJECT_REF
```
