import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { importarInventario, obtenerContextoImportacion } from './api'

export function useContextoImportacion() {
  return useQuery({
    queryKey: ['intercambio', 'contexto'],
    queryFn: obtenerContextoImportacion,
    staleTime: 0,
  })
}
export function useImportarInventario() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: importarInventario,
    onSuccess: () =>
      Promise.all(
        ['intercambio', 'catalogos', 'materiales', 'ejemplares', 'etiquetas'].map(
          (clave) => cliente.invalidateQueries({ queryKey: [clave] }),
        ),
      ),
  })
}
