import type { EstadoEjemplar } from '../types'

interface EstadoBadgeProps {
  estado: EstadoEjemplar
}

const CONFIG_ESTADO: Record<
  EstadoEjemplar,
  { texto: string; clases: string }
> = {
  disponible: {
    texto: 'Disponible',
    clases: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  },
  prestado: {
    texto: 'Prestado',
    clases: 'bg-sky-100 text-sky-900 border-sky-400',
  },
  en_reparacion: {
    texto: 'En reparación',
    clases: 'bg-amber-100 text-amber-900 border-amber-400',
  },
  perdido: {
    texto: 'Perdido',
    clases: 'bg-rose-100 text-rose-900 border-rose-400',
  },
  baja: {
    texto: 'De baja',
    clases: 'bg-gray-200 text-gray-800 border-gray-400',
  },
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const config = CONFIG_ESTADO[estado] ?? {
    texto: estado,
    clases: 'bg-gray-100 text-gray-700 border-gray-300',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-bold ${config.clases}`}
    >
      {config.texto}
    </span>
  )
}
