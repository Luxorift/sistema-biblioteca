export interface CopiaDisponible {
  id: number
  codigo: string
  titulo: string
  ubicacion: string | null
}

export interface MaterialPrestable {
  id: number
  titulo: string
  editorial: string | null
  anio: number | null
  tipo: string
  categoria: string | null
  autores: string[]
  copias: CopiaDisponible[]
  cantidadCopias: number
}

export interface PersonaPrestataria {
  id: number
  nombreCompleto: string
  dni: string
  tipo: string
}

export interface DatosPrestamo {
  ejemplarIds: number[]
  cantidad: number
  personaId: number
  fechaPrestamo: string
  tieneFechaLimite: boolean
  fechaLimite: string
}

export interface PrestamoConfirmado {
  codigos: string[]
  titulo: string
  persona: string
  fechaPrestamo: string
  fechaLimite: string | null
}

// Histórico de préstamos
export interface PrestamoHistorico {
  id: number
  codigo: string
  titulo: string
  persona: string
  dni: string
  tipoPersona: string
  fechaPrestamo: string
  fechaLimite: string | null
  fechaDevolucion: string | null
  estaAtrasado: boolean
  diasAtraso: number
}
