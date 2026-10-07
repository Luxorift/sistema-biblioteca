export type EstadoEjemplar =
  | 'disponible'
  | 'prestado'
  | 'en_reparacion'
  | 'perdido'
  | 'baja'

export interface PrestamoActivoResumen {
  prestamoId: number
  persona: string
  dni: string
  tipoPersona: string
  fechaPrestamo: string
  fechaLimite: string | null
}

export interface EjemplarDetallado {
  id: number
  codigo: string
  materialId: number
  titulo: string
  autores: string[]
  tipoMaterial: string
  ubicacionId: number | null
  ubicacion: string | null
  estado: EstadoEjemplar
  observaciones: string | null
  prestamoActivo: PrestamoActivoResumen | null
}

export interface DatosActualizarEjemplar {
  estado: EstadoEjemplar
  ubicacionId: number | null
  observaciones: string
}
