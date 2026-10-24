import { z } from 'zod';

export const loginSchema = z.object({
  // Permitimos que ingrese email o cédula, así que validamos que al menos no venga vacío
  user: z.string().min(1, 'Ingresa tu correo electrónico o número de cédula'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;