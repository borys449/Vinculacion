import { z } from 'zod';
import {
  PROPOSITOS_POR_ESPECIE,
  RAZAS_POR_ESPECIE_Y_PROPOSITO,
  PropositoOviparo,
} from '@/constants/oviparos';

export const ganadoSchema = z.object({
  identificacion: z
    .string()
    .trim()
    .min(3, 'La identificación del animal es requerida'),
  tipo: z.enum(['bovino', 'porcino', 'ovino', 'caprino', 'avicola', 'oviparo', 'otro'], {
    message: 'Tipo de ganado no válido',
  }),
  especie: z.enum(['gallina', 'pato', 'pavo', 'codorniz', 'ganso', ''], {
    message: 'Especie de ave no válida',
  }).optional(),
  raza: z
    .string()
    .trim()
    .min(2, 'La raza debe tener al menos 2 caracteres')
    .optional()
    .or(z.literal('')),
  proposito: z
    .enum(['leche', 'huevos', 'carne', 'doble_proposito', 'reproduccion', ''], {
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
    .refine((val) => !Number.isNaN(Date.parse(val)), 'Fecha de nacimiento no válida'),
  sexo: z.enum(['macho', 'hembra'], {
    message: 'Sexo no válido',
  }),
  estadoSalud: z.enum(['sano', 'en_recuperacion', 'enfermo']),
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
}).superRefine((data, context) => {
  if (data.tipo !== 'oviparo') return;

  const species = data.especie;
  if (!species) {
    context.addIssue({ code: 'custom', path: ['especie'], message: 'Seleccione la especie del ave' });
    return;
  }

  const purpose = data.proposito as PropositoOviparo | undefined;
  const purposes = PROPOSITOS_POR_ESPECIE[species];
  if (!purpose || !purposes.some((option) => option.value === purpose)) {
    context.addIssue({
      code: 'custom',
      path: ['proposito'],
      message: 'Seleccione un propósito válido para esta especie',
    });
    return;
  }

  const breeds = RAZAS_POR_ESPECIE_Y_PROPOSITO[species][purpose];
  if (!data.raza || !breeds?.includes(data.raza)) {
    context.addIssue({
      code: 'custom',
      path: ['raza'],
      message: 'Seleccione una raza válida para la especie y propósito',
    });
  }
});

export type GanadoSchemaType = z.infer<typeof ganadoSchema>;
