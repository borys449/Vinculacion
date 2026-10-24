import { z } from 'zod';

export const registroSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  cedula: z.string().length(10, 'La cédula ecuatoriana debe tener exactamente 10 dígitos').regex(/^\d+$/, 'La cédula solo debe contener números'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  telefono: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos').regex(/^\d+$/, 'El teléfono solo debe contener números'),
  
  area: z.string().min(1, 'Selecciona un área válida'),
  tipo: z.string().min(1, 'Selecciona un tipo de usuario válido'),
  
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type RegistroSchemaType = z.infer<typeof registroSchema>;