import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage, RequireAuth } from '@/features/auth'
import { HomePage } from '@/features/home'
import { NotFoundPage } from './NotFoundPage'

// Mapa de toda la app. Cada ruta apunta a una página; las páginas viven en src/features/*.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    // Todo lo de abajo exige sesión y perfil activo.
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },

          // Módulo unificado de Materiales y Libros (búsqueda y registro)
          {
            path: 'materiales',
            lazy: async () => {
              const { MaterialesPage } =
                await import('@/features/materiales/MaterialesPage')
              return { Component: () => <MaterialesPage tabInicial="buscar" /> }
            },
          },
          {
            path: 'buscar',
            lazy: async () => {
              const { MaterialesPage } =
                await import('@/features/materiales/MaterialesPage')
              return { Component: () => <MaterialesPage tabInicial="buscar" /> }
            },
          },
          {
            path: 'agregar',
            lazy: async () => {
              const { MaterialesPage } =
                await import('@/features/materiales/MaterialesPage')
              return { Component: () => <MaterialesPage tabInicial="agregar" /> }
            },
          },

          // Mostrador unificado de Préstamos y Devoluciones
          {
            path: 'prestamos',
            lazy: async () => {
              const { PrestamosPage } = await import('@/features/prestamos/PrestamosPage')
              return { Component: () => <PrestamosPage tabInicial="devolver" /> }
            },
          },
          {
            path: 'devolver',
            lazy: async () => {
              const { PrestamosPage } = await import('@/features/prestamos/PrestamosPage')
              return { Component: () => <PrestamosPage tabInicial="devolver" /> }
            },
          },
          {
            path: 'prestar',
            lazy: async () => {
              const { PrestamosPage } = await import('@/features/prestamos/PrestamosPage')
              return { Component: () => <PrestamosPage tabInicial="prestar" /> }
            },
          },
          {
            path: 'historial',
            lazy: async () => {
              const { PrestamosPage } = await import('@/features/prestamos/PrestamosPage')
              return { Component: () => <PrestamosPage tabInicial="historial" /> }
            },
          },

          // Otros módulos del sistema
          {
            path: 'credenciales',
            lazy: async () => {
              const { CredencialesPage } =
                await import('@/features/personas/CredencialesPage')
              return { Component: CredencialesPage }
            },
          },
          {
            path: 'personas',
            lazy: async () => {
              const { PersonasPage } = await import('@/features/personas/PersonasPage')
              return { Component: () => <PersonasPage /> }
            },
          },
          {
            path: 'ejemplares',
            lazy: async () => {
              const { EjemplaresPage } =
                await import('@/features/ejemplares/EjemplaresPage')
              return { Component: () => <EjemplaresPage /> }
            },
          },
          {
            path: 'etiquetas',
            lazy: async () => {
              const { EtiquetasPage } = await import('@/features/etiquetas/EtiquetasPage')
              return { Component: () => <EtiquetasPage /> }
            },
          },
          {
            path: 'catalogos',
            lazy: async () => {
              const { CatalogosPage } = await import('@/features/catalogos/CatalogosPage')
              return { Component: () => <CatalogosPage /> }
            },
          },

          // Administración protegida para administradores
          {
            element: <RequireAuth roles={['admin']} />,
            children: [
              {
                path: 'usuarios',
                lazy: async () => {
                  const { UsuariosPage } =
                    await import('@/features/usuarios/UsuariosPage')
                  return { Component: () => <UsuariosPage /> }
                },
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
