import { z } from 'zod'

export const esquemaPrestamo = z.object({
  ejemplarId: z.number().positive('Elige una copia disponible.'),
  personaId: z.number().positive('Elige una persona.'),
  fechaLimite: z.string(),
})
export type FormularioPrestamo = z.infer<typeof esquemaPrestamo>
