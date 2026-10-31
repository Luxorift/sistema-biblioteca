import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarEstadoEjemplar, obtenerEjemplaresDetallados } from './api'
import type { DatosActualizarEjemplar } from './types'

export function useEjemplares() {
  return useQuery({
    queryKey: ['ejemplares', 'detallados'],
    queryFn: obtenerEjemplaresDetallados,
  })
}

export function useActualizarEstadoEjemplar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ejemplarId,
      datos,
    }: {
      ejemplarId: number
      datos: DatosActualizarEjemplar
    }) => actualizarEstadoEjemplar(ejemplarId, datos),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ejemplares'] }),
        queryClient.invalidateQueries({ queryKey: ['materiales'] }),
        queryClient.invalidateQueries({ queryKey: ['etiquetas'] }),
      ]),
  })
}
