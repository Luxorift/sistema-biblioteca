import { useQuery } from '@tanstack/react-query'
import { obtenerPrestamosHistoricos } from './api'
import type { PrestamoHistorico } from './types'

export function usePrestamosHistoricos() {
  return useQuery<PrestamoHistorico[]>({
    queryKey: ['prestamos', 'historico'],
    queryFn: obtenerPrestamosHistoricos,
  })
}
