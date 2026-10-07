export interface PrestamoPendiente {
  id: number
  codigo: string
  titulo: string
  persona: string
  dni: string
  tipoPersona: string
  fechaPrestamo: string
  fechaLimite: string | null
}

export interface DevolucionConfirmada {
  codigo: string
  titulo: string
  persona: string
  fechaDevolucion: string
}
