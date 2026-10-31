import { useWatch, type UseFormReturn } from 'react-hook-form'
import { TextField } from '@/components/ui/TextField'
import type { Ubicacion } from '@/features/catalogos'
import type { FormularioMaterial } from '../schemas'
import { UbicacionesCopias } from './UbicacionesCopias'

interface CamposCopiasMaterialProps {
  formulario: UseFormReturn<FormularioMaterial>
  ubicaciones: Ubicacion[]
  cargando: boolean
  onNuevaUbicacion: () => void
}

export function CamposCopiasMaterial({
  formulario,
  ubicaciones,
  cargando,
  onNuevaUbicacion,
}: CamposCopiasMaterialProps) {
  const cantidad = useWatch({ control: formulario.control, name: 'cantidad' })
  const ubicacionesIds = useWatch({ control: formulario.control, name: 'ubicacionesIds' })
  return (
    <div className="space-y-4">
      <TextField
        label="Cantidad de copias"
        type="number"
        min="1"
        max="500"
        error={formulario.formState.errors.cantidad?.message}
        {...formulario.register('cantidad', { setValueAs: (valor) => Number(valor) })}
      />
      <UbicacionesCopias
        cantidad={cantidad}
        valores={ubicacionesIds}
        ubicaciones={ubicaciones}
        onChange={(valores) =>
          formulario.setValue('ubicacionesIds', valores, { shouldValidate: true })
        }
        onNuevaUbicacion={onNuevaUbicacion}
        cargando={cargando}
        error={formulario.formState.errors.ubicacionesIds?.message}
      />
    </div>
  )
}
