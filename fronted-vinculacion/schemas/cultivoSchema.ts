import { z } from 'zod';

export const cultivoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre del cultivo debe tener al menos 3 caracteres'),
  tipo: z.enum(['vegetal', 'frutal', 'cereal', 'hortaliza', 'leguminosa', 'otro'], {
    message: 'Tipo de cultivo no válido',
  }),
  area: z
    .number({ message: 'El área debe ser un número' })
    .positive('El área debe ser un valor positivo mayor a cero'),
  unidad: z.enum(['metros', 'hectareas'], {
    message: 'Unidad no válida',
  }),
  ubicacion: z
    .string()
    .trim()
    .min(3, 'La ubicación debe tener al menos 3 caracteres'),
  fechaSiembra: z
    .string()
    .min(1, 'La fecha de siembra es requerida')
    .refine((val) => !isNaN(Date.parse(val)), 'Fecha de siembra no válida'),
  fechaCosechaEstimada: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Fecha de cosecha no válida'),
  estado: z.enum(['siembra', 'crecimiento', 'floracion', 'cosecha', 'completado'], {
    message: 'Estado no válido',
  }),
  rendimiento: z
    .number({ message: 'El rendimiento debe ser un número' })
    .positive('El rendimiento debe ser un valor positivo')
    .optional()
    .or(z.literal(0))
    .or(z.nan()),
  observaciones: z.string().trim().optional(),
});

export type CultivoSchemaType = z.infer<typeof cultivoSchema>;
