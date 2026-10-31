import type { RefObject } from 'react'

// Esperar al render permite enfocar secciones que aparecen al completar un paso.
// No se invoca al escribir: solo tras acciones explícitas del bibliotecario.
export function irAlPaso(referencia: RefObject<HTMLElement | null>) {
  requestAnimationFrame(() => {
    const destino = referencia.current
    if (!destino?.isConnected) return
    const reducirMovimiento = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    destino.focus({ preventScroll: true })
    destino.scrollIntoView?.({
      behavior: reducirMovimiento ? 'instant' : 'smooth',
      block: 'start',
    })
  })
}
