import { Edit2, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import type { MetaCatalogo, OpcionCatalogo } from '../types'

interface Props {
  elementos: OpcionCatalogo[]
  meta: MetaCatalogo
  onEditar: (item: OpcionCatalogo) => void
  onEliminar: (item: OpcionCatalogo) => void
}

export function TablaCatalogoSimple({
  elementos,
  meta,
  onEditar,
  onEliminar,
}: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return elementos
    return elementos.filter((item) => item.nombre.toLowerCase().includes(q))
  }, [elementos, busqueda])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <TextField
            label={`Buscar en ${meta.titulo.toLowerCase()}`}
            placeholder="Escribe para filtrar…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <p className="text-tinta-suave text-base">
          {filtrados.length} de {elementos.length} {meta.titulo.toLowerCase()}
        </p>
      </div>

      {filtrados.length === 0 ? (
        <div className="border-borde rounded-2xl border-2 bg-white p-8 text-center">
          <p className="text-xl font-bold">
            {busqueda
              ? 'No se encontraron coincidencias'
              : `Aún no hay ${meta.titulo.toLowerCase()} registrados`}
          </p>
          <p className="text-tinta-suave mt-2 text-base">
            {busqueda
              ? 'Prueba escribiendo otro término de búsqueda.'
              : `Usa el botón "Agregar nuevo ${meta.singular}" para registrar el primero.`}
          </p>
        </div>
      ) : (
        <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
          <table className="w-full min-w-[500px] border-collapse text-left">
            <thead className="bg-papel">
              <tr>
                <th className="p-4 text-lg">Nombre</th>
                <th className="p-4 text-lg text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item) => (
                <tr key={item.id} className="border-borde border-t-2">
                  <td className="p-4 text-lg font-bold text-tinta">{item.nombre}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variante="secundario"
                        onClick={() => onEditar(item)}
                        aria-label={`Editar ${item.nombre}`}
                      >
                        <Edit2 aria-hidden size={18} />
                        Editar
                      </Button>
                      <Button
                        variante="peligro"
                        onClick={() => onEliminar(item)}
                        aria-label={`Eliminar ${item.nombre}`}
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
