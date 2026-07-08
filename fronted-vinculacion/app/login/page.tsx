'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { GiCorn } from 'react-icons/gi';
import { loginSchema, LoginSchemaType } from '@/schemas/loginSchema';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // Inicializamos React Hook Form con Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user: '',
      password: '',
    },
  });

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Se ejecuta si Zod valida con éxito los campos vacíos
  const onSubmit = async (data: LoginSchemaType) => {
    setGeneralError('');
    setLoading(true);

    try {
      // Pasamos los datos validados como any para evitar rigidez de tipos con el Context
      await login(data as any);
    } catch (err: any) {
      setGeneralError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Lado izquierdo - Imagen */}
      <div className="md:w-[60%] relative min-h-[300px] md:min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/fondo.jpeg)' }}
        >
          <div className="absolute inset-0 bg-black/30 flex items-start justify-center pt-24">
            <div className="text-center text-white px-8">
              <h1 className="text-5xl font-bold mb-4">Sistema Contable</h1>
              <p className="text-xl">Gestión Agropecuaria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="md:w-[40%] p-8 md:p-12 flex items-center bg-white">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-600 to-emerald-600 rounded-2xl shadow-lg">
                <GiCorn className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Bienvenido
            </h2>
            <p className="text-gray-500 text-center">
              Inicia sesión en tu cuenta
            </p>
          </div>

          {generalError && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Input Usuario */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Email o Cédula"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-900 placeholder-gray-400 text-base ${
                    errors.user ? 'border-red-400 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  {...register('user')}
                />
              </div>
              {errors.user && (
                <p className="text-xs text-red-600 mt-1.5 ml-1">{errors.user.message}</p>
              )}
            </div>

            {/* Input Contraseña */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-gray-900 placeholder-gray-400 text-base ${
                    errors.password ? 'border-red-400 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1.5 ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-linear-to-r from-green-600 to-emerald-600 text-white py-2.5 px-4 rounded-full font-semibold text-base shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Link registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/registro"
                className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}