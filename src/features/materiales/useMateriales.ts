import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { agregarEjemplares, buscarSimilares, registrarMaterial } from './api'
import type { DatosMaterial } from './types'

export function useSimilares(titulo: string) {
  return useQuery({
    queryKey: ['materiales', 'similares', titulo],
    queryFn: () => buscarSimilares(titulo),
    enabled: titulo.trim().length >= 3,
    staleTime: 30_000,
  })
}
export function useRegistrarMaterial() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: registrarMaterial,
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['materiales'] }),
  })
}
export function useAgregarEjemplares() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({
      materialId,
      cantidad,
      ubicacionId,
    }: {
      materialId: number
      cantidad: number
      ubicacionId: number | null
    }) => agregarEjemplares(materialId, cantidad, ubicacionId),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['materiales'] }),
  })
}
export type { DatosMaterial }
