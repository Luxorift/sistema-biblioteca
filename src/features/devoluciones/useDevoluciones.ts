import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { obtenerPrestamosPendientes, registrarDevolucion } from './api'
import type { PrestamoPendiente } from './types'

export function usePrestamosPendientes() {
  return useQuery({
    queryKey: ['prestamos', 'pendientes'],
    queryFn: obtenerPrestamosPendientes,
  })
}
export function useRegistrarDevolucion() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ prestamo, fecha }: { prestamo: PrestamoPendiente; fecha: string }) =>
      registrarDevolucion(prestamo, fecha),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['prestamos'] })
      cliente.invalidateQueries({ queryKey: ['ejemplares'] })
      cliente.invalidateQueries({ queryKey: ['materiales'] })
    },
  })
}
