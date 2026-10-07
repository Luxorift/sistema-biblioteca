import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage, RequireAuth } from '@/features/auth'
import { HomePage } from '@/features/home'
import { MaterialesPage } from '@/features/materiales'
import { PersonasPage } from '@/features/personas'
import { PrestamosPage } from '@/features/prestamos'
import { EjemplaresPage } from '@/features/ejemplares'
import { EtiquetasPage } from '@/features/etiquetas'
import { CatalogosPage } from '@/features/catalogos'
import { UsuariosPage } from '@/features/usuarios'
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
          { path: 'materiales', element: <MaterialesPage tabInicial="buscar" /> },
          { path: 'buscar', element: <MaterialesPage tabInicial="buscar" /> },
          { path: 'agregar', element: <MaterialesPage tabInicial="agregar" /> },

          // Mostrador unificado de Préstamos y Devoluciones
          { path: 'prestamos', element: <PrestamosPage tabInicial="devolver" /> },
          { path: 'devolver', element: <PrestamosPage tabInicial="devolver" /> },
          { path: 'prestar', element: <PrestamosPage tabInicial="prestar" /> },
          { path: 'historial', element: <PrestamosPage tabInicial="historial" /> },

          // Otros módulos del sistema
          { path: 'personas', element: <PersonasPage /> },
          { path: 'ejemplares', element: <EjemplaresPage /> },
          { path: 'etiquetas', element: <EtiquetasPage /> },
          { path: 'catalogos', element: <CatalogosPage /> },

          // Administración protegida para administradores
          {
            element: <RequireAuth roles={['admin']} />,
            children: [{ path: 'usuarios', element: <UsuariosPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
