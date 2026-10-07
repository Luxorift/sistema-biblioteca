import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import type { FormatoEtiqueta } from '../types'

interface FiltrosEtiquetasProps {
  busqueda: string
  onBusquedaChange: (valor: string) => void
  formato: FormatoEtiqueta
  onFormatoChange: (formato: FormatoEtiqueta) => void
  totalFiltradas: number
  totalSeleccionadas: number
  todasSeleccionadas: boolean
  onToggleTodas: () => void
  onImprimir: () => void
}

export function FiltrosEtiquetas({
  busqueda,
  onBusquedaChange,
  formato,
  onFormatoChange,
  totalFiltradas,
  totalSeleccionadas,
  todasSeleccionadas,
  onToggleTodas,
  onImprimir,
}: FiltrosEtiquetasProps) {
  return (
    <section className="border-borde space-y-4 rounded-2xl border-2 bg-white p-5 print:hidden">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Buscar por título, código BIB- o autor"
          value={busqueda}
          onChange={(evento) => onBusquedaChange(evento.target.value)}
          placeholder="Ej: Don Quijote, BIB-000001, Mario Vargas..."
        />
        <Select
          label="Formato de la etiqueta"
          value={formato}
          onChange={(evento) =>
            onFormatoChange(evento.target.value as FormatoEtiqueta)
          }
        >
          <option value="ambos">Código de barras y QR (completo)</option>
          <option value="barras">Solo código de barras (Code 128)</option>
          <option value="qr">Solo código QR</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variante="secundario"
            onClick={onToggleTodas}
            disabled={totalFiltradas === 0}
          >
            {todasSeleccionadas ? 'Deseleccionar todas' : `Seleccionar todas (${totalFiltradas})`}
          </Button>
          <span className="text-tinta-suave text-base">
            {totalSeleccionadas} de {totalFiltradas}{' '}
            {totalFiltradas === 1 ? 'etiqueta seleccionada' : 'etiquetas seleccionadas'}
          </span>
        </div>

        <Button
          type="button"
          onClick={onImprimir}
          disabled={totalSeleccionadas === 0}
        >
          <Printer aria-hidden size={20} />
          Imprimir {totalSeleccionadas > 0 ? `(${totalSeleccionadas})` : ''}
        </Button>
      </div>
    </section>
  )
}
