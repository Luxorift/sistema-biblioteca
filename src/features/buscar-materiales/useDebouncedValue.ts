import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(valor: T, demora = 400): T {
  const [valorConDemora, setValorConDemora] = useState(valor)
  useEffect(() => {
    const temporizador = window.setTimeout(() => setValorConDemora(valor), demora)
    return () => window.clearTimeout(temporizador)
  }, [valor, demora])
  return valorConDemora
}
