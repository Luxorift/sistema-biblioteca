import { BookOpen, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { etiquetaRol, useAuth } from '@/features/auth'

// Marco común de las pantallas internas: cabecera con el usuario y contenido de la página.
export function AppShell() {
  const { perfil, salir } = useAuth()
  const [confirmarSalida, setConfirmarSalida] = useState(false)

  const ejecutarCerrarSesion = async () => {
    setConfirmarSalida(false)
    await salir()
  }

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
            className="text-primario flex min-h-12 items-center gap-3 text-2xl font-bold transition-transform active:scale-[0.98]"
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
            <Button
              variante="peligro-suave"
              onClick={() => setConfirmarSalida(true)}
              aria-label="Cerrar sesión en el sistema"
            >
              <LogOut aria-hidden size={20} />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>

      {/* Modal accesible de confirmación para cerrar sesión */}
      <Dialog
        abierto={confirmarSalida}
        titulo="Cerrar sesión"
        onCerrar={() => setConfirmarSalida(false)}
      >
        <div className="space-y-6">
          <div>
            <p className="text-2xl font-bold text-tinta">
              ¿Está seguro que desea cerrar sesión?
            </p>
            <p className="text-tinta-suave text-lg mt-2">
              Tendrá que volver a escribir su correo y contraseña para acceder nuevamente a la biblioteca.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Button
              variante="secundario"
              onClick={() => setConfirmarSalida(false)}
            >
              No, continuar en el sistema
            </Button>
            <Button
              variante="peligro"
              onClick={ejecutarCerrarSesion}
            >
              <LogOut aria-hidden size={20} />
              Sí, cerrar sesión
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
