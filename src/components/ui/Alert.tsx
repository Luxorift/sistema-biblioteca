import type { ReactNode } from 'react'

// Aviso de error accesible con alto contraste en tema claro y oscuro.
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="border-peligro text-peligro rounded-xl border-2 bg-white p-4 text-lg font-bold shadow-xs dark:border-red-500 dark:bg-red-950/30 dark:text-red-300"
    >
      {children}
    </div>
  )
}
