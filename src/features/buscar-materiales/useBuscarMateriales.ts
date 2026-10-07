import { useQuery } from '@tanstack/react-query'
import { buscarMateriales } from './api'

export function useBuscarMateriales() {
  return useQuery({
    queryKey: ['materiales', 'lista'],
    queryFn: buscarMateriales,
    staleTime: 30_000,
  })
}
