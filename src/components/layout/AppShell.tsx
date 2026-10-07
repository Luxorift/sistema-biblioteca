import { BookOpen, LogOut } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { etiquetaRol, useAuth } from '@/features/auth'

// Marco común de las pantallas internas: cabecera con el usuario y contenido de la página.
export function AppShell() {
  const { perfil, salir } = useAuth()

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Saltar al contenido
      </a>

      <header className="border-borde border-b-2 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="text-primario flex min-h-12 items-center gap-3 text-2xl font-bold"
          >
            <BookOpen aria-hidden size={32} />
            Biblioteca
          </Link>

          <div className="flex items-center gap-4">
            {perfil && (
              <p className="text-right leading-tight">
                <span className="block text-lg font-bold">{perfil.nombre}</span>
                <span className="text-tinta-suave block text-base">
                  {etiquetaRol[perfil.rol]}
                </span>
              </p>
            )}
            <Button variante="secundario" onClick={salir}>
              <LogOut aria-hidden size={20} />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
