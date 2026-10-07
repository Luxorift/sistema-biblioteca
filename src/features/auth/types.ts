// Coincide con la tabla "perfiles" de la base de datos.
export type Rol = 'admin' | 'bibliotecario'

export interface Perfil {
  id: string
  nombre: string
  rol: Rol
  activo: boolean
}

export const etiquetaRol: Record<Rol, string> = {
  admin: 'Administrador',
  bibliotecario: 'Bibliotecario',
}
