import { z } from 'zod'

export const esquemaPrestamo = z
  .object({
    ejemplarIds: z
      .array(z.number().positive())
      .min(1, 'Elige al menos una copia disponible.'),
    cantidad: z.number().int().min(1, 'Indica cuántas copias se prestarán.'),
    personaId: z.number().positive('Elige una persona.'),
    fechaPrestamo: z.string().min(1, 'Indica la fecha de préstamo.'),
    tieneFechaLimite: z.boolean(),
    fechaLimite: z.string(),
  })
  .superRefine((datos, contexto) => {
    if (datos.ejemplarIds.length !== datos.cantidad)
      contexto.addIssue({
        code: 'custom',
        path: ['cantidad'],
        message: 'Elige la misma cantidad de copias que indicaste.',
      })
    if (datos.fechaPrestamo > new Date().toISOString().slice(0, 10))
      contexto.addIssue({
        code: 'custom',
        path: ['fechaPrestamo'],
        message: 'La fecha de préstamo no puede ser futura.',
      })
    if (datos.tieneFechaLimite && !datos.fechaLimite)
      contexto.addIssue({
        code: 'custom',
        path: ['fechaLimite'],
        message: 'Indica la fecha límite o marca préstamo indefinido.',
      })
    if (datos.tieneFechaLimite && datos.fechaLimite < datos.fechaPrestamo)
      contexto.addIssue({
        code: 'custom',
        path: ['fechaLimite'],
        message: 'La fecha límite debe ser igual o posterior al préstamo.',
      })
  })
export type FormularioPrestamo = z.infer<typeof esquemaPrestamo>
