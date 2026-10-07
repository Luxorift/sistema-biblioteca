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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ejemplares'] })
      void queryClient.invalidateQueries({ queryKey: ['materiales'] })
      void queryClient.invalidateQueries({ queryKey: ['buscar-materiales'] })
      void queryClient.invalidateQueries({ queryKey: ['materiales-prestables'] })
      void queryClient.invalidateQueries({ queryKey: ['etiquetas'] })
    },
  })
}
