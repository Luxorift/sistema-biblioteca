import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import type { FormularioPrestamo } from '../schemas'
import type { CopiaDisponible, PersonaPrestataria } from '../types'

interface FormularioPrestamoProps {
  formulario: UseFormReturn<FormularioPrestamo>
  copias: CopiaDisponible[]
  copiaSeleccionada: CopiaDisponible | null
  personaSeleccionada: PersonaPrestataria | null
  onElegirCopia: (copia: CopiaDisponible) => void
  onQuitarCopia: () => void
  onQuitarPersona: () => void
  onEnviar: (datos: FormularioPrestamo) => void
  guardando: boolean
}
export function FormularioPrestamo({
  formulario,
  copias,
  copiaSeleccionada,
  personaSeleccionada,
  onElegirCopia,
  onQuitarCopia,
  onQuitarPersona,
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
        <h2 className="text-xl font-bold">3. Elige la copia</h2>
        {copiaSeleccionada ? (
          <div className="bg-papel flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
            <p>
              <strong>{copiaSeleccionada.codigo}</strong> · {copiaSeleccionada.titulo}
            </p>
            <Button variante="peligro" onClick={onQuitarCopia}>
              Quitar selección
            </Button>
          </div>
        ) : (
          <p className="text-tinta-suave">
            Elige un material arriba y luego una de sus copias.
          </p>
        )}
        <div className="grid gap-2">
          {copias.map((copia) => (
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
        <h2 className="text-xl font-bold">4. Persona elegida</h2>
        {personaSeleccionada ? (
          <div className="bg-papel flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
            <p>
              <strong>{personaSeleccionada.nombreCompleto}</strong> · DNI{' '}
              {personaSeleccionada.dni}
            </p>
            <Button variante="peligro" onClick={onQuitarPersona}>
              Quitar selección
            </Button>
          </div>
        ) : (
          <p className="text-tinta-suave">Elige una persona desde la tabla de arriba.</p>
        )}
        {errors.personaId && (
          <p className="text-peligro font-bold">{errors.personaId.message}</p>
        )}
      </section>
      <section className="border-borde space-y-4 border-t-2 pt-5">
        <h2 className="text-xl font-bold">5. Fechas</h2>
        <DatePicker
          label="Fecha de préstamo"
          max={new Date().toISOString().slice(0, 10)}
          value={watch('fechaPrestamo')}
          onChange={(valor) =>
            formulario.setValue('fechaPrestamo', valor, { shouldValidate: true })
          }
          error={errors.fechaPrestamo?.message}
        />
        <label className="border-borde flex min-h-12 items-center gap-3 rounded-xl border-2 bg-white px-4 text-lg">
          <input type="checkbox" className="size-5" {...register('tieneFechaLimite')} />{' '}
          Este préstamo tiene fecha límite
        </label>
        {tieneFechaLimite ? (
          <DatePicker
            label="Fecha límite"
            min={watch('fechaPrestamo')}
            value={watch('fechaLimite')}
            onChange={(valor) =>
              formulario.setValue('fechaLimite', valor, { shouldValidate: true })
            }
            error={errors.fechaLimite?.message}
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
