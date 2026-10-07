import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearPersona,
  crearTipoPersona,
  obtenerPersonas,
  obtenerTiposPersona,
} from './api'

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
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['personas'] }),
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
