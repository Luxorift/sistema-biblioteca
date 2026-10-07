import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { AccionInicio } from './acciones'

// Bloque grande y de un solo color: ícono + nombre + una línea que explica qué hace.
export function ActionTile({ accion }: { accion: AccionInicio }) {
  const Icono = accion.icono

  return (
    <Link
      to={accion.ruta}
      className={cn(
        'flex min-h-48 flex-col justify-between rounded-2xl p-6 text-white transition-transform hover:-translate-y-0.5',
        accion.color,
      )}
    >
      <Icono aria-hidden size={44} strokeWidth={2} />
      <span>
        <span className="block text-3xl font-bold">{accion.titulo}</span>
        <span className="mt-1 block text-lg">{accion.descripcion}</span>
      </span>
    </Link>
  )
}
