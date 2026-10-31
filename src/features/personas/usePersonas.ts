import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarPersona,
  crearPersona,
  crearTipoPersona,
  obtenerPersonas,
  obtenerTiposPersona,
} from './api'
import type { FiltrosPersonas } from './api'
import type { DatosActualizarPersona } from './types'

export function usePersonas(filtros: FiltrosPersonas) {
  return useQuery({
    queryKey: ['personas', 'lista', filtros],
    queryFn: () => obtenerPersonas(filtros),
  })
}
export function useTiposPersona() {
  return useQuery({
    queryKey: ['catalogos', 'tipos-persona'],
    queryFn: obtenerTiposPersona,
  })
}
export function useCrearPersona() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: crearPersona,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['personas'] })
      void cliente.invalidateQueries({ queryKey: ['prestamos'] })
      void cliente.invalidateQueries({ queryKey: ['ejemplares'] })
    },
  })
}
export function useActualizarPersona() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({
      personaId,
      datos,
    }: {
      personaId: number
      datos: DatosActualizarPersona
    }) => actualizarPersona(personaId, datos),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['personas'] })
      void cliente.invalidateQueries({ queryKey: ['prestamos'] })
      void cliente.invalidateQueries({ queryKey: ['ejemplares'] })
    },
  })
}
export function useCrearTipoPersona() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: crearTipoPersona,
    onSuccess: () =>
      cliente.invalidateQueries({ queryKey: ['catalogos', 'tipos-persona'] }),
  })
}
