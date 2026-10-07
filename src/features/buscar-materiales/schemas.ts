import { z } from 'zod'

const anioMaximo = new Date().getFullYear() + 1

export const esquemaEditarMaterial = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(3, 'Escribe un título de al menos 3 letras.')
      .max(300, 'El título es demasiado largo.'),
    tipoMaterialId: z.number().positive('Elige un tipo de material.'),
    categoriaId: z.number().positive().nullable(),
    editorial: z.string().trim().max(200, 'La editorial es demasiado larga.'),
    anio: z
      .number()
      .int('Escribe un año completo.')
      .min(1400, 'El año debe ser 1400 o posterior.')
      .max(anioMaximo, `El año no puede ser posterior a ${anioMaximo}.`)
      .nullable(),
    autores: z.array(
      z.object({
        nombre: z.string().trim().max(200, 'El autor es demasiado largo.'),
      }),
    ),
    cantidadCopias: z
      .number()
      .int('La cantidad debe ser un número entero.')
      .min(0, 'Indica cuántas copias activas hay.')
      .max(500, 'Puedes registrar hasta 500 copias activas.'),
    cantidadDisponibles: z
      .number()
      .int('La cantidad debe ser un número entero.')
      .min(0, 'Indica cuántas copias están disponibles.')
      .max(500, 'El número de disponibles es demasiado alto.'),
  })
  .refine((datos) => datos.cantidadDisponibles <= datos.cantidadCopias, {
    message: 'Las disponibles no pueden ser más que el total de copias.',
    path: ['cantidadDisponibles'],
  })

export type FormularioEditarMaterial = z.infer<typeof esquemaEditarMaterial>
