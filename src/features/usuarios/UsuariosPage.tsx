import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth'
import { CrearUsuarioDialog } from './components/CrearUsuarioDialog'
import { EditarUsuarioDialog } from './components/EditarUsuarioDialog'
import { TablaUsuarios } from './components/TablaUsuarios'
import type { UsuarioSistema } from './types'
import { useUsuarios } from './useUsuarios'

export function UsuariosPage() {
  const { perfil } = useAuth()
  const { data: usuarios = [], isLoading, isError, error } = useUsuarios()

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<UsuarioSistema | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const manejarExitoCreacion = (nuevo: UsuarioSistema) => {
    setMensajeExito(`El usuario "${nuevo.nombre}" ha sido registrado exitosamente.`)
    setTimeout(() => setMensajeExito(null), 6000)
  }

  const manejarExitoEdicion = () => {
    setMensajeExito('Los cambios del usuario se han guardado correctamente.')
    setTimeout(() => setMensajeExito(null), 6000)
  }

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de usuarios</h1>
          <p className="text-tinta-suave text-xl">
            Control de cuentas, roles y permisos de acceso al sistema bibliotecario.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
          >
            Volver al inicio
          </Link>
          <Button onClick={() => setModalCrearAbierto(true)}>
            <UserPlus aria-hidden size={20} />
            Registrar nuevo usuario
          </Button>
        </div>
      </div>

      {mensajeExito && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 p-4 text-green-900 font-bold text-lg">
          {mensajeExito}
        </div>
      )}

      {isError && (
        <Alert>
          {error instanceof Error
            ? error.message
            : 'No se pudieron cargar los usuarios. Recarga la página.'}
        </Alert>
      )}

      {isLoading ? (
        <p className="text-xl p-8">Cargando lista de usuarios…</p>
      ) : usuarios.length === 0 ? (
        <section className="border-borde rounded-2xl border-2 bg-white p-8 text-center space-y-3">
          <p className="text-2xl font-bold">No hay usuarios registrados</p>
          <p className="text-tinta-suave text-lg">
            Aún no se han configurado cuentas de acceso en el sistema.
          </p>
          <Button onClick={() => setModalCrearAbierto(true)}>
            <UserPlus aria-hidden size={20} />
            Registrar el primer usuario
          </Button>
        </section>
      ) : (
        <TablaUsuarios
          usuarios={usuarios}
          idUsuarioActual={perfil?.id}
          onEditar={(u) => setUsuarioParaEditar(u)}
        />
      )}

      {/* Diálogos modales */}
      <CrearUsuarioDialog
        abierto={modalCrearAbierto}
        onCerrar={() => setModalCrearAbierto(false)}
        onExito={manejarExitoCreacion}
      />

      <EditarUsuarioDialog
        usuario={usuarioParaEditar}
        abierto={Boolean(usuarioParaEditar)}
        onCerrar={() => setUsuarioParaEditar(null)}
        onExito={manejarExitoEdicion}
        esUsuarioActual={usuarioParaEditar?.id === perfil?.id}
      />
    </div>
  )
}
