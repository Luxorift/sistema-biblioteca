import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage, RequireAuth } from '@/features/auth'
import { BuscarMaterialPage } from '@/features/buscar-materiales'
import { HomePage } from '@/features/home'
import { AgregarMaterialPage } from '@/features/materiales'
import { PersonasPage } from '@/features/personas'
import { PrestarPage } from '@/features/prestamos'
import { DevolverPage } from '@/features/devoluciones'
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
          // Temporales: se reemplazan por la página real de cada feature.
          { path: 'buscar', element: <BuscarMaterialPage /> },
          { path: 'prestar', element: <PrestarPage /> },
          { path: 'devolver', element: <DevolverPage /> },
          { path: 'agregar', element: <AgregarMaterialPage /> },
          { path: 'personas', element: <PersonasPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
