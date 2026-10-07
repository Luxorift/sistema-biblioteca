import type { PrestamoHistorico } from '../types'

interface Props {
  prestamo: PrestamoHistorico
}

// Claves → texto visible y clases Tailwind con tokens del sistema de diseño.
const CONFIG: Record<string, { texto: string; clases: string }> = {
  pendiente: {
    texto: 'Pendiente',
    clases: 'bg-papel text-tinta border-borde',
  },
  devuelto: {
    texto: 'Devuelto',
    clases: 'bg-green-100 text-green-900 border-green-400',
  },
  atrasado: {
    texto: 'Atrasado',
    clases: 'bg-red-100 text-peligro border-peligro',
  },
}

function resolverEstado(prestamo: PrestamoHistorico): string {
  if (!prestamo.fechaDevolucion) return 'pendiente'
  return prestamo.estaAtrasado ? 'atrasado' : 'devuelto'
}

export function EstadoPrestamoBadge({ prestamo }: Props) {
  const clave = resolverEstado(prestamo)
  const cfg = CONFIG[clave]
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 px-3 py-0.5 text-sm font-bold ${cfg.clases}`}
    >
      {cfg.texto}
    </span>
  )
}
