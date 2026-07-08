'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { FiUser, FiMail, FiPhone, FiLock, FiCreditCard } from 'react-icons/fi';
import { GiCorn } from 'react-icons/gi';
import { registroSchema, RegistroSchemaType } from '../../schemas/registroSchema';
export default function RegistroPage() {
  const router = useRouter();
  const { registro } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inicializamos React Hook Form con el validador de Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroSchemaType>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: '',
      cedula: '',
      email: '',
      telefono: '',
      area: '',
      tipo: 'trabajador',
      password: '',
      confirmPassword: '',
    },
  });

  // Este método solo se ejecutará si Zod aprueba todas las validaciones del formulario
 const onSubmit = async (data: RegistroSchemaType) => {
  setLoading(true);
  setGeneralError(null);
  try {
    // Forzamos el tipo aquí para que no choque con la interfaz rígida del contexto
    await registro(data as any); 
    
    // router.push('/dashboard');
  } catch (err: any) {
    setGeneralError(err.message || 'Ocurrió un error al intentar registrar el usuario.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-600 to-emerald-600 rounded-2xl shadow-lg mb-4">
            <GiCorn className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro de Usuario
          </h1>
          <p className="text-gray-600">
            Completa el formulario para crear tu cuenta
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-10">
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Input
                label="Nombre Completo"
                type="text"
                placeholder="Ingresa tu nombre completo"
                icon={<FiUser className="h-5 w-5 text-gray-400" />}
                error={errors.nombre?.message}
                {...register('nombre')}
              />

              <Input
                label="Cédula"
                type="text"
                placeholder="Ingresa tu número de cédula"
                icon={<FiCreditCard className="h-5 w-5 text-gray-400" />}
                error={errors.cedula?.message}
                {...register('cedula')}
              />

              <Input
                label="Email"
                type="email"
                placeholder="Ingresa tu correo electrónico"
                icon={<FiMail className="h-5 w-5 text-gray-400" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Teléfono"
                type="tel"
                placeholder="Ingresa tu número de teléfono"
                icon={<FiPhone className="h-5 w-5 text-gray-400" />}
                error={errors.telefono?.message}
                {...register('telefono')}
              />

              <Select
                label="Área de Trabajo"
                options={[
                  { value: 'cultivos', label: 'Cultivos' },
                  { value: 'ganaderia', label: 'Ganadería' },
                  { value: 'mantenimiento', label: 'Mantenimiento' },
                  { value: 'administracion', label: 'Administración' },
                  { value: 'investigacion', label: 'Investigación' },
                ]}
                error={errors.area?.message}
                {...register('area')}
              />

              <Select
                label="Tipo de Usuario"
                options={[
                  { value: 'trabajador', label: 'Trabajador' },
                  { value: 'administrador', label: 'Administrador' },
                ]}
                error={errors.tipo?.message}
                {...register('tipo')}
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="Crea una contraseña (mínimo 6 caracteres)"
                icon={<FiLock className="h-5 w-5 text-gray-400" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                placeholder="Confirma tu contraseña"
                icon={<FiLock className="h-5 w-5 text-gray-400" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-6"
              loading={loading}
            >
              Registrarse
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}