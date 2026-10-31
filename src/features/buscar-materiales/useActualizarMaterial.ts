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
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: ['materiales'] }),
        cliente.invalidateQueries({ queryKey: ['ejemplares'] }),
        cliente.invalidateQueries({ queryKey: ['etiquetas'] }),
        cliente.invalidateQueries({ queryKey: ['catalogos'] }),
        cliente.invalidateQueries({ queryKey: ['prestamos'] }),
      ]),
  })
}
