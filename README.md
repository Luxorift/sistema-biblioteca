# Biblioteca: frontend

Aplicación web para gestionar el inventario y los préstamos de una biblioteca.
Frontend en React; la base de datos, el login y los permisos están en Supabase.

**Tecnologías:** React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · TanStack Query ·
React Hook Form + Zod · Supabase.

## 1. Puesta en marcha

Requisitos: Node.js 22.18 o superior (recomendado 24 LTS) y VS Code.

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
2. Ejecuta después `supabase/migrations/20261031000000_consistencia_biblioteca.sql`.
3. Crea tu usuario en **Authentication > Users** y copia su UUID.
4. Dale un perfil (sin perfil activo, la seguridad de la base bloquea todo):

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

| Archivo       | Para qué sirve                                                                   |
| ------------- | -------------------------------------------------------------------------------- |
| `api.ts`      | Las llamadas a Supabase de esa feature. Es el único lugar donde se toca la base. |
| `types.ts`    | Tipos de TypeScript del dominio.                                                 |
| `use*.ts`     | Hooks: lógica reutilizable (consultas, estado).                                  |
| `*Page.tsx`   | Una pantalla completa. Solo arma componentes y hooks.                            |
| `components/` | Piezas que solo usa esa feature.                                                 |
| `index.ts`    | Lo único que las otras partes pueden importar de la feature.                     |

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

| Comando             | Qué hace                                                  |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                                    |
| `npm run build`     | Revisa tipos y genera la versión de producción en `dist/` |
| `npm run lint`      | Busca errores y malas prácticas                           |
| `npm run format`    | Da formato a todo el código                               |
| `npm run typecheck` | Solo revisa tipos                                         |
| `npm test`          | Pruebas de regresión SQL, fechas y creación de usuarios   |

Tipos de la base (opcional, cuando quieras autocompletado de tablas):
`npx supabase gen types typescript --project-id TU_ID > src/types/database.types.ts`
y luego pasar `Database` a `createClient<Database>(…)` en `src/lib/supabase.ts`.

## 8. Publicar (GitHub + Vercel)

1. `git init`, primer commit y subir a un repositorio nuevo de GitHub.
2. En Vercel: **Add New > Project**, importar el repositorio (preset **Vite**).
3. En **Environment Variables** agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. `vercel.json` ya incluye la regla que evita el error 404 al recargar rutas como `/prestar`.

Flujo de ramas: `main` es producción; `dev` integra los cambios. Antes de empezar,
actualiza las referencias remotas y comprueba que `dev` incluye `main`. Crea cada
rama desde `dev`: `feature/nombre-en-espanol` para funcionalidades y
`fix/nombre-en-espanol` para correcciones. Los commits usan `feat:` o `fix:` con
mensajes en español. Sube la rama y solicita revisión hacia `dev`; el responsable
del repositorio aprueba los merges. Vercel genera un enlace de prueba por rama.

**Nunca** subas `.env.local` ni la clave `service_role` / secret de Supabase.

## 9. Estado actual

Implementado: sesión y roles, búsqueda/registro/edición de materiales, ejemplares,
personas, préstamos, devoluciones, historial, catálogos, etiquetas con códigos de
barras/QR y administración de usuarios. Las pantallas se cargan por ruta.

La edición de materiales se realiza con una RPC transaccional. PostgreSQL valida
los estados de ejemplares, protege el historial e impide prestar a personas
inactivas o desactivarlas con préstamos abiertos. Primero se registra la devolución
y después se cambia el estado físico del ejemplar si necesita reparación, baja o
registro de pérdida. Todas las fechas del negocio usan `America/Lima`.

La búsqueda de personas se ejecuta en servidor y muestra páginas de 25 registros.
Los cambios de inventario y circulación invalidan las consultas relacionadas.

## 10. Actualizar una base existente

1. En el SQL Editor de Supabase ejecuta **solo**
   `supabase/migrations/20261031000000_consistencia_biblioteca.sql` si ya aplicaste el
   esquema inicial. No vuelvas a ejecutar el inicial sobre tablas existentes.
2. La migración conserva los datos. Reconcilia los estados de ejemplares con los
   préstamos abiertos. Si hay varios préstamos abiertos para un ejemplar, falla y
   revierte la migración; primero hay que corregir esos registros.
3. Vuelve a desplegar la función: `supabase functions deploy crear-usuario`.
4. Publica el frontend actualizado después de aplicar la migración. Sus pantallas
   de edición, devolución y personas requieren las nuevas RPC.
5. Comprueba con una cuenta de prueba: editar material, prestar, devolver y buscar
   una persona. No se requieren cambios en las variables públicas del frontend.

El export de tablas del panel de Supabase sirve como referencia; no reemplaza las
migraciones porque no incluye todas las funciones, políticas ni triggers.

## 11. Verificación local

Requisitos para las pruebas: Node.js 22.18+ (recomendado Node.js 24 LTS).
Ejecuta `npm test`, `npm run lint` y `npm run build`.

Las pruebas SQL ejecutan las dos migraciones completas en PostgreSQL embebido
(PGlite), incluidas las extensiones `unaccent` y `pg_trgm`. Simulan el esquema
mínimo de Auth y el rol `authenticated`; comprueban RLS, rollback, estados,
préstamos, devoluciones y búsqueda paginada sin acceder al Supabase remoto.
Las pruebas de Edge Function ejecutan el handler con clientes simulados, verifican
la compensación ante errores y preservación de contraseñas. No sustituyen una
prueba de despliegue contra Supabase ni simulan sesiones concurrentes.

## 12. Credenciales de biblioteca para personas

La migración `20261031000000_consistencia_biblioteca.sql` incluye `personas.codigo`:
un código único, obligatorio y generado automáticamente como `PER-000001`, para
alumnos, docentes y cualquier otro tipo de persona. También se asigna a las personas
existentes. No contiene el DNI ni cambia al editar nombres, tipo o estado; el
identificador de la persona queda protegido. Los IDs de más de seis dígitos se
conservan completos. Para imprimir un código de barras, codifica exactamente este
valor como CODE128 y muestra el mismo texto debajo para poder digitarlo.

Si ya ejecutaste la versión anterior de esta migración en el SQL Editor, puedes
volver a ejecutar el archivo actualizado: las nuevas columnas, índices y funciones
se crean sin duplicar las credenciales. No borres personas para reimprimirlas: usa
su código existente.

La RPC `consultar_credencial(p_codigo text)` acepta el código digitado o escaneado,
normaliza mayúsculas y espacios/saltos de línea en los extremos, y busca una
coincidencia exacta. Devuelve `null` si no existe; exige personal autenticado con
perfil activo. No acepta un código de libro ni el DNI como sustituto de la credencial.

Ejemplo de integración desde una API del frontend:

```ts
const { data, error } = await supabase.rpc('consultar_credencial', {
  p_codigo: 'PER-000001',
})
```

La respuesta contiene:

- `persona`: ID, código, nombres, apellidos, DNI, tipo y estado activo.
- `resumen`: `prestamos_pendientes`, `prestamos_atrasados` y `max_dias_atraso`.
- `prestamos_pendientes`: ID del préstamo, ID y código del ejemplar, material,
  título, fechas, `esta_atrasado` y `dias_atraso`.

Un préstamo vence al terminar su fecha límite en Perú; los préstamos sin fecha
límite no se consideran atrasados. Los devueltos se excluyen de los pendientes.
Las personas inactivas se reconocen para informar al bibliotecario, pero la base
sigue impidiendo registrarles nuevos préstamos. La consulta no modifica datos:
para devolver un libro, se confirma el préstamo elegido y se usa la RPC existente
`devolver_prestamo(p_prestamo_id, p_fecha)`.

`buscar_personas` también devuelve el código y permite buscarlo.

### Usar las credenciales

- En **Personas**, usa **Ver credencial** para una persona o **Imprimir credenciales
  de biblioteca** para seleccionar varias. La selección se conserva entre páginas.
- En `/credenciales`, revisa la vista previa e imprime al 100 % de escala. El código
  CODE128 tiene fondo blanco y el mismo texto debajo, también en modo oscuro.
- En **Préstamos y devoluciones**, coloca el cursor en **Código de credencial**.
  Los lectores que funcionan como teclado pueden enviar el código y Enter; también
  se puede digitar y pulsar **Consultar credencial**.
- La consulta muestra pendientes y atrasos. **Prestar a esta persona** selecciona
  al titular en el formulario; los libros y la confirmación se eligen después.
- **Devolver BIB-…** filtra el préstamo elegido en la pantalla existente de
  devolución. El bibliotecario debe confirmar antes de registrar la devolución.

Las pruebas de interfaz (`npm run test:ui`) cubren estos recorridos con respuestas
controladas, incluido el SVG del código de barras, la selección entre páginas y
las confirmaciones. `npm run test:datos` ejecuta las pruebas SQL y de Edge Function.
`npm test` ejecuta ambas suites.
