import { Button } from '@/components/ui/Button'
import type { EjemplarDetallado } from '../types'
import { EstadoBadge } from './EstadoBadge'

interface TablaEjemplaresProps {
  ejemplares: EjemplarDetallado[]
  onEditar: (ejemplar: EjemplarDetallado) => void
}

export function TablaEjemplares({
  ejemplares,
  onEditar,
}: TablaEjemplaresProps) {
  return (
    <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
      <table className="w-full min-w-[950px] border-collapse text-left">
        <thead className="bg-papel">
          <tr>
            <th className="p-4">Código</th>
            <th className="p-4">Título del material</th>
            <th className="p-4">Estado</th>
            <th className="p-4">Ubicación</th>
            <th className="p-4">Observaciones físicas</th>
            <th className="p-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ejemplares.map((ejemplar) => (
            <tr key={ejemplar.id} className="border-borde border-t-2">
              <td className="p-4 font-mono font-bold text-black">
                {ejemplar.codigo}
              </td>
              <td className="p-4">
                <span className="block font-bold text-gray-900">
                  {ejemplar.titulo}
                </span>
                {ejemplar.autores.length > 0 && (
                  <span className="text-tinta-suave block text-sm">
                    {ejemplar.autores.join(', ')}
                  </span>
                )}
                {ejemplar.prestamoActivo && (
                  <span className="mt-1 inline-block text-xs font-semibold text-sky-800">
                    Prestado a {ejemplar.prestamoActivo.persona}
                  </span>
                )}
              </td>
              <td className="p-4">
                <EstadoBadge estado={ejemplar.estado} />
              </td>
              <td className="p-4 text-gray-700">
                {ejemplar.ubicacion ?? '—'}
              </td>
              <td className="max-w-xs truncate p-4 text-sm text-gray-700">
                {ejemplar.observaciones ? (
                  <span title={ejemplar.observaciones}>
                    {ejemplar.observaciones}
                  </span>
                ) : (
                  <span className="text-gray-400">Sin observaciones</span>
                )}
              </td>
              <td className="p-4">
                <Button
                  variante="secundario"
                  onClick={() => onEditar(ejemplar)}
                >
                  Cambiar estado
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
