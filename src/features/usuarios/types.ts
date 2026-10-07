export type RolApp = 'admin' | 'bibliotecario'

export interface UsuarioSistema {
  id: string
  nombre: string
  rol: RolApp
  activo: boolean
  created_at: string
  email?: string
}

export interface CrearUsuarioInput {
  email: string
  password: string
  nombre: string
  rol: RolApp
}

export interface ActualizarUsuarioInput {
  nombre?: string
  rol?: RolApp
  activo?: boolean
}

export const ETIQUETAS_ROL: Record<RolApp, string> = {
  admin: 'Administrador',
  bibliotecario: 'Bibliotecario',
}
