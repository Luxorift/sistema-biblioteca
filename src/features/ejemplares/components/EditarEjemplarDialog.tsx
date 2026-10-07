import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useUbicaciones } from '@/features/catalogos'
import { ErrorEjemplarPrestadoNoDirecto } from '../api'
import { esquemaEditarEjemplar, type FormularioEditarEjemplar } from '../schemas'
import type { EjemplarDetallado } from '../types'
import { useActualizarEstadoEjemplar } from '../useEjemplares'

interface EditarEjemplarDialogProps {
  ejemplar: EjemplarDetallado | null
  abierto: boolean
  onCerrar: () => void
  onGuardado: () => void
}

function valoresIniciales(ejemplar: EjemplarDetallado): FormularioEditarEjemplar {
  return {
    estado: ejemplar.estado,
    ubicacionId: ejemplar.ubicacionId,
    observaciones: ejemplar.observaciones ?? '',
  }
}

export function EditarEjemplarDialog({
  ejemplar,
  abierto,
  onCerrar,
  onGuardado,
}: EditarEjemplarDialogProps) {
  const ubicaciones = useUbicaciones()
  const actualizar = useActualizarEstadoEjemplar()

  const [confirmar, setConfirmar] = useState<FormularioEditarEjemplar | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  const formulario = useForm<FormularioEditarEjemplar>({
    resolver: zodResolver(esquemaEditarEjemplar),
    values: ejemplar ? valoresIniciales(ejemplar) : undefined,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = formulario

  const estaPrestado = ejemplar?.estado === 'prestado'

  const revisarYConfirmar = (datos: FormularioEditarEjemplar) => {
    setErrorGuardado(null)

    // Validar si intenta marcar como disponible un ejemplar prestado
    if (estaPrestado && datos.estado === 'disponible') {
      setErrorGuardado(
        'Este libro tiene un préstamo abierto. Para registrar su devolución, ve a la sección Devolver.',
      )
      return
    }

    setConfirmar(datos)
  }

  const guardar = async (datos: FormularioEditarEjemplar) => {
    if (!ejemplar) return
    setConfirmar(null)
    try {
      await actualizar.mutateAsync({
        ejemplarId: ejemplar.id,
        datos: {
          estado: datos.estado,
          ubicacionId: datos.ubicacionId,
          observaciones: datos.observaciones,
        },
      })
      onGuardado()
      onCerrar()
    } catch (error) {
      if (error instanceof ErrorEjemplarPrestadoNoDirecto) {
        setErrorGuardado(
          'No puedes marcar como disponible un ejemplar prestado sin registrar su devolución en Devolver.',
        )
      } else {
        setErrorGuardado(
          'No se pudieron guardar los cambios. Revisa tu conexión e intenta de nuevo.',
        )
      }
    }
  }

  if (!ejemplar) return null

  return (
    <>
      <Dialog
        abierto={abierto}
        titulo={`Mantenimiento de copia ${ejemplar.codigo}`}
        anchoAmplio
        onCerrar={onCerrar}
      >
        <form
          noValidate
          className="space-y-5"
          onSubmit={(evento: FormEvent) => {
            void handleSubmit(revisarYConfirmar)(evento)
          }}
        >
          {errorGuardado && <Alert>{errorGuardado}</Alert>}

          {/* Información de contexto */}
          <div className="border-borde space-y-1 rounded-xl border-2 bg-gray-50 p-4">
            <p className="text-xl font-bold text-gray-900">{ejemplar.titulo}</p>
            <p className="font-mono text-base font-bold text-gray-700">
              Código: {ejemplar.codigo}
            </p>
            {ejemplar.prestamoActivo && (
              <div className="mt-2 border-t border-gray-200 pt-2 text-base text-sky-900">
                <strong>Préstamo activo:</strong> {ejemplar.prestamoActivo.persona} (DNI{' '}
                {ejemplar.prestamoActivo.dni}) desde el{' '}
                {ejemplar.prestamoActivo.fechaPrestamo}.
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Estado físico */}
            <div className="space-y-1">
              <Select
                label="Estado físico del ejemplar"
                error={errors.estado?.message}
                {...register('estado')}
              >
                <option value="disponible" disabled={estaPrestado}>
                  Disponible {estaPrestado ? '(prestado actualmente)' : ''}
                </option>
                <option value="en_reparacion">En reparación (dañado o deshojado)</option>
                <option value="perdido">Perdido / extraviado</option>
                <option value="baja">De baja (retirado del inventario)</option>
                {estaPrestado && <option value="prestado">Prestado</option>}
              </Select>
              {estaPrestado && (
                <p className="text-tinta-suave text-base">
                  Para regresar este ejemplar al inventario disponible, usa la opción{' '}
                  <strong>Devolver</strong>.
                </p>
              )}
            </div>

            {/* Ubicación física */}
            <div className="space-y-1">
              <Select
                label="Ubicación (estante y nivel)"
                {...register('ubicacionId', {
                  setValueAs: (valor) => (valor ? Number(valor) : null),
                })}
              >
                <option value="">Sin ubicación asignada</option>
                {(ubicaciones.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    Estante {u.estante}, Nivel {u.nivel}
                  </option>
                ))}
              </Select>
              <p className="text-tinta-suave text-base">
                Lugar físico en la biblioteca donde se guarda.
              </p>
            </div>
          </div>

          {/* Observaciones físicas */}
          <Textarea
            label="Observaciones físicas o motivo de mantenimiento"
            error={errors.observaciones?.message}
            placeholder="Ej: Lomo despegado, falta tapa trasera, extraviado por alumno, etc."
            rows={3}
            {...register('observaciones')}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={actualizar.isPending}>
              Revisar y guardar cambios
            </Button>
            <Button type="button" variante="secundario" onClick={onCerrar}>
              Cancelar
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal de confirmación y advertencia */}
      <Dialog
        abierto={Boolean(confirmar)}
        titulo="Confirmar cambio de estado"
        onCerrar={() => setConfirmar(null)}
      >
        {confirmar && (
          <div className="space-y-5">
            <p>
              Vas a cambiar los datos de la copia <strong>{ejemplar.codigo}</strong> ({ejemplar.titulo}).
            </p>

            {confirmar.estado === 'baja' && (
              <Alert>
                Advertencia: Dar de baja este libro lo retirará del inventario activo.
                No se podrá prestar a nadie.
              </Alert>
            )}

            {confirmar.estado === 'perdido' && (
              <Alert>
                Advertencia: Se registrará el libro como perdido. Quedará archivado con ese estado.
              </Alert>
            )}

            {confirmar.estado === 'en_reparacion' && (
              <Alert>
                El libro pasará a reparación. No estará disponible para nuevos préstamos hasta que se repare.
              </Alert>
            )}

            {estaPrestado && confirmar.estado !== 'prestado' && (
              <p className="text-tinta-suave text-base">
                Nota: Este libro está actualmente en préstamo. Cambiar su estado a{' '}
                <strong>{confirmar.estado}</strong> guardará el daño o pérdida física.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => void guardar(confirmar)}
                disabled={actualizar.isPending}
              >
                {actualizar.isPending ? 'Guardando…' : 'Sí, confirmar cambio'}
              </Button>
              <Button variante="secundario" onClick={() => setConfirmar(null)}>
                Seguir revisando
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
