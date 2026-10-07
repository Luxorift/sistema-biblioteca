export interface CopiaEncontrada {
  codigo: string
  estado: string
  ubicacion: string | null
}

export interface MaterialEncontrado {
  id: number
  titulo: string
  tipo: string
  categoria: string | null
  editorial: string | null
  anio: number | null
  autores: string[]
  copias: CopiaEncontrada[]
}
