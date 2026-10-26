import { z } from 'zod';

export const registroContableSchema = z
  .object({
    tipo: z.enum(
      ['cultivo', 'ganado', 'mantenimiento', 'produccion', 'venta', 'leche', 'otro'],
      { message: 'Tipo de registro no válido' }
    ),
    categoria: z.string().trim().min(1, 'La categoría es requerida'),
    
    // 🚀 Descripción totalmente opcional para no bloquear el botón
    descripcion: z.string().trim().optional().or(z.literal('')),
    
    fecha: z
      .string()
      .min(1, 'La fecha es requerida')
      .refine((val) => !isNaN(Date.parse(val)), 'Fecha no válida'),
    
    cantidad: z
      .number({ message: 'La cantidad debe ser un número' })
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
      .optional()
      .or(z.literal(0))
      .or(z.nan()),
    
    ingresos: z
      .number({ message: 'Los ingresos deben ser un número' })
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
  });

export type RegistroContableSchemaType = z.infer<typeof registroContableSchema>;