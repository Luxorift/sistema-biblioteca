import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState, type FormEvent } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useCatalogo, useEditoriales } from '@/features/catalogos'
import { NuevoCatalogoDialog } from '@/features/materiales'
import { ErrorAjusteCopias } from '../api'
import { esquemaEditarMaterial, type FormularioEditarMaterial } from '../schemas'
import type { MaterialEncontrado } from '../types'
import { useActualizarMaterial } from '../useActualizarMaterial'

interface EditarMaterialDialogProps {
  material: MaterialEncontrado | null
  abierto: boolean
  onCerrar: () => void
  onGuardado: () => void
}

type DialogoCatalogo = 'tipos_material' | 'categorias' | null

function valoresIniciales(material: MaterialEncontrado): FormularioEditarMaterial {
  const disponibles = material.copias.filter((copia) => copia.estado === 'disponible').length
  return {
    titulo: material.titulo,
    tipoMaterialId: material.tipoMaterialId,
    categoriaId: material.categoriaId,
    editorial: material.editorial ?? '',
    anio: material.anio,
    autores: material.autores.length
      ? material.autores.map((nombre) => ({ nombre }))
      : [{ nombre: '' }],
    cantidadCopias: material.copias.length,
    cantidadDisponibles: disponibles,
  }
}

function mensajeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'MATERIAL_DUPLICADO') {
      return 'Ya existe otro material con el mismo título, editorial y año. Cambia esos datos o agrega copias al existente desde Agregar material.'
    }
    if (error instanceof ErrorAjusteCopias) {
      if (error.codigo === 'prestados_bloquean') {
        return 'Hay copias prestadas. No puedes bajar el total de copias por debajo de ese número hasta devolverlas.'
      }
      if (error.codigo === 'disponibles_invalidos') {
        return 'Las copias disponibles deben ser menores o iguales al total, descontando las que están prestadas.'
      }
      return 'No se pudo reducir el número de copias. Solo se pueden dar de baja copias disponibles o en reparación.'
    }
  }
  return 'No se pudieron guardar los cambios. Revisa los datos y tu conexión, luego intenta de nuevo.'
}

export function EditarMaterialDialog({
  material,
  abierto,
  onCerrar,
  onGuardado,
}: EditarMaterialDialogProps) {
  const tipos = useCatalogo('tipos_material')
  const categorias = useCatalogo('categorias')
  const editoriales = useEditoriales()
  const actualizar = useActualizarMaterial()
  const [dialogoCatalogo, setDialogoCatalogo] = useState<DialogoCatalogo>(null)
  const [confirmar, setConfirmar] = useState<FormularioEditarMaterial | null>(null)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  const formulario = useForm<FormularioEditarMaterial>({
    resolver: zodResolver(esquemaEditarMaterial),
    values: material ? valoresIniciales(material) : undefined,
  })

  const { register, control, handleSubmit, setValue, formState: { errors } } = formulario
  const { fields, append, remove } = useFieldArray({ control, name: 'autores' })

  const prestadas = useMemo(
    () => material?.copias.filter((copia) => copia.estado === 'prestado').length ?? 0,
    [material],
  )

  const revisarYConfirmar = (datos: FormularioEditarMaterial) => {
    if (datos.cantidadCopias < prestadas) {
      setErrorGuardado(
        `Hay ${prestadas} ${prestadas === 1 ? 'copia prestada' : 'copias prestadas'}. El total de copias no puede ser menor.`,
      )
      return
    }
    const maxDisponibles = datos.cantidadCopias - prestadas
    if (datos.cantidadDisponibles > maxDisponibles) {
      setErrorGuardado(
        `Como hay copias prestadas, solo puedes marcar hasta ${maxDisponibles} como disponibles.`,
      )
      return
    }
    setErrorGuardado(null)
    setConfirmar(datos)
  }

  const guardar = async (datos: FormularioEditarMaterial) => {
    if (!material) return
    setConfirmar(null)
    try {
      await actualizar.mutateAsync({
        materialId: material.id,
        datos: {
          titulo: datos.titulo,
          tipoMaterialId: datos.tipoMaterialId,
          categoriaId: datos.categoriaId,
          editorial: datos.editorial,
          anio: datos.anio,
          autores: datos.autores.map(({ nombre }) => nombre).filter(Boolean),
          cantidadCopias: datos.cantidadCopias,
          cantidadDisponibles: datos.cantidadDisponibles,
        },
      })
      onGuardado()
      onCerrar()
    } catch (error) {
      setErrorGuardado(mensajeError(error))
    }
  }

  const cargandoCatalogos = tipos.isLoading || categorias.isLoading || editoriales.isLoading

  if (!material) return null

  return (
    <>
      <Dialog
        abierto={abierto}
        titulo="Editar material"
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
          {prestadas > 0 && (
            <p className="text-tinta-suave text-lg">
              Este material tiene <strong>{prestadas}</strong>{' '}
              {prestadas === 1 ? 'copia prestada' : 'copias prestadas'}. Los códigos BIB- y
              el historial de préstamos no se modifican desde aquí.
            </p>
          )}
          <TextField
            label="Título"
            error={errors.titulo?.message}
            {...register('titulo')}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Select
                label="Tipo de material"
                error={errors.tipoMaterialId?.message}
                disabled={cargandoCatalogos}
                {...register('tipoMaterialId', { setValueAs: (valor) => Number(valor) })}
              >
                <option value="">Elige una opción</option>
                {(tipos.data ?? []).map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variante="secundario"
                onClick={() => setDialogoCatalogo('tipos_material')}
              >
                Agregar nuevo tipo
              </Button>
            </div>
            <div className="space-y-2">
              <Select
                label="Área o categoría (opcional)"
                disabled={cargandoCatalogos}
                {...register('categoriaId', {
                  setValueAs: (valor) => (valor ? Number(valor) : null),
                })}
              >
                <option value="">Sin área o categoría</option>
                {(categorias.data ?? []).map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variante="secundario"
                onClick={() => setDialogoCatalogo('categorias')}
              >
                Agregar nueva área
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Editorial (opcional)"
              list="editoriales-editar"
              error={errors.editorial?.message}
              {...register('editorial')}
            />
            <datalist id="editoriales-editar">
              {(editoriales.data ?? []).map((editorial) => (
                <option key={editorial} value={editorial} />
              ))}
            </datalist>
            <TextField
              label="Año de publicación (opcional)"
              type="number"
              min="1400"
              max={new Date().getFullYear() + 1}
              error={errors.anio?.message}
              {...register('anio', {
                setValueAs: (valor) => (valor === '' || valor === null ? null : Number(valor)),
              })}
            />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-lg font-bold">Autores (opcional)</legend>
            {fields.map((campo, indice) => (
              <div key={campo.id} className="flex items-end gap-3">
                <div className="flex-1">
                  <TextField
                    label={`Autor ${indice + 1}`}
                    error={errors.autores?.[indice]?.nombre?.message}
                    {...register(`autores.${indice}.nombre`)}
                  />
                </div>
                <Button type="button" variante="secundario" onClick={() => remove(indice)}>
                  Quitar
                </Button>
              </div>
            ))}
            <Button type="button" variante="secundario" onClick={() => append({ nombre: '' })}>
              Agregar autor
            </Button>
          </fieldset>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <TextField
                label="Copias activas"
                type="number"
                min={prestadas}
                max="500"
                error={errors.cantidadCopias?.message}
                {...register('cantidadCopias', { setValueAs: (valor) => Number(valor) })}
              />
              <p className="text-tinta-suave text-base">
                {prestadas > 0
                  ? `Mínimo ${prestadas} por las copias prestadas.`
                  : 'Las copias dadas de baja no cuentan aquí.'}
              </p>
            </div>
            <div className="space-y-1">
              <TextField
                label="Copias disponibles"
                type="number"
                min="0"
                max="500"
                error={errors.cantidadDisponibles?.message}
                {...register('cantidadDisponibles', {
                  setValueAs: (valor) => Number(valor),
                })}
              />
              <p className="text-tinta-suave text-base">
                Las prestadas no pueden marcarse como disponibles hasta devolverlas.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={actualizar.isPending || cargandoCatalogos}>
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
              Vas a actualizar <strong>{confirmar.titulo}</strong> con{' '}
              <strong>
                {confirmar.cantidadCopias}{' '}
                {confirmar.cantidadCopias === 1 ? 'copia activa' : 'copias activas'}
              </strong>{' '}
              ({confirmar.cantidadDisponibles} disponibles). ¿Continuar?
            </p>
            {confirmar.cantidadCopias < material.copias.length && (
              <Alert>
                Al reducir copias, las sobrantes disponibles o en reparación se darán de baja.
                No se borran códigos ni préstamos anteriores.
              </Alert>
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
      {dialogoCatalogo && (
        <NuevoCatalogoDialog
          abierto
          tipo={dialogoCatalogo}
          onCerrar={() => setDialogoCatalogo(null)}
          onCreado={(id) => {
            if (dialogoCatalogo === 'tipos_material') setValue('tipoMaterialId', id)
            if (dialogoCatalogo === 'categorias') setValue('categoriaId', id)
          }}
        />
      )}
    </>
  )
}
