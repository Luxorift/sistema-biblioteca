import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import type { FormularioPersona } from '../schemas'
import type { TipoPersona } from '../types'

interface FormularioPersonaProps {
  formulario: UseFormReturn<FormularioPersona>
  tipos: TipoPersona[]
  guardando: boolean
  onNuevoTipo: () => void
  onEnviar: (datos: FormularioPersona) => void
}

export function FormularioPersona({
  formulario,
  tipos,
  guardando,
  onNuevoTipo,
  onEnviar,
}: FormularioPersonaProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = formulario
  return (
    <form noValidate onSubmit={handleSubmit(onEnviar)} className="space-y-5">
      <div className="space-y-2">
        <Select
          label="Tipo de persona"
          error={errors.tipoPersonaId?.message}
          {...register('tipoPersonaId', { setValueAs: (valor) => Number(valor) })}
        >
          <option value="">Elige una opción</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </Select>
        <Button variante="secundario" onClick={onNuevoTipo}>
          Agregar nuevo tipo
        </Button>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Nombres"
          autoComplete="given-name"
          error={errors.nombres?.message}
          {...register('nombres')}
        />
        <TextField
          label="Apellido paterno"
          autoComplete="family-name"
          error={errors.apellidoPaterno?.message}
          {...register('apellidoPaterno')}
        />
        <TextField
          label="Apellido materno (opcional)"
          error={errors.apellidoMaterno?.message}
          {...register('apellidoMaterno')}
        />
        <TextField
          label="DNI"
          inputMode="numeric"
          maxLength={8}
          error={errors.dni?.message}
          {...register('dni')}
        />
        <TextField
          label="Correo (opcional)"
          type="email"
          autoComplete="email"
          error={errors.correo?.message}
          {...register('correo')}
        />
      </div>
      <Button type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar persona'}
      </Button>
    </form>
  )
}
