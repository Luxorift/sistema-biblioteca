import { z } from 'zod'

export const esquemaPersona = z.object({
  tipoPersonaId: z.number().positive('Elige el tipo de persona.'),
  nombres: z
    .string()
    .trim()
    .min(2, 'Escribe los nombres.')
    .max(120, 'Los nombres son demasiado largos.'),
  apellidoPaterno: z
    .string()
    .trim()
    .min(2, 'Escribe el apellido paterno.')
    .max(80, 'El apellido es demasiado largo.'),
  apellidoMaterno: z.string().trim().max(80, 'El apellido es demasiado largo.'),
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 números.'),
  correo: z
    .string()
    .trim()
    .max(160, 'El correo es demasiado largo.')
    .refine(
      (valor) => !valor || z.email().safeParse(valor).success,
      'El correo no parece válido.',
    ),
})

export type FormularioPersona = z.infer<typeof esquemaPersona>
