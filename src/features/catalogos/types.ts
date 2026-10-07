export interface OpcionCatalogo {
  id: number
  nombre: string
}
export interface Ubicacion {
  id: number
  estante: string
  nivel: number
}
export type TipoCatalogo = 'tipos_material' | 'categorias'
