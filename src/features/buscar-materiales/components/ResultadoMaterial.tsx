import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { MaterialEncontrado } from '../types'

const etiquetasEstado: Record<string, string> = {
  disponible: 'Disponible',
  prestado: 'Prestado',
  en_reparacion: 'En reparación',
  perdido: 'Perdido',
  baja: 'Dado de baja',
}

export function ResultadoMaterial({ material }: { material: MaterialEncontrado }) {
  const [verCopias, setVerCopias] = useState(false)
  const disponibles = material.copias.filter(
    ({ estado }) => estado === 'disponible',
  ).length
  return (
    <article className="border-borde space-y-4 rounded-2xl border-2 bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{material.titulo}</h2>
        <p className="text-tinta-suave">
          {material.tipo}
          {material.categoria ? ` · ${material.categoria}` : ''}
          {material.editorial ? ` · ${material.editorial}` : ''}
          {material.anio ? ` · ${material.anio}` : ''}
        </p>
        <p>
          {material.autores.length ? material.autores.join(', ') : 'Autor no registrado'}
        </p>
      </div>
      <p className="text-lg">
        <strong>{disponibles}</strong> disponibles de{' '}
        <strong>{material.copias.length}</strong>{' '}
        {material.copias.length === 1 ? 'copia' : 'copias'}
      </p>
      <Button
        variante="secundario"
        onClick={() => setVerCopias((valor) => !valor)}
        aria-expanded={verCopias}
      >
        {verCopias ? 'Ocultar copias' : 'Ver copias y ubicación'}
      </Button>
      {verCopias && (
        <ul
          className="border-borde space-y-2 border-t-2 pt-4"
          aria-label={`Copias de ${material.titulo}`}
        >
          {material.copias.length ? (
            material.copias.map((copia) => (
              <li
                key={copia.codigo}
                className="bg-papel flex flex-wrap justify-between gap-2 rounded-lg px-3 py-2"
              >
                <span className="font-bold">{copia.codigo}</span>
                <span>{etiquetasEstado[copia.estado] ?? copia.estado}</span>
                <span>{copia.ubicacion ?? 'Sin ubicación'}</span>
              </li>
            ))
          ) : (
            <li>Este material aún no tiene copias registradas.</li>
          )}
        </ul>
      )}
    </article>
  )
}
