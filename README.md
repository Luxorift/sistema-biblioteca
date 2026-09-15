# Sistema de Biblioteca

Frontend para la gestión diaria de una biblioteca, diseñado con controles grandes,
alto contraste y textos claros.

## Inicio rápido

1. Copie `.env.example` como `.env.local` y complete sus credenciales de Supabase.
2. Instale dependencias con `npm install`.
3. Inicie el proyecto con `npm run dev`.

La conexión a Supabase está centralizada en `src/services/supabase/client.js`.

## Recuperación de contraseña

La aplicación genera códigos de seis dígitos en `codigos_recuperacion`, con una
vigencia de 10 minutos y de un solo uso. La base de datos descrita no contiene
un correo ni un canal de entrega para los perfiles: antes de producción, conecte
`requestRecoveryCode` a una Edge Function que entregue el código de forma segura
y aplique políticas RLS para que los códigos no sean accesibles desde el cliente.
