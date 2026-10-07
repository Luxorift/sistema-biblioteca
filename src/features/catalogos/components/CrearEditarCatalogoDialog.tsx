import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import {
  esquemaElementoCatalogo,
  type FormularioElementoCatalogo,
} from '../schemas'
import type { MetaCatalogo, OpcionCatalogo, TipoCatalogoSimple } from '../types'
import {
  useActualizarCatalogoSimple,
  useCrearCatalogoSimple,
} from '../useCatalogos'

interface Props {
  abierto: boolean
  onCerrar: () => void
  meta: MetaCatalogo
  elementoParaEditar: OpcionCatalogo | null
  onExito: (mensaje: string) => void
}

export function CrearEditarCatalogoDialog({
  abierto,
  onCerrar,
  meta,
  elementoParaEditar,
  onExito,
}: Props) {
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const esEdicion = Boolean(elementoParaEditar)
  const tabla = meta.id as TipoCatalogoSimple

  const crearMutation = useCrearCatalogoSimple(tabla)
  const actualizarMutation = useActualizarCatalogoSimple(tabla)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioElementoCatalogo>({
    resolver: zodResolver(esquemaElementoCatalogo),
    defaultValues: {
      nombre: '',
    },
  })

  useEffect(() => {
    if (elementoParaEditar) {
      reset({ nombre: elementoParaEditar.nombre })
    } else {
      reset({ nombre: '' })
    }
  }, [elementoParaEditar, reset, abierto])

  const onSubmit = async (datos: FormularioElementoCatalogo) => {
    setErrorEnvio(null)
    try {
      if (esEdicion && elementoParaEditar) {
        await actualizarMutation.mutateAsync({
          id: elementoParaEditar.id,
          nombre: datos.nombre,
        })
        onExito(`Se modificó el ${meta.singular} exitosamente.`)
      } else {
        await crearMutation.mutateAsync(datos.nombre)
        onExito(`Se agregó el nuevo ${meta.singular} al catálogo.`)
      }
      reset()
      onCerrar()
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'Error al guardar el registro.')
    }
  }

  const cerrarYLimpiar = () => {
    setErrorEnvio(null)
    reset()
    onCerrar()
  }

  const titulo = esEdicion
    ? `Editar ${meta.singular}`
    : `Agregar nuevo ${meta.singular}`

  return (
    <Dialog abierto={abierto} titulo={titulo} onCerrar={cerrarYLimpiar}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-tinta-suave text-base">
          {esEdicion
            ? `Corrige el nombre de este ${meta.singular}. El cambio se reflejará en todos los libros y registros asociados.`
            : `Ingresa el nombre del ${meta.singular} que deseas sumar al catálogo.`}
        </p>

        {errorEnvio && <Alert>{errorEnvio}</Alert>}

        <TextField
          label={`Nombre del ${meta.singular}`}
          placeholder={meta.placeholder}
          error={errors.nombre?.message}
          {...register('nombre')}
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
            {isSubmitting ? 'Guardando…' : esEdicion ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
