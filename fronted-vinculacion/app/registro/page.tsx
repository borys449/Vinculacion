'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { FiUser, FiMail, FiPhone, FiLock, FiCreditCard } from 'react-icons/fi';
import { GiCorn } from 'react-icons/gi';

export default function RegistroPage() {
  const router = useRouter();
  const { registro } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    area: '' as any,
    tipo: 'trabajador' as any,
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: any = {};

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!/^[0-9]{10}$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await registro(formData);
    } catch (err: any) {
      setErrors({ general: err.message });
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
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre Completo"
                type="text"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ingresa tu nombre completo"
                icon={<FiUser className="h-5 w-5 text-gray-400" />}
                required
              />

              <Input
                label="Cédula"
                type="text"
                value={formData.cedula}
                onChange={(e) =>
                  setFormData({ ...formData, cedula: e.target.value })
                }
                placeholder="Ingresa tu número de cédula"
                icon={<FiCreditCard className="h-5 w-5 text-gray-400" />}
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Ingresa tu correo electrónico"
                icon={<FiMail className="h-5 w-5 text-gray-400" />}
                error={errors.email}
                required
              />

              <Input
                label="Teléfono"
                type="tel"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                placeholder="Ingresa tu número de teléfono"
                icon={<FiPhone className="h-5 w-5 text-gray-400" />}
                error={errors.telefono}
                required
              />

              <Select
                label="Área de Trabajo"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                options={[
                  { value: 'cultivos', label: 'Cultivos' },
                  { value: 'ganaderia', label: 'Ganadería' },
                  { value: 'mantenimiento', label: 'Mantenimiento' },
                  { value: 'administracion', label: 'Administración' },
                  { value: 'investigacion', label: 'Investigación' },
                ]}
                required
              />

              <Select
                label="Tipo de Usuario"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
                options={[
                  { value: 'trabajador', label: 'Trabajador' },
                  { value: 'administrador', label: 'Administrador' },
                ]}
                required
              />

              <Input
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Crea una contraseña (mínimo 6 caracteres)"
                icon={<FiLock className="h-5 w-5 text-gray-400" />}
                error={errors.password}
                required
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirma tu contraseña"
                icon={<FiLock className="h-5 w-5 text-gray-400" />}
                error={errors.confirmPassword}
                required
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
