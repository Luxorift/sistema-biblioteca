import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarCatalogoSimple,
  actualizarUbicacion,
  crearCatalogo,
  crearCatalogoSimple,
  crearUbicacion,
  eliminarCatalogoSimple,
  eliminarUbicacion,
  obtenerCatalogo,
  obtenerCatalogoSimple,
  obtenerEditoriales,
  obtenerUbicaciones,
} from './api'
import type { TipoCatalogo, TipoCatalogoSimple } from './types'

// ─── Hooks existentes (compatibilidad) ──────────────────────────────────────

export function useCatalogo(tabla: TipoCatalogo) {
  return useQuery({
    queryKey: ['catalogos', tabla],
    queryFn: () => obtenerCatalogo(tabla),
  })
}

export function useUbicaciones() {
  return useQuery({
    queryKey: ['catalogos', 'ubicaciones'],
    queryFn: obtenerUbicaciones,
  })
}

export function useEditoriales() {
  return useQuery({
    queryKey: ['catalogos', 'editoriales'],
    queryFn: obtenerEditoriales,
  })
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

// ─── Hooks para administración completa ─────────────────────────────────────

export function useCatalogoSimple(tabla: TipoCatalogoSimple) {
  return useQuery({
    queryKey: ['catalogos', tabla],
    queryFn: () => obtenerCatalogoSimple(tabla),
  })
}

export function useCrearCatalogoSimple(tabla: TipoCatalogoSimple) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (nombre: string) => crearCatalogoSimple(tabla, nombre),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['catalogos', tabla] })
      if (tabla === 'editoriales') {
        cliente.invalidateQueries({ queryKey: ['catalogos', 'editoriales'] })
      }
    },
  })
}

export function useActualizarCatalogoSimple(tabla: TipoCatalogoSimple) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      actualizarCatalogoSimple(tabla, id, nombre),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['catalogos', tabla] })
      cliente.invalidateQueries({ queryKey: ['materiales'] })
      if (tabla === 'editoriales') {
        cliente.invalidateQueries({ queryKey: ['catalogos', 'editoriales'] })
      }
    },
  })
}

export function useEliminarCatalogoSimple(tabla: TipoCatalogoSimple) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eliminarCatalogoSimple(tabla, id),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['catalogos', tabla] })
      if (tabla === 'editoriales') {
        cliente.invalidateQueries({ queryKey: ['catalogos', 'editoriales'] })
      }
    },
  })
}

export function useActualizarUbicacion() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      estante,
      nivel,
    }: {
      id: number
      estante: string
      nivel: number
    }) => actualizarUbicacion(id, estante, nivel),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['catalogos', 'ubicaciones'] })
      cliente.invalidateQueries({ queryKey: ['ejemplares'] })
    },
  })
}

export function useEliminarUbicacion() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eliminarUbicacion(id),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['catalogos', 'ubicaciones'] })
    },
  })
}
