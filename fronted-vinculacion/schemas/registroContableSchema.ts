import { z } from 'zod';

export const registroContableSchema = z
  .object({
    tipo: z.enum(
      ['cultivo', 'ganado', 'mantenimiento', 'produccion', 'venta', 'otro'],
      { message: 'Tipo de registro no válido' }
    ),
    categoria: z.string().trim().min(2, 'La categoría es requerida'),
    descripcion: z
      .string()
      .trim()
      .min(5, 'La descripción debe tener al menos 5 caracteres'),
    fecha: z
      .string()
      .min(1, 'La fecha es requerida')
      .refine((val) => !isNaN(Date.parse(val)), 'Fecha no válida'),
    cantidad: z
      .number({ message: 'La cantidad debe ser un número' })
      .positive('La cantidad debe ser mayor a cero')
      .optional()
      .or(z.literal(0))
      .or(z.nan()),
    unidad: z
      .enum(
        ['kg', 'toneladas', 'litros', 'unidades', 'metros', 'hectareas', 'otro', ''],
        { message: 'Unidad no válida' }
      )
      .optional()
      .or(z.literal('')),
    costo: z
      .number({ message: 'El costo debe ser un número' })
      .positive('El costo debe ser mayor a cero')
      .optional()
      .or(z.literal(0))
      .or(z.nan()),
    ingresos: z
      .number({ message: 'Los ingresos deben ser un número' })
      .positive('Los ingresos deben ser mayor a cero')
      .optional()
      .or(z.literal(0))
      .or(z.nan()),
    observaciones: z.string().trim().optional(),
    cultivoId: z
      .number({ message: 'Selecciona un cultivo' })
      .optional()
      .or(z.literal(0))
      .or(z.nan()),
    ganadoId: z
      .number({ message: 'Selecciona un animal' })
      .optional()
      .or(z.literal(0))
      .or(z.nan()),
  })
  .refine((data) => {
    if (data.tipo === 'cultivo') {
      return !!data.cultivoId && data.cultivoId > 0;
    }
    return true;
  }, {
    message: 'Debes seleccionar un cultivo relacionado',
    path: ['cultivoId'],
  })
  .refine((data) => {
    if (data.tipo === 'ganado') {
      return !!data.ganadoId && data.ganadoId > 0;
    }
    return true;
  }, {
    message: 'Debes seleccionar un animal relacionado',
    path: ['ganadoId'],
  });

export type RegistroContableSchemaType = z.infer<typeof registroContableSchema>;
