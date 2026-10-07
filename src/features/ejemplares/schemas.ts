import { z } from 'zod'

export const esquemaEditarEjemplar = z.object({
  estado: z.enum(['disponible', 'prestado', 'en_reparacion', 'perdido', 'baja'], {
    message: 'Elige un estado válido.',
  }),
  ubicacionId: z.number().nullable(),
  observaciones: z
    .string()
    .trim()
    .max(500, 'Las observaciones no pueden superar los 500 caracteres.'),
})

export type FormularioEditarEjemplar = z.infer<typeof esquemaEditarEjemplar>
