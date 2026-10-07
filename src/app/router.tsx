import { createBrowserRouter } from 'react-router-dom'
import { ComingSoonPage } from '@/components/feedback/ComingSoonPage'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage, RequireAuth } from '@/features/auth'
import { HomePage } from '@/features/home'
import { AgregarMaterialPage } from '@/features/materiales'
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
          { path: 'buscar', element: <ComingSoonPage titulo="Buscar material" /> },
          { path: 'prestar', element: <ComingSoonPage titulo="Prestar" /> },
          { path: 'devolver', element: <ComingSoonPage titulo="Devolver" /> },
          { path: 'agregar', element: <AgregarMaterialPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
