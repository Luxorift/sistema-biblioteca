import { BookOpen, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { BotonTema } from '@/components/ui/BotonTema'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useAuth } from '@/features/auth'

// Marco común de las pantallas internas: barra superior limpia y contenido centrado.
export function AppShell() {
  const { perfil, salir } = useAuth()
  const [confirmarSalida, setConfirmarSalida] = useState(false)

  const primerNombre = perfil?.nombre ? perfil.nombre.split(' ')[0] : 'Bibliotecario'

  const ejecutarCerrarSesion = async () => {
    setConfirmarSalida(false)
    await salir()
  }

  return (
    <div className="min-h-dvh bg-papel text-tinta transition-colors duration-200">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Saltar al contenido
      </a>

      {/* Barra Superior (Header) limpia: saludo a la izquierda, controles a la derecha */}
      <header className="border-borde border-b-2 bg-white transition-colors duration-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:py-4">
          {/* Parte izquierda: ícono de biblioteca y saludo claro */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="text-primario flex min-h-12 items-center justify-center rounded-xl transition-transform active:scale-[0.98]"
              title="Ir al inicio de la biblioteca"
              aria-label="Ir al inicio de la biblioteca"
            >
              <BookOpen aria-hidden size={36} strokeWidth={2.2} />
            </Link>

            <div className="leading-tight">
              <span className="block text-2xl sm:text-3xl font-bold tracking-tight text-tinta">
                Hola, {primerNombre}
              </span>
              <span className="text-tinta-suave block text-base sm:text-lg">
                ¿Qué quieres hacer hoy?
              </span>
            </div>
          </div>

          {/* Parte derecha: botón de tema y botón rojo de Cerrar Sesión */}
          <div className="flex items-center gap-3">
            <BotonTema />

            <Button
              variante="peligro-suave"
              onClick={() => setConfirmarSalida(true)}
              aria-label="Cerrar sesión en el sistema"
            >
              <LogOut aria-hidden size={20} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido centrado y equilibrado en pantallas grandes */}
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
