import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import type { Ubicacion } from '@/features/catalogos'
import { completarUbicaciones } from '../ubicacionesCopias'

interface UbicacionesCopiasProps {
  cantidad: number
  valores: (number | null)[]
  ubicaciones: Ubicacion[]
  onChange: (valores: (number | null)[]) => void
  onNuevaUbicacion: () => void
  cargando?: boolean
  error?: string
}

export function UbicacionesCopias({
  cantidad,
  valores,
  ubicaciones,
  onChange,
  onNuevaUbicacion,
  cargando,
  error,
}: UbicacionesCopiasProps) {
  const copias = completarUbicaciones(cantidad, valores)
  if (copias.length === 0) return null
  const compartida = copias.every((id) => id === copias[0]) ? copias[0] : null
  const opciones = ubicaciones.map((ubicacion) => (
    <option key={ubicacion.id} value={ubicacion.id}>
      Estante {ubicacion.estante}, nivel {ubicacion.nivel}
    </option>
  ))

  return (
    <fieldset className="border-borde space-y-4 rounded-xl border-2 p-4">
      <legend className="px-2 text-lg font-bold">Ubicación de las copias nuevas</legend>
      <p>Indica dónde guardarás cada copia. Puedes usar un mismo lugar o repartirlas.</p>
      <Select
        label="Ubicación para todas las copias nuevas"
        disabled={cargando}
        value={compartida ?? ''}
        error={error}
        onChange={(evento) =>
          onChange(
            copias.map(() => (evento.target.value ? Number(evento.target.value) : null)),
          )
        }
      >
        <option value="">Elige una ubicación o revisa cada copia</option>
        {opciones}
      </Select>
      <Button variante="secundario" onClick={onNuevaUbicacion}>
        Agregar nueva ubicación
      </Button>
      {copias.length > 1 && (
        <details className="space-y-3">
          <summary className="min-h-12 cursor-pointer content-center font-bold">
            Asignar una ubicación distinta por copia ({copias.length})
          </summary>
          <div className="grid max-h-80 gap-4 overflow-y-auto md:grid-cols-2">
            {copias.map((ubicacionId, indice) => (
              <Select
                key={indice}
                label={`Ubicación de copia nueva ${indice + 1}`}
                disabled={cargando}
                value={ubicacionId ?? ''}
                onChange={(evento) =>
                  onChange(
                    copias.map((actual, posicion) =>
                      posicion === indice
                        ? evento.target.value
                          ? Number(evento.target.value)
                          : null
                        : actual,
                    ),
                  )
                }
              >
                <option value="">Elige una ubicación</option>
                {opciones}
              </Select>
            ))}
          </div>
        </details>
      )}
    </fieldset>
  )
}
