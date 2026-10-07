import { useQuery } from '@tanstack/react-query'
import { buscarMateriales } from './api'

export function useBuscarMateriales(termino: string) {
  return useQuery({
    queryKey: ['materiales', 'buscar', termino],
    queryFn: () => buscarMateriales(termino),
    enabled: termino.trim().length >= 2,
    staleTime: 30_000,
  })
}
