export interface MaterialSimilar {
  id: number
  titulo: string
  editorial: string | null
  anio_publicacion: number | null
  similitud: number
  copias: number
}
export interface EjemplarCreado {
  id: number
  codigo: string
  material_id: number
  ubicacion_id: number | null
}
export interface ResultadoRegistro {
  materialId: number
  yaExistia: boolean
}
export interface ResumenMaterial {
  materialId: number
  titulo: string
  codigos: string[]
}
export interface DatosMaterial {
  titulo: string
  tipoMaterialId: number
  categoriaId: number | null
  editorial: string
  anio: number | null
  autores: string[]
  cantidad: number
  ubicacionId: number | null
}
