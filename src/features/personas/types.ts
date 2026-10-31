export interface TipoPersona {
  id: number
  nombre: string
}

export interface Persona {
  id: number
  codigo: string
  tipoPersonaId: number
  tipoPersona: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string | null
  dni: string
  correo: string | null
  activo: boolean
  prestamosActivos?: number
}

export interface PersonaCredencial {
  id: number
  codigo: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string | null
  dni: string
  tipoPersona: string
  activo: boolean
}

export interface PrestamoCredencial {
  id: number
  codigo: string
  titulo: string
  fechaPrestamo: string
  fechaLimite: string | null
  estaAtrasado: boolean
  diasAtraso: number
}

export interface ConsultaCredencial {
  persona: PersonaCredencial
  pendientes: number
  atrasados: number
  maxDiasAtraso: number
  prestamos: PrestamoCredencial[]
}

export interface DatosPersona {
  tipoPersonaId: number
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  dni: string
  correo: string
}

export interface DatosActualizarPersona {
  tipoPersonaId: number
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  correo: string
  activo: boolean
}
