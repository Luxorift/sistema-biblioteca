import { z } from 'zod'

export const esquemaElementoCatalogo = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 letras.')
    .max(120, 'El nombre es muy largo (máximo 120 caracteres).'),
})

export type FormularioElementoCatalogo = z.infer<typeof esquemaElementoCatalogo>

export const esquemaUbicacion = z.object({
  estante: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]$/, 'El estante debe ser una sola letra de la A a la Z (ejemplo: B).'),
  nivel: z
    .number({ error: 'Ingresa un número de nivel válido.' })
    .int('El nivel debe ser un número entero.')
    .min(1, 'El nivel debe ser como mínimo 1.')
    .max(99, 'El nivel debe ser menor o igual a 99.'),
})

export type FormularioUbicacion = z.infer<typeof esquemaUbicacion>
