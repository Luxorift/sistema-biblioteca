import { z } from 'zod'

export const esquemaEditarEjemplar = z.object({
  estado: z.enum(['disponible', 'prestado', 'en_reparacion', 'perdido', 'baja'], {
    message: 'Elige un estado válido.',
  }),
  ubicacionId: z
    .number()
    .positive()
    .nullable()
    .superRefine((id, contexto) => {
      if (id === null)
        contexto.addIssue({
          code: 'custom',
          message: 'Elige la ubicación de esta copia.',
        })
    }),
  observaciones: z
    .string()
    .trim()
    .max(500, 'Las observaciones no pueden superar los 500 caracteres.'),
})

export type FormularioEditarEjemplar = z.infer<typeof esquemaEditarEjemplar>
