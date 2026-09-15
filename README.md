# 📚 Sistema de Biblioteca

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind%20CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-JS-3ECF8E?logo=supabase&logoColor=white)

Una aplicación para gestionar una biblioteca de forma rápida, clara y segura. Está diseñada para que bibliotecarios de todas las edades realicen préstamos, devoluciones y tareas administrativas sin pasos innecesarios.

## ✨ Enfoque de accesibilidad

- Texto base grande, alto contraste y controles de al menos 48 px.
- Etiquetas descriptivas, foco visible y mensajes de error en español.
- Flujos simples sin modales complejos.
- Recuperación de contraseña mediante códigos temporales de un solo uso.

## 🧰 Stack tecnológico

| Tecnología | Uso |
| --- | --- |
| React + Vite | Interfaz web rápida y modular. |
| Tailwind CSS | Sistema visual accesible y consistente. |
| Supabase JS | Autenticación, datos y llamadas a Edge Functions. |
| Supabase Edge Functions (Deno) | Envío y validación segura de códigos de recuperación. |

## 🗂️ Arquitectura del proyecto

```text
src/
├── components/           # Componentes reutilizables y atómicos
├── hooks/                # Estado y lógica reutilizable
├── pages/                # Pantallas y rutas de la aplicación
├── services/
│   └── supabase/         # Cliente y servicios de datos
├── styles/               # Estilos globales de Tailwind
└── utils/                # Utilidades compartidas

supabase/functions/
├── enviar-codigo/        # Genera y envía el código por correo
└── validar-codigo/       # Valida el código y cambia la contraseña
```

## 🗃️ Arquitectura de datos

| Tabla | Responsabilidad |
| --- | --- |
| `perfiles` | Nombre y rol del personal (`Administrador` o `Bibliotecario`). |
| `miembros` | Personas registradas que pueden solicitar materiales. |
| `materiales` | Catálogo, estado y detalles adicionales en JSONB. |
| `prestamos` | Historial de préstamos, devoluciones y fechas. |
| `codigos_recuperacion` | Códigos de recuperación temporales, vencidos o usados. |

## 🚀 Instalación local

### 1. Requisitos

- Node.js 18 o superior.
- Una cuenta y proyecto de Supabase.
- Supabase CLI, si trabajará con las Edge Functions.

### 2. Clonar e instalar dependencias

```bash
git clone https://github.com/Luxorift/sistema-biblioteca.git
cd sistema-biblioteca
npm install
```

### 3. Configurar el frontend

Copie la plantilla de variables y complete las credenciales públicas de su proyecto:

```bash
Copy-Item .env.example .env.local
```

En macOS o Linux:

```bash
cp .env.example .env.local
```

Edite `.env.local` y asigne `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca suba este archivo a Git.

### 4. Configurar correo para las Edge Functions

Copie la plantilla específica de funciones y coloque las credenciales SMTP únicamente en su archivo local:

```bash
Copy-Item supabase/functions/.env.example supabase/functions/.env.local
supabase functions serve enviar-codigo --env-file supabase/functions/.env.local
```

Consulte [la guía de configuración SMTP](docs/configuracion-smtp.md) para publicar secretos cifrados y desplegar las funciones en Supabase.

### 5. Ejecutar la aplicación

```bash
npm run dev
```

Abra la dirección mostrada por Vite, normalmente `http://localhost:5173`.

## 🧪 Verificación de producción

```bash
npm run build
```

El comando valida los tipos de TypeScript y genera el paquete optimizado en `dist/`.

## 🔐 Seguridad

- Los archivos `.env`, `.env.local` y claves privadas están excluidos de Git.
- Las credenciales SMTP se consumen solo mediante secretos de Supabase.
- Las funciones de recuperación usan `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el backend; esa clave nunca debe llegar al navegador.

## 🌿 Flujo de ramas

- `main`: historial estable.
- `dev`: integración de desarrollo.
- `feature/nombre`: funcionalidades nuevas, creadas desde `dev`.
- `fix/nombre`: correcciones, creadas desde `dev`.

Todo cambio se revisa y fusiona hacia `dev` antes de llegar a `main`.
