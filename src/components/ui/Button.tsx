import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'peligro-suave'

export interface ButtonProps extends ComponentProps<'button'> {
  variante?: VarianteBoton
}

const estilos: Record<VarianteBoton, string> = {
  primario:
    'bg-primario text-white hover:bg-primario-oscuro border-2 border-transparent shadow-xs hover:shadow active:scale-[0.98]',
  secundario:
    'border-2 border-borde bg-white text-tinta hover:bg-papel hover:border-tinta-suave shadow-xs hover:shadow active:scale-[0.98]',
  peligro:
    'bg-peligro text-white hover:opacity-95 border-2 border-transparent shadow-xs hover:shadow active:scale-[0.98]',
  'peligro-suave':
    'border-2 border-red-300 bg-red-50 text-red-900 hover:bg-red-100 hover:border-red-400 active:bg-red-200 active:scale-[0.98]',
}

// Botón accesible con área táctil cómoda (mínimo 48 px), alto contraste y microinteracción suave.
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
        'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 text-lg font-bold transition-all duration-150 ease-in-out',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100',
        estilos[variante],
        className,
      )}
      {...props}
    />
  )
}
