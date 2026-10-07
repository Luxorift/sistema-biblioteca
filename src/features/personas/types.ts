export interface TipoPersona {
  id: number
  nombre: string
}

export interface Persona {
  id: number
  tipoPersonaId: number
  tipoPersona: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string | null
  dni: string
  correo: string | null
  activo: boolean
}

export interface DatosPersona {
  tipoPersonaId: number
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  dni: string
  correo: string
}
