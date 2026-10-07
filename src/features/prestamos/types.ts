export interface CopiaDisponible {
  id: number
  codigo: string
  titulo: string
  ubicacion: string | null
}

export interface PersonaPrestataria {
  id: number
  nombreCompleto: string
  dni: string
  tipo: string
}

export interface DatosPrestamo {
  ejemplarId: number
  personaId: number
  fechaPrestamo: string
  tieneFechaLimite: boolean
  fechaLimite: string
}

export interface PrestamoConfirmado {
  codigo: string
  titulo: string
  persona: string
  fechaPrestamo: string
  fechaLimite: string | null
}
