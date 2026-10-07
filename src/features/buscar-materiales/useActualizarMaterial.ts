import { useMutation, useQueryClient } from '@tanstack/react-query'
import { actualizarMaterial } from './api'
import type { DatosActualizarMaterial } from './types'

export function useActualizarMaterial() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({
      materialId,
      datos,
    }: {
      materialId: number
      datos: DatosActualizarMaterial
    }) => actualizarMaterial(materialId, datos),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['materiales', 'lista'] })
      void cliente.invalidateQueries({ queryKey: ['materiales'] })
    },
  })
}
