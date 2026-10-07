import { useQuery } from '@tanstack/react-query'
import { obtenerCopiasParaEtiquetas } from './api'

export function useCopiasParaEtiquetas() {
  return useQuery({
    queryKey: ['etiquetas', 'copias'],
    queryFn: obtenerCopiasParaEtiquetas,
  })
}
