import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarPersona,
  crearPersona,
  crearTipoPersona,
  obtenerPersonas,
  obtenerTiposPersona,
} from './api'
import type { DatosActualizarPersona } from './types'

export function usePersonas() {
  return useQuery({ queryKey: ['personas'], queryFn: obtenerPersonas })
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
      void cliente.invalidateQueries({ queryKey: ['personas-activas'] })
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
      void cliente.invalidateQueries({ queryKey: ['personas-activas'] })
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
