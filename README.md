# Biblioteca: frontend

Aplicación web para gestionar el inventario y los préstamos de una biblioteca.
Frontend en React; la base de datos, el login y los permisos están en Supabase.

**Tecnologías:** React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · TanStack Query ·
React Hook Form + Zod · Supabase.

## 1. Puesta en marcha

Requisitos: Node.js 20.19 o superior (recomendado 22 LTS) y VS Code.

```bash
npm install
cp .env.example .env.local     # en Windows: copy .env.example .env.local
# Abre .env.local y pega la URL y la clave pública (anon/publishable) de tu proyecto Supabase
npm run dev
```

Al abrir la carpeta en VS Code acepta instalar las extensiones recomendadas
(ESLint, Prettier, Tailwind CSS IntelliSense). Con ellas el código se formatea solo al guardar.

## 2. Base de datos

1. En Supabase abre **SQL Editor** y ejecuta `supabase/migrations/20261007000000_esquema_inicial.sql`.
2. Crea tu usuario en **Authentication > Users** y copia su UUID.
3. Dale un perfil (sin perfil activo, la seguridad de la base bloquea todo):

```sql
insert into public.perfiles (id, nombre, rol)
values ('UUID-DEL-USUARIO', 'Tu nombre', 'admin');   -- o 'bibliotecario'
```

## 3. Estructura

```
src/
├─ app/            Arranque: App, providers, router y página 404
├─ components/
│  ├─ ui/          Piezas genéricas: Button, TextField, PasswordField, Alert
│  ├─ layout/      Marco de las pantallas internas (AppShell)
│  └─ feedback/    Pantallas de estado: cargando, "próximamente"
├─ features/       Una carpeta por funcionalidad del negocio
│  ├─ auth/        Login, sesión, perfil y rol
│  └─ home/        Inicio con las 4 acciones principales
├─ lib/            Configuración y utilidades: supabase.ts, env.ts, cn.ts
└─ styles/         Tokens de diseño (colores, fuente) y estilos base
supabase/migrations/   SQL de la base de datos, versionado
```

Dentro de cada feature:

| Archivo | Para qué sirve |
|---|---|
| `api.ts` | Las llamadas a Supabase de esa feature. Es el único lugar donde se toca la base. |
| `types.ts` | Tipos de TypeScript del dominio. |
| `use*.ts` | Hooks: lógica reutilizable (consultas, estado). |
| `*Page.tsx` | Una pantalla completa. Solo arma componentes y hooks. |
| `components/` | Piezas que solo usa esa feature. |
| `index.ts` | Lo único que las otras partes pueden importar de la feature. |

## 4. Reglas para mantenerlo ordenado

1. **Solo `api.ts` habla con Supabase.** Los componentes y páginas nunca llaman a `supabase` directo.
2. **Una feature importa de otra solo por su `index.ts`**, nunca por sus archivos internos.
3. **`components/ui`, `components/feedback` y `lib` no conocen el negocio:** no importan de `features/`.
4. **Un componente por archivo**, con nombre igual al del archivo.
5. **Colores y fuente salen de `styles/index.css`.** No se escriben colores sueltos (`#123456`) en los componentes.
6. **Los textos de error hablan claro:** qué pasó y qué hacer, sin códigos técnicos.
7. **Nombres:** lo del negocio en español (`material`, `ejemplar`, `prestamo`), lo técnico en inglés (`Provider`, `Page`).

## 5. Cómo agregar una funcionalidad (ejemplo: materiales)

1. Crear `src/features/materiales/` con `types.ts` y `api.ts` (funciones como `buscarMateriales`
   o `registrarMaterial`, que llama a `supabase.rpc('registrar_material', …)`).
2. Crear hooks con TanStack Query (`useMateriales.ts`) que usen esas funciones.
3. Crear `BuscarMaterialPage.tsx` y sus componentes.
4. Exportar la página en `index.ts` y reemplazar el `ComingSoonPage` correspondiente en `app/router.tsx`.

## 6. Accesibilidad (criterios del proyecto)

- Texto base de 18 px y fuente Atkinson Hyperlegible (diseñada para lectura fácil).
- Contraste alto, botones de al menos 48 px, foco de teclado siempre visible.
- Cada botón lleva texto, no solo ícono. Los íconos son decorativos (`aria-hidden`).
- Los errores se anuncian a lectores de pantalla (`role="alert"`) y no dependen solo del color.
- Se respeta `prefers-reduced-motion`.

## 7. Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Revisa tipos y genera la versión de producción en `dist/` |
| `npm run lint` | Busca errores y malas prácticas |
| `npm run format` | Da formato a todo el código |
| `npm run typecheck` | Solo revisa tipos |

Tipos de la base (opcional, cuando quieras autocompletado de tablas):
`npx supabase gen types typescript --project-id TU_ID > src/types/database.types.ts`
y luego pasar `Database` a `createClient<Database>(…)` en `src/lib/supabase.ts`.

## 8. Publicar (GitHub + Vercel)

1. `git init`, primer commit y subir a un repositorio nuevo de GitHub.
2. En Vercel: **Add New > Project**, importar el repositorio (preset **Vite**).
3. En **Environment Variables** agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. `vercel.json` ya incluye la regla que evita el error 404 al recargar rutas como `/prestar`.

Flujo de ramas: `main` es lo que usa el bibliotecario. Cada cambio nuevo va en su rama
(`feature/buscar-material`) y entra a `main` por pull request. Vercel genera un enlace de prueba por rama.

**Nunca** subas `.env.local` ni la clave `service_role` / secret de Supabase.

## 9. Estado actual

Hecho: login, protección de rutas por sesión y rol, perfil, marco de pantallas e inicio.
Pendiente: buscar, agregar material, prestar, devolver, personas, etiquetas con código de barras/QR
y administración de usuarios. Las rutas ya existen y muestran "Esta sección se está construyendo".
