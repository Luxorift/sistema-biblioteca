import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type Variante = 'primario' | 'secundario' | 'peligro'

interface ButtonProps extends ComponentProps<'button'> {
  variante?: Variante
}

const estilos: Record<Variante, string> = {
  primario: 'bg-primario text-white hover:bg-primario-oscuro',
  secundario: 'border-2 border-borde bg-white text-tinta hover:bg-papel',
  peligro: 'bg-peligro text-white hover:opacity-90',
}

// Botón con área táctil grande (mínimo 48 px de alto) y texto legible.
export function Button({
  variante = 'primario',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-lg font-bold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        estilos[variante],
        className,
      )}
      {...props}
    />
  )
}
