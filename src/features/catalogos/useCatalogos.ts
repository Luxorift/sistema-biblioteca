import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearCatalogo,
  crearUbicacion,
  obtenerCatalogo,
  obtenerEditoriales,
  obtenerUbicaciones,
} from './api'
import type { TipoCatalogo } from './types'

export function useCatalogo(tabla: TipoCatalogo) {
  return useQuery({
    queryKey: ['catalogos', tabla],
    queryFn: () => obtenerCatalogo(tabla),
  })
}
export function useUbicaciones() {
  return useQuery({ queryKey: ['catalogos', 'ubicaciones'], queryFn: obtenerUbicaciones })
}
export function useEditoriales() {
  return useQuery({ queryKey: ['catalogos', 'editoriales'], queryFn: obtenerEditoriales })
}
export function useCrearCatalogo(tabla: TipoCatalogo) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (nombre: string) => crearCatalogo(tabla, nombre),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['catalogos', tabla] }),
  })
}
export function useCrearUbicacion() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ estante, nivel }: { estante: string; nivel: number }) =>
      crearUbicacion(estante, nivel),
    onSuccess: () =>
      cliente.invalidateQueries({ queryKey: ['catalogos', 'ubicaciones'] }),
  })
}
