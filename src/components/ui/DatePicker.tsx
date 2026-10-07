import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'

interface DatePickerProps {
  label: string
  value: string
  onChange: (valor: string) => void
  min?: string
  max?: string
  error?: string
}
const nombresMeses = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const formato = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
function fechaLocal(texto: string) {
  const [anio, mes, dia] = texto.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}
function iso(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function DatePicker({ label, value, onChange, min, max, error }: DatePickerProps) {
  const campoId = useId()
  const [abierto, setAbierto] = useState(false)
  const [vista, setVista] = useState(value ? fechaLocal(value) : new Date())
  const dias = useMemo(() => {
    const inicio = new Date(vista.getFullYear(), vista.getMonth(), 1)
    const offset = (inicio.getDay() + 6) % 7
    const total = new Date(vista.getFullYear(), vista.getMonth() + 1, 0).getDate()
    return Array.from({ length: offset + total }, (_, indice) =>
      indice < offset
        ? null
        : new Date(vista.getFullYear(), vista.getMonth(), indice - offset + 1),
    )
  }, [vista])
  return (
    <div className="space-y-2">
      <span className="block text-lg font-bold">{label}</span>
      <Button
        variante="secundario"
        className="w-full justify-between"
        onClick={() => setAbierto(true)}
        aria-describedby={error ? `${campoId}-error` : undefined}
      >
        <span>{value ? formato.format(fechaLocal(value)) : 'Elegir fecha'}</span>
        <CalendarDays aria-hidden size={22} />
      </Button>
      {error && (
        <p id={`${campoId}-error`} className="text-peligro text-base font-bold">
          {error}
        </p>
      )}
      <Dialog abierto={abierto} titulo={label} onCerrar={() => setAbierto(false)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variante="secundario"
              onClick={() =>
                setVista(new Date(vista.getFullYear(), vista.getMonth() - 1, 1))
              }
              aria-label="Mes anterior"
            >
              <ChevronLeft aria-hidden />
            </Button>
            <strong className="text-xl">
              {nombresMeses[vista.getMonth()]} de {vista.getFullYear()}
            </strong>
            <Button
              variante="secundario"
              onClick={() =>
                setVista(new Date(vista.getFullYear(), vista.getMonth() + 1, 1))
              }
              aria-label="Mes siguiente"
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {diasSemana.map((dia) => (
              <span key={dia} className="py-2 font-bold">
                {dia}
              </span>
            ))}
            {dias.map((dia, indice) => {
              if (!dia) return <span key={`vacio-${indice}`} />
              const valor = iso(dia)
              const bloqueado = Boolean((min && valor < min) || (max && valor > max))
              return (
                <button
                  key={valor}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => {
                    onChange(valor)
                    setAbierto(false)
                  }}
                  className={`min-h-11 rounded-lg font-bold ${valor === value ? 'bg-primario text-white' : 'hover:bg-papel'} disabled:opacity-30`}
                >
                  {dia.getDate()}
                </button>
              )
            })}
          </div>
          <Button
            variante="secundario"
            onClick={() => {
              onChange('')
              setAbierto(false)
            }}
          >
            Quitar fecha
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
