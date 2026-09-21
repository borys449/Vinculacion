import { z } from 'zod';

export const ganadoSchema = z.object({
  identificacion: z
    .string()
    .trim()
    .min(3, 'La identificación del animal es requerida'),
  tipo: z.enum(['bovino', 'porcino', 'ovino', 'caprino', 'avicola', 'otro'], {
    message: 'Tipo de ganado no válido',
  }),
  raza: z
    .string()
    .trim()
    .min(2, 'La raza debe tener al menos 2 caracteres')
    .optional()
    .or(z.literal('')),
  proposito: z
    .enum(['leche', 'carne', 'doble_proposito', ''], {
      message: 'Propósito no válido',
    })
    .optional(),
  produccionEstimadaDiaria: z
    .number({ message: 'La producción estimada debe ser un número' })
    .min(0, 'La producción estimada no puede ser negativa')
    .optional()
    .or(z.literal(0))
    .or(z.nan()),
  fechaNacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine((val) => !isNaN(Date.parse(val)), 'Fecha de nacimiento no válida'),
  sexo: z.enum(['macho', 'hembra'], {
    message: 'Sexo no válido',
  }),
  estadoSalud: z.enum(['excelente', 'bueno', 'regular', 'enfermo'], {
    message: 'Estado de salud no válido',
  }),
  
  estado: z.enum(['activo', 'inactivo', 'vendido', 'enfermo', 'gestacion', 'fallecido'], {
    message: 'Estado de gestión no válido',
  }),

  pesoInicial: z
    .number({ message: 'El peso inicial debe ser un número' })
    .min(0, 'El peso inicial no puede ser negativo')
    .optional()
    .or(z.literal(0))
    .or(z.nan()),
  pesoActual: z
    .number({ message: 'El peso actual debe ser un número' })
    .min(0, 'El peso actual no puede ser negativo')
    .optional()
    .or(z.literal(0))
    .or(z.nan()),
  observaciones: z.string().trim().optional(),
  activo: z.boolean(),
});

export type GanadoSchemaType = z.infer<typeof ganadoSchema>;