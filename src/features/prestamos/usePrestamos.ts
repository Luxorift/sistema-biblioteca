import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  obtenerCopiasDisponibles,
  obtenerPersonasActivas,
  registrarPrestamo,
} from './api'
import type { CopiaDisponible, DatosPrestamo, PersonaPrestataria } from './types'

export function useCopiasDisponibles() {
  return useQuery({
    queryKey: ['ejemplares', 'disponibles'],
    queryFn: obtenerCopiasDisponibles,
  })
}
export function usePersonasActivas() {
  return useQuery({ queryKey: ['personas', 'activas'], queryFn: obtenerPersonasActivas })
}
export function useRegistrarPrestamo() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({
      datos,
      copia,
      persona,
    }: {
      datos: DatosPrestamo
      copia: CopiaDisponible
      persona: PersonaPrestataria
    }) => registrarPrestamo(datos, copia, persona),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['ejemplares'] })
      cliente.invalidateQueries({ queryKey: ['materiales'] })
    },
  })
}
