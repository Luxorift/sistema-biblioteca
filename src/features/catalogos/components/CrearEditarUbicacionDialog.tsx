import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import {
  esquemaUbicacion,
  type FormularioUbicacion,
} from '../schemas'
import type { Ubicacion } from '../types'
import {
  useActualizarUbicacion,
  useCrearUbicacion,
} from '../useCatalogos'

interface Props {
  abierto: boolean
  onCerrar: () => void
  ubicacionParaEditar: Ubicacion | null
  onExito: (mensaje: string) => void
}

export function CrearEditarUbicacionDialog({
  abierto,
  onCerrar,
  ubicacionParaEditar,
  onExito,
}: Props) {
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const esEdicion = Boolean(ubicacionParaEditar)

  const crearMutation = useCrearUbicacion()
  const actualizarMutation = useActualizarUbicacion()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioUbicacion>({
    resolver: zodResolver(esquemaUbicacion),
    defaultValues: {
      estante: '',
      nivel: 1,
    },
  })

  useEffect(() => {
    if (ubicacionParaEditar) {
      reset({
        estante: ubicacionParaEditar.estante,
        nivel: ubicacionParaEditar.nivel,
      })
    } else {
      reset({
        estante: '',
        nivel: 1,
      })
    }
  }, [ubicacionParaEditar, reset, abierto])

  const onSubmit = async (datos: FormularioUbicacion) => {
    setErrorEnvio(null)
    try {
      if (esEdicion && ubicacionParaEditar) {
        await actualizarMutation.mutateAsync({
          id: ubicacionParaEditar.id,
          estante: datos.estante,
          nivel: datos.nivel,
        })
        onExito(`Se actualizó la ubicación a Estante ${datos.estante}, Nivel ${datos.nivel}.`)
      } else {
        await crearMutation.mutateAsync({
          estante: datos.estante,
          nivel: datos.nivel,
        })
        onExito(`Se agregó la ubicación Estante ${datos.estante}, Nivel ${datos.nivel}.`)
      }
      reset()
      onCerrar()
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'Error al guardar la ubicación.')
    }
  }

  const cerrarYLimpiar = () => {
    setErrorEnvio(null)
    reset()
    onCerrar()
  }

  return (
    <Dialog
      abierto={abierto}
      titulo={esEdicion ? 'Editar ubicación física' : 'Nueva ubicación física'}
      onCerrar={cerrarYLimpiar}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-tinta-suave text-base">
          Define el estante (una letra de la A a la Z) y el nivel o balda correspondiente.
        </p>

        {errorEnvio && <Alert>{errorEnvio}</Alert>}

        <TextField
          label="Estante (Letra A-Z)"
          placeholder="Ej: A, B, C…"
          maxLength={1}
          error={errors.estante?.message}
          {...register('estante')}
        />

        <TextField
          label="Nivel (Número de balda)"
          type="number"
          min={1}
          max={99}
          placeholder="Ej: 1, 2, 3…"
          error={errors.nivel?.message}
          {...register('nivel', { valueAsNumber: true })}
        />

        <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variante="secundario"
            onClick={cerrarYLimpiar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : esEdicion ? 'Actualizar' : 'Guardar ubicación'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
