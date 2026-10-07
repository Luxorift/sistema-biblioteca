export interface CopiaEncontrada {
  id: number
  codigo: string
  estado: string
  ubicacion: string | null
}

export interface MaterialEncontrado {
  id: number
  titulo: string
  tipoMaterialId: number
  tipo: string
  categoriaId: number | null
  categoria: string | null
  editorial: string | null
  anio: number | null
  autores: string[]
  copias: CopiaEncontrada[]
}

export interface DatosActualizarMaterial {
  titulo: string
  tipoMaterialId: number
  categoriaId: number | null
  editorial: string
  anio: number | null
  autores: string[]
  cantidadCopias: number
  cantidadDisponibles: number
}
