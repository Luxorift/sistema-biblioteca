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
    onSuccess: () =>
      Promise.all(
        ['materiales', 'ejemplares', 'etiquetas', 'catalogos'].map((key) =>
          cliente.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  })
}
export function useAgregarEjemplares() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({
      materialId,
      ubicacionesIds,
    }: {
      materialId: number
      ubicacionesIds: number[]
    }) => agregarEjemplares(materialId, ubicacionesIds),
    onSuccess: () =>
      Promise.all(
        ['materiales', 'ejemplares', 'etiquetas', 'catalogos'].map((key) =>
          cliente.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  })
}
export type { DatosMaterial }
