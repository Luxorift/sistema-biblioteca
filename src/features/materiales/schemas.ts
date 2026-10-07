import { z } from 'zod'

const anioMaximo = new Date().getFullYear() + 1
export const esquemaMaterial = z.object({
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
    z.object({ nombre: z.string().trim().max(200, 'El autor es demasiado largo.') }),
  ),
  cantidad: z
    .number()
    .int('La cantidad debe ser un número entero.')
    .min(1, 'Registra al menos una copia.')
    .max(500, 'Puedes registrar hasta 500 copias a la vez.'),
  ubicacionId: z.number().positive().nullable(),
})
export type FormularioMaterial = z.infer<typeof esquemaMaterial>
