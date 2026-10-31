import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import type { OpcionCatalogo, Ubicacion } from '@/features/catalogos'
import type { FormularioMaterial } from '../schemas'
import { CamposCopiasMaterial } from './CamposCopiasMaterial'

interface FormularioMaterialProps {
  formulario: UseFormReturn<FormularioMaterial>
  tipos: OpcionCatalogo[]
  categorias: OpcionCatalogo[]
  ubicaciones: Ubicacion[]
  editoriales: string[]
  cargandoCatalogos: boolean
  onNuevo: (tipo: 'tipos_material' | 'categorias' | 'ubicacion') => void
  onEnviar: (datos: FormularioMaterial) => void
  guardando: boolean
}
export function FormularioMaterial({
  formulario,
  tipos,
  categorias,
  ubicaciones,
  editoriales,
  cargandoCatalogos,
  onNuevo,
  onEnviar,
  guardando,
}: FormularioMaterialProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = formulario
  const { fields, append, remove } = useFieldArray({ control, name: 'autores' })
  return (
    <form noValidate onSubmit={handleSubmit(onEnviar)} className="space-y-6">
      <h2 className="text-2xl font-bold">1. Datos del material</h2>
      <p className="text-tinta-suave">
        Completa la ficha. Los campos marcados como opcionales pueden quedar vacíos.
      </p>
      <TextField
        label="Título"
        className="text-xl"
        error={errors.titulo?.message}
        {...register('titulo')}
      />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Select
            label="Tipo de material"
            error={errors.tipoMaterialId?.message}
            disabled={cargandoCatalogos}
            {...register('tipoMaterialId', { setValueAs: (valor) => Number(valor) })}
          >
            <option value="">Elige una opción</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>
          <Button variante="secundario" onClick={() => onNuevo('tipos_material')}>
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
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </Select>
          <Button variante="secundario" onClick={() => onNuevo('categorias')}>
            Agregar nueva área o categoría
          </Button>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Editorial (opcional)"
          list="editoriales"
          error={errors.editorial?.message}
          {...register('editorial')}
        />
        <datalist id="editoriales">
          {editoriales.map((editorial) => (
            <option key={editorial} value={editorial} />
          ))}
        </datalist>
        <TextField
          label="Año de publicación (opcional)"
          type="number"
          min="1400"
          max={new Date().getFullYear() + 1}
          error={errors.anio?.message}
          {...register('anio', { setValueAs: (valor) => (valor ? Number(valor) : null) })}
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
            <Button variante="secundario" onClick={() => remove(indice)}>
              Quitar
            </Button>
          </div>
        ))}
        <Button variante="secundario" onClick={() => append({ nombre: '' })}>
          Agregar autor
        </Button>
      </fieldset>
      <h2 className="text-2xl font-bold">2. Copias y ubicación</h2>
      <CamposCopiasMaterial
        formulario={formulario}
        ubicaciones={ubicaciones}
        cargando={cargandoCatalogos}
        onNuevaUbicacion={() => onNuevo('ubicacion')}
      />
      <Button type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Revisar material y copias'}
      </Button>
    </form>
  )
}
