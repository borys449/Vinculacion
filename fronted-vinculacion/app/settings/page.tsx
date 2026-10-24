'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiSave,
  FiCreditCard,
} from 'react-icons/fi';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    cedula: user?.cedula || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Aquí iría la llamada a la API para actualizar el perfil
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulación
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    setLoading(true);

    try {
      // Aquí iría la llamada a la API para cambiar la contraseña
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulación
      setMessage({
        type: 'success',
        text: 'Contraseña actualizada correctamente',
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-white min-h-screen p-6 rounded-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">
          Administra tu perfil y preferencias
        </p>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del usuario */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-linear-to-br from-green-600 to-emerald-600 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-3xl">
                {user?.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.nombre}
            </h2>
            <p className="text-gray-600 text-sm mt-1">{user?.tipo}</p>
            <div className="mt-4 pt-4 border-t">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Área:</span>
                  <span className="font-medium text-gray-900">
                    {user?.area}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-green-600">Activo</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Formularios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editar perfil */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información Personal
            </h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo"
                  type="text"
                  value={profileData.nombre}
                  onChange={(e) =>
                    setProfileData({ ...profileData, nombre: e.target.value })
                  }
                  icon={<FiUser className="h-5 w-5 text-gray-400" />}
                  required
                />

                <Input
                  label="Cédula"
                  type="text"
                  value={profileData.cedula}
                  onChange={(e) =>
                    setProfileData({ ...profileData, cedula: e.target.value })
                  }
                  icon={<FiCreditCard className="h-5 w-5 text-gray-400" />}
                  required
                  disabled
                />

                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  icon={<FiMail className="h-5 w-5 text-gray-400" />}
                  required
                />

                <Input
                  label="Teléfono"
                  type="tel"
                  value={profileData.telefono}
                  onChange={(e) =>
                    setProfileData({ ...profileData, telefono: e.target.value })
                  }
                  icon={<FiPhone className="h-5 w-5 text-gray-400" />}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  icon={<FiSave />}
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>

          {/* Cambiar contraseña */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cambiar Contraseña
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Input
                label="Contraseña Actual"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                icon={<FiLock className="h-5 w-5 text-gray-400" />}
                placeholder="Ingresa tu contraseña actual"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nueva Contraseña"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  icon={<FiLock className="h-5 w-5 text-gray-400" />}
                  placeholder="Mínimo 6 caracteres"
                  required
                />

                <Input
                  label="Confirmar Contraseña"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  icon={<FiLock className="h-5 w-5 text-gray-400" />}
                  placeholder="Confirma la nueva contraseña"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  icon={<FiLock />}
                >
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
