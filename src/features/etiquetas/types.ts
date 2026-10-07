export type FormatoEtiqueta = 'ambos' | 'barras' | 'qr'

export interface CopiaParaEtiqueta {
  id: number
  codigo: string
  materialId: number
  titulo: string
  autores: string[]
  ubicacion: string | null
  tipo: string
  estado: string
}

export interface MaterialConCopias {
  materialId: number
  titulo: string
  autores: string[]
  tipo: string
  copias: CopiaParaEtiqueta[]
}
