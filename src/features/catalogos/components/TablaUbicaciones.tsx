import { Edit2, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import type { Ubicacion } from '../types'

interface Props {
  ubicaciones: Ubicacion[]
  onEditar: (item: Ubicacion) => void
  onEliminar: (item: Ubicacion) => void
}

export function TablaUbicaciones({ ubicaciones, onEditar, onEliminar }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return ubicaciones
    return ubicaciones.filter(
      (u) =>
        u.estante.toLowerCase().includes(q) ||
        String(u.nivel).includes(q) ||
        `estante ${u.estante} nivel ${u.nivel}`.toLowerCase().includes(q),
    )
  }, [ubicaciones, busqueda])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <TextField
            label="Buscar ubicación"
            placeholder="Filtrar por estante o nivel…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <p className="text-tinta-suave text-base">
          {filtradas.length} de {ubicaciones.length} ubicaciones
        </p>
      </div>

      {filtradas.length === 0 ? (
        <div className="border-borde rounded-2xl border-2 bg-white p-8 text-center">
          <p className="text-xl font-bold">
            {busqueda
              ? 'No se encontraron ubicaciones'
              : 'Aún no hay ubicaciones registradas'}
          </p>
          <p className="text-tinta-suave mt-2 text-base">
            {busqueda
              ? 'Prueba con otra letra de estante o número de nivel.'
              : 'Usa el botón "Agregar nueva ubicación" para definir estantes.'}
          </p>
        </div>
      ) : (
        <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
          <table className="w-full min-w-[500px] border-collapse text-left">
            <thead className="bg-papel">
              <tr>
                <th className="p-4 text-lg">Estante</th>
                <th className="p-4 text-lg">Nivel (balda)</th>
                <th className="p-4 text-lg text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((item) => (
                <tr key={item.id} className="border-borde border-t-2">
                  <td className="p-4 text-lg font-bold text-tinta">
                    Estante {item.estante}
                  </td>
                  <td className="p-4 text-lg text-tinta-suave">
                    Nivel {item.nivel}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variante="secundario"
                        onClick={() => onEditar(item)}
                        aria-label={`Editar Estante ${item.estante} Nivel ${item.nivel}`}
                      >
                        <Edit2 aria-hidden size={18} />
                        Editar
                      </Button>
                      <Button
                        variante="peligro"
                        onClick={() => onEliminar(item)}
                        aria-label={`Eliminar Estante ${item.estante} Nivel ${item.nivel}`}
                      >
                        <Trash2 aria-hidden size={18} />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
