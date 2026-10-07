import { z } from 'zod'

export const esquemaCrearUsuario = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 letras.')
    .max(100, 'El nombre es muy largo (máximo 100 caracteres).'),
  email: z
    .string()
    .trim()
    .email('Ingresa un correo electrónico válido (ejemplo: usuario@colegio.edu.pe).'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  rol: z.enum(['admin', 'bibliotecario'], {
    error: 'Debes seleccionar un rol para el usuario.',
  }),
})

export type FormularioCrearUsuario = z.infer<typeof esquemaCrearUsuario>

export const esquemaEditarUsuario = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 letras.')
    .max(100, 'El nombre es muy largo (máximo 100 caracteres).'),
  rol: z.enum(['admin', 'bibliotecario'], {
    error: 'Debes seleccionar un rol para el usuario.',
  }),
  activo: z.boolean(),
})

export type FormularioEditarUsuario = z.infer<typeof esquemaEditarUsuario>
