import type { ReactNode } from 'react'

// Aviso de error. role="alert" hace que los lectores de pantalla lo anuncien al aparecer.
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="border-peligro text-peligro rounded-xl border-2 bg-white p-4 text-lg font-bold"
    >
      {children}
    </div>
  )
}
