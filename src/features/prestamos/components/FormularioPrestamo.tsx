import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import type { FormularioPrestamo } from '../schemas'
import type { CopiaDisponible, PersonaPrestataria } from '../types'

interface FormularioPrestamoProps {
  formulario: UseFormReturn<FormularioPrestamo>
  copias: CopiaDisponible[]
  personas: PersonaPrestataria[]
  onEnviar: (datos: FormularioPrestamo) => void
  guardando: boolean
}
export function FormularioPrestamo({
  formulario,
  copias,
  personas,
  onEnviar,
  guardando,
}: FormularioPrestamoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = formulario
  return (
    <form noValidate onSubmit={handleSubmit(onEnviar)} className="space-y-6">
      <Select
        label="Copia disponible"
        error={errors.ejemplarId?.message}
        {...register('ejemplarId', { setValueAs: (valor) => Number(valor) })}
      >
        <option value="">Elige código o título</option>
        {copias.map((copia) => (
          <option key={copia.id} value={copia.id}>
            {copia.codigo} · {copia.titulo}
            {copia.ubicacion ? ` · ${copia.ubicacion}` : ''}
          </option>
        ))}
      </Select>
      <Select
        label="Persona que recibe el material"
        error={errors.personaId?.message}
        {...register('personaId', { setValueAs: (valor) => Number(valor) })}
      >
        <option value="">Elige una persona</option>
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.nombreCompleto} · DNI {persona.dni} · {persona.tipo}
          </option>
        ))}
      </Select>
      <TextField
        label="Fecha límite (opcional)"
        type="date"
        min={new Date().toISOString().slice(0, 10)}
        {...register('fechaLimite')}
      />
      <Button type="submit" disabled={guardando}>
        {guardando ? 'Registrando…' : 'Continuar'}
      </Button>
    </form>
  )
}
