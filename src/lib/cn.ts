import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Une clases de Tailwind resolviendo conflictos: cn('p-2', condicion && 'p-4') => 'p-4'.
export function cn(...clases: ClassValue[]) {
  return twMerge(clsx(clases))
}
