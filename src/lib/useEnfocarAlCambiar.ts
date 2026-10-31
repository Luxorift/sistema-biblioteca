import { useEffect, useRef } from 'react'
import { irAlPaso } from './guiarNavegacion'

// Evita desplazar la pantalla al cargarla o al refrescar datos en segundo plano.
export function useEnfocarAlCambiar(valor: string) {
  const referencia = useRef<HTMLElement>(null)
  const anterior = useRef(valor)
  useEffect(() => {
    if (anterior.current === valor) return
    anterior.current = valor
    irAlPaso(referencia)
  }, [valor])
  return referencia
}
