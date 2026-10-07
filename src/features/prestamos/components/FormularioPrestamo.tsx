import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import type { FormularioPrestamo } from '../schemas'
import type { CopiaDisponible, PersonaPrestataria } from '../types'

interface FormularioPrestamoProps {
  formulario: UseFormReturn<FormularioPrestamo>
  copias: CopiaDisponible[]
  personas: PersonaPrestataria[]
  copiaSeleccionada: CopiaDisponible | null
  personaSeleccionada: PersonaPrestataria | null
  onElegirCopia: (copia: CopiaDisponible) => void
  onElegirPersona: (persona: PersonaPrestataria) => void
  onEnviar: (datos: FormularioPrestamo) => void
  guardando: boolean
}
export function FormularioPrestamo({
  formulario,
  copias,
  personas,
  copiaSeleccionada,
  personaSeleccionada,
  onElegirCopia,
  onElegirPersona,
  onEnviar,
  guardando,
}: FormularioPrestamoProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = formulario
  const tieneFechaLimite = watch('tieneFechaLimite')
  return (
    <form noValidate onSubmit={handleSubmit(onEnviar)} className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Elige la copia</h2>
        {copiaSeleccionada ? (
          <p className="bg-papel rounded-xl p-4">
            <strong>{copiaSeleccionada.codigo}</strong> · {copiaSeleccionada.titulo}
          </p>
        ) : (
          <p className="text-tinta-suave">
            Escribe código o título arriba y elige una opción.
          </p>
        )}
        <div className="grid gap-2">
          {copias.slice(0, 8).map((copia) => (
            <Button
              key={copia.id}
              variante="secundario"
              className="justify-start text-left"
              onClick={() => onElegirCopia(copia)}
            >
              {copia.codigo} · {copia.titulo}
              {copia.ubicacion ? ` · ${copia.ubicacion}` : ''}
            </Button>
          ))}
        </div>
        {errors.ejemplarId && (
          <p className="text-peligro font-bold">{errors.ejemplarId.message}</p>
        )}
      </section>
      <section className="border-borde space-y-3 border-t-2 pt-5">
        <h2 className="text-xl font-bold">2. Elige la persona</h2>
        {personaSeleccionada ? (
          <p className="bg-papel rounded-xl p-4">
            <strong>{personaSeleccionada.nombreCompleto}</strong> · DNI{' '}
            {personaSeleccionada.dni}
          </p>
        ) : (
          <p className="text-tinta-suave">
            Escribe nombre o DNI arriba y elige una opción.
          </p>
        )}
        <div className="grid gap-2">
          {personas.slice(0, 8).map((persona) => (
            <Button
              key={persona.id}
              variante="secundario"
              className="justify-start text-left"
              onClick={() => onElegirPersona(persona)}
            >
              {persona.nombreCompleto} · DNI {persona.dni} · {persona.tipo}
            </Button>
          ))}
        </div>
        {errors.personaId && (
          <p className="text-peligro font-bold">{errors.personaId.message}</p>
        )}
      </section>
      <section className="border-borde space-y-4 border-t-2 pt-5">
        <h2 className="text-xl font-bold">3. Fechas</h2>
        <TextField
          label="Fecha de préstamo"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          error={errors.fechaPrestamo?.message}
          {...register('fechaPrestamo')}
        />
        <label className="border-borde flex min-h-12 items-center gap-3 rounded-xl border-2 bg-white px-4 text-lg">
          <input type="checkbox" className="size-5" {...register('tieneFechaLimite')} />{' '}
          Este préstamo tiene fecha límite
        </label>
        {tieneFechaLimite ? (
          <TextField
            label="Fecha límite"
            type="date"
            min={watch('fechaPrestamo')}
            error={errors.fechaLimite?.message}
            {...register('fechaLimite')}
          />
        ) : (
          <p className="text-tinta-suave">
            Sin fecha límite. Podrás registrar la devolución cuando la copia regrese.
          </p>
        )}
      </section>
      <Button type="submit" disabled={guardando}>
        {guardando ? 'Registrando…' : 'Continuar'}
      </Button>
    </form>
  )
}
