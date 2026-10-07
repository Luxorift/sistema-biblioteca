import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { AccionInicio } from './acciones'

// Bloque grande con profundidad visual y elevación suave al pasar el mouse.
export function ActionTile({ accion }: { accion: AccionInicio }) {
  const Icono = accion.icono

  return (
    <Link
      to={accion.ruta}
      className={cn(
        'flex min-h-48 flex-col justify-between rounded-2xl p-6 text-white transition-all duration-200 ease-in-out cursor-pointer',
        'shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] active:shadow-md active:translate-y-0',
        accion.color,
      )}
    >
      <Icono aria-hidden size={48} strokeWidth={2.2} />
      <span>
        <span className="block text-3xl font-bold tracking-tight">{accion.titulo}</span>
        <span className="mt-1.5 block text-lg opacity-95 leading-snug">{accion.descripcion}</span>
      </span>
    </Link>
  )
}
