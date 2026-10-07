import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  obtenerMaterialesPrestables,
  obtenerPersonasActivas,
  registrarPrestamo,
} from './api'
import type { CopiaDisponible, DatosPrestamo, PersonaPrestataria } from './types'

export function useMaterialesPrestables() {
  return useQuery({
    queryKey: ['materiales', 'prestables'],
    queryFn: obtenerMaterialesPrestables,
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
      copias,
      persona,
    }: {
      datos: DatosPrestamo
      copias: CopiaDisponible[]
      persona: PersonaPrestataria
    }) => registrarPrestamo(datos, copias, persona),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['ejemplares'] })
      cliente.invalidateQueries({ queryKey: ['materiales'] })
    },
  })
}
