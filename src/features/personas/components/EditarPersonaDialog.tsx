import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { ErrorPersonaConPrestamosActivos } from '../api'
import { esquemaEditarPersona, type FormularioEditarPersona } from '../schemas'
import type { Persona, TipoPersona } from '../types'
import { useActualizarPersona, useCrearTipoPersona } from '../usePersonas'

interface EditarPersonaDialogProps {
  persona: Persona | null
  abierto: boolean
  tipos: TipoPersona[]
  onCerrar: () => void
  onGuardado: () => void
}

function valoresIniciales(persona: Persona): FormularioEditarPersona {
  return {
    tipoPersonaId: persona.tipoPersonaId,
    nombres: persona.nombres,
    apellidoPaterno: persona.apellidoPaterno,
    apellidoMaterno: persona.apellidoMaterno ?? '',
    correo: persona.correo ?? '',
    activo: persona.activo,
  }
}

function mensajeError(error: unknown): string {
  if (error instanceof ErrorPersonaConPrestamosActivos) {
    return `Esta persona tiene ${error.prestamosPendientes} ${
      error.prestamosPendientes === 1 ? 'préstamo pendiente' : 'préstamos pendientes'
    } sin devolver. No puedes desactivarla hasta devolver los materiales.`
  }
  return 'No se pudieron guardar los cambios. Revisa los datos y tu conexión, luego intenta de nuevo.'
}

export function EditarPersonaDialog({
  persona,
  abierto,
  tipos,
  onCerrar,
  onGuardado,
}: EditarPersonaDialogProps) {
  const actualizar = useActualizarPersona()
  const crearTipo = useCrearTipoPersona()
  const [confirmar, setConfirmar] = useState<FormularioEditarPersona | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [nuevoTipoAbierto, setNuevoTipoAbierto] = useState(false)
  const [nombreNuevoTipo, setNombreNuevoTipo] = useState('')
  const [errorNuevoTipo, setErrorNuevoTipo] = useState<string | null>(null)

  const formulario = useForm<FormularioEditarPersona>({
    resolver: zodResolver(esquemaEditarPersona),
    values: persona ? valoresIniciales(persona) : undefined,
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = formulario

  const prestamosActivos = persona?.prestamosActivos ?? 0

  const revisarYConfirmar = (datos: FormularioEditarPersona) => {
    if (!datos.activo && prestamosActivos > 0) {
      setErrorGuardado(
        `Esta persona tiene ${prestamosActivos} ${
          prestamosActivos === 1 ? 'préstamo pendiente' : 'préstamos pendientes'
        } sin devolver. No puedes desactivarla hasta registrar la devolución.`,
      )
      return
    }
    setErrorGuardado(null)
    setConfirmar(datos)
  }

  const guardar = async (datos: FormularioEditarPersona) => {
    if (!persona) return
    setConfirmar(null)
    try {
      await actualizar.mutateAsync({
        personaId: persona.id,
        datos: {
          tipoPersonaId: datos.tipoPersonaId,
          nombres: datos.nombres,
          apellidoPaterno: datos.apellidoPaterno,
          apellidoMaterno: datos.apellidoMaterno,
          correo: datos.correo,
          activo: datos.activo,
        },
      })
      onGuardado()
      onCerrar()
    } catch (error) {
      setErrorGuardado(mensajeError(error))
    }
  }

  const guardarNuevoTipo = async () => {
    setErrorNuevoTipo(null)
    if (!nombreNuevoTipo.trim()) {
      setErrorNuevoTipo('Escribe el tipo de persona.')
      return
    }
    try {
      const tipo = await crearTipo.mutateAsync(nombreNuevoTipo.trim())
      setValue('tipoPersonaId', tipo.id)
      setNombreNuevoTipo('')
      setNuevoTipoAbierto(false)
    } catch {
      setErrorNuevoTipo('No se pudo guardar el tipo. Puede que ya exista.')
    }
  }

  if (!persona) return null

  return (
    <>
      <Dialog
        abierto={abierto}
        titulo="Editar persona"
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

          {prestamosActivos > 0 && (
            <p className="text-tinta-suave text-lg">
              Esta persona tiene <strong>{prestamosActivos}</strong>{' '}
              {prestamosActivos === 1
                ? 'préstamo pendiente'
                : 'préstamos pendientes'}{' '}
              sin devolver.
            </p>
          )}

          <div className="space-y-1">
            <TextField
              label="DNI (solo lectura)"
              value={persona.dni}
              disabled
            />
            <p className="text-tinta-suave text-base">
              El DNI no se puede modificar para preservar la integridad e historial del sistema.
            </p>
          </div>

          <TextField
            label="Nombres"
            error={errors.nombres?.message}
            {...register('nombres')}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Apellido paterno"
              error={errors.apellidoPaterno?.message}
              {...register('apellidoPaterno')}
            />
            <TextField
              label="Apellido materno (opcional)"
              error={errors.apellidoMaterno?.message}
              {...register('apellidoMaterno')}
            />
          </div>

          <div className="space-y-2">
            <Select
              label="Tipo de persona"
              error={errors.tipoPersonaId?.message}
              {...register('tipoPersonaId', {
                setValueAs: (valor) => Number(valor),
              })}
            >
              <option value="">Elige una opción</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variante="secundario"
              onClick={() => setNuevoTipoAbierto(true)}
            >
              Agregar nuevo tipo
            </Button>
          </div>

          <TextField
            label="Correo electrónico (opcional)"
            type="email"
            error={errors.correo?.message}
            {...register('correo')}
          />

          <div className="space-y-1">
            <Select
              label="Estado"
              {...register('activo', {
                setValueAs: (valor) => valor === 'true' || valor === true,
              })}
            >
              <option value="true">Activo</option>
              <option value="false" disabled={prestamosActivos > 0}>
                Inactivo
              </option>
            </Select>
            {prestamosActivos > 0 ? (
              <p className="text-tinta-suave text-base">
                No se puede desactivar a la persona mientras tenga materiales en préstamo.
              </p>
            ) : (
              <p className="text-tinta-suave text-base">
                Las personas inactivas no pueden recibir préstamos nuevos.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={actualizar.isPending}>
              Revisar y guardar
            </Button>
            <Button type="button" variante="secundario" onClick={onCerrar}>
              Cancelar
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        abierto={Boolean(confirmar)}
        titulo="Confirmar cambios"
        onCerrar={() => setConfirmar(null)}
      >
        {confirmar && (
          <div className="space-y-5">
            <p>
              Vas a actualizar los datos de{' '}
              <strong>
                {confirmar.nombres} {confirmar.apellidoPaterno}
              </strong>{' '}
              (DNI: <strong>{persona.dni}</strong>). ¿Continuar?
            </p>

            {!confirmar.activo && persona.activo && (
              <Alert>
                Vas a desactivar a esta persona. Ya no podrá recibir nuevos préstamos en la biblioteca.
              </Alert>
            )}

            {confirmar.activo && !persona.activo && (
              <Alert>
                Vas a reactivar a esta persona. Podrá volver a solicitar préstamos en la biblioteca.
              </Alert>
            )}

            {confirmar.tipoPersonaId !== persona.tipoPersonaId && (
              <p className="text-tinta-suave">
                El tipo cambiará de <strong>{persona.tipoPersona}</strong> a{' '}
                <strong>
                  {tipos.find((t) => t.id === confirmar.tipoPersonaId)?.nombre ?? 'Nuevo tipo'}
                </strong>.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => void guardar(confirmar)}
                disabled={actualizar.isPending}
              >
                {actualizar.isPending ? 'Guardando…' : 'Sí, guardar cambios'}
              </Button>
              <Button variante="secundario" onClick={() => setConfirmar(null)}>
                Seguir revisando
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        abierto={nuevoTipoAbierto}
        titulo="Agregar tipo de persona"
        onCerrar={() => {
          setNuevoTipoAbierto(false)
          setErrorNuevoTipo(null)
        }}
      >
        <div className="space-y-5">
          {errorNuevoTipo && <Alert>{errorNuevoTipo}</Alert>}
          <TextField
            label="Tipo de persona"
            value={nombreNuevoTipo}
            onChange={(evento) => setNombreNuevoTipo(evento.target.value)}
            autoFocus
          />
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void guardarNuevoTipo()}
              disabled={crearTipo.isPending}
            >
              {crearTipo.isPending ? 'Guardando…' : 'Guardar tipo'}
            </Button>
            <Button
              variante="secundario"
              onClick={() => {
                setNuevoTipoAbierto(false)
                setErrorNuevoTipo(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
