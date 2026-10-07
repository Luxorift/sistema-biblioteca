import { Edit2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ETIQUETAS_ROL, type UsuarioSistema } from '../types'
import { useCambiarEstadoUsuario } from '../useUsuarios'

interface Props {
  usuarios: UsuarioSistema[]
  idUsuarioActual?: string
  onEditar: (usuario: UsuarioSistema) => void
}

function formatearFecha(iso: string): string {
  try {
    const fecha = new Date(iso)
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

export function TablaUsuarios({ usuarios, idUsuarioActual, onEditar }: Props) {
  const cambiarEstadoMutation = useCambiarEstadoUsuario()
  const [usuarioConfirmar, setUsuarioConfirmar] = useState<UsuarioSistema | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const ejecutarCambioEstado = async () => {
    if (!usuarioConfirmar) return
    setErrorAccion(null)
    try {
      await cambiarEstadoMutation.mutateAsync({
        id: usuarioConfirmar.id,
        activo: !usuarioConfirmar.activo,
      })
      setUsuarioConfirmar(null)
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'Error al cambiar estado.')
    }
  }

  return (
    <>
      <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
        <table className="w-full min-w-[750px] border-collapse text-left">
          <thead className="bg-papel">
            <tr>
              <th className="p-4 text-lg">Nombre</th>
              <th className="p-4 text-lg">Rol</th>
              <th className="p-4 text-lg">Estado</th>
              <th className="p-4 text-lg">Fecha de registro</th>
              <th className="p-4 text-lg">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const esActual = usuario.id === idUsuarioActual
              return (
                <tr key={usuario.id} className="border-borde border-t-2">
                  <td className="p-4">
                    <p className="font-bold text-lg">{usuario.nombre}</p>
                    {esActual && (
                      <span className="inline-block text-sm font-semibold text-primario">
                        (Tu cuenta actual)
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold border-2 ${
                        usuario.rol === 'admin'
                          ? 'border-lomo-morado text-lomo-morado bg-purple-50'
                          : 'border-lomo-azul text-lomo-azul bg-blue-50'
                      }`}
                    >
                      {usuario.rol === 'admin' ? (
                        <ShieldAlert aria-hidden size={16} />
                      ) : (
                        <ShieldCheck aria-hidden size={16} />
                      )}
                      {ETIQUETAS_ROL[usuario.rol]}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold border-2 ${
                        usuario.activo
                          ? 'border-green-500 text-green-900 bg-green-50'
                          : 'border-peligro text-peligro bg-red-50'
                      }`}
                    >
                      {usuario.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="p-4 text-tinta-suave">
                    {formatearFecha(usuario.created_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variante="secundario"
                        onClick={() => onEditar(usuario)}
                        aria-label={`Editar a ${usuario.nombre}`}
                      >
                        <Edit2 aria-hidden size={18} />
                        Editar
                      </Button>
                      {!esActual && (
                        <Button
                          variante={usuario.activo ? 'peligro' : 'secundario'}
                          onClick={() => setUsuarioConfirmar(usuario)}
                        >
                          {usuario.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación para activar o desactivar cuenta */}
      <Dialog
        abierto={Boolean(usuarioConfirmar)}
        titulo={
          usuarioConfirmar?.activo ? 'Desactivar acceso de usuario' : 'Activar cuenta'
        }
        onCerrar={() => {
          setUsuarioConfirmar(null)
          setErrorAccion(null)
        }}
      >
        {usuarioConfirmar && (
          <div className="space-y-5">
            {errorAccion && (
              <p className="text-peligro font-bold">{errorAccion}</p>
            )}
            <p className="text-lg">
              {usuarioConfirmar.activo ? (
                <>
                  ¿Estás seguro de que deseas desactivar la cuenta de{' '}
                  <strong className="text-tinta">{usuarioConfirmar.nombre}</strong>? El usuario ya no podrá iniciar sesión en la biblioteca hasta que sea reactivado.
                </>
              ) : (
                <>
                  ¿Deseas reactivar la cuenta de{' '}
                  <strong className="text-tinta">{usuarioConfirmar.nombre}</strong>? Podrá volver a acceder al sistema.
                </>
              )}
            </p>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
              <Button
                variante="secundario"
                onClick={() => {
                  setUsuarioConfirmar(null)
                  setErrorAccion(null)
                }}
                disabled={cambiarEstadoMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variante={usuarioConfirmar.activo ? 'peligro' : 'primario'}
                onClick={ejecutarCambioEstado}
                disabled={cambiarEstadoMutation.isPending}
              >
                {cambiarEstadoMutation.isPending
                  ? 'Guardando…'
                  : usuarioConfirmar.activo
                  ? 'Sí, desactivar cuenta'
                  : 'Sí, activar cuenta'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
