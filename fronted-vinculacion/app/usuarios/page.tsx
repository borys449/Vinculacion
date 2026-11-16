'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { usuarioService } from '@/services/usuario.service';
import { Usuario } from '@/services/auth.service';
import { FiEdit, FiTrash2, FiKey, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import { format } from 'date-fns';

export default function UsuariosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirección de seguridad: Exclusivo para administradores
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.tipo !== 'administrador') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    cedula: '',
    email: '',
    telefono: '',
    tipo: 'trabajador',
    area: 'ganaderia',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [crearError, setCrearError] = useState<string | null>(null);
  const [crearLoading, setCrearLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    area: '',
    tipo: '',
    activo: true,
  });
  const [newPassword, setNewPassword] = useState('');

  async function fetchUsuarios() {
    try {
      const response = await usuarioService.getAll();
      if (response.success) {
        setUsuarios(response.data);
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user && user.tipo === 'administrador') {
      fetchUsuarios();
    }
  }, [authLoading, user]);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrearError(null);

    if (nuevoUsuario.password !== nuevoUsuario.confirmPassword) {
      setCrearError('Las contraseñas no coinciden.');
      return;
    }
    if (nuevoUsuario.password.length < 6) {
      setCrearError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCrearLoading(true);
    try {
      await usuarioService.createOperador(nuevoUsuario);
      fetchUsuarios();
      setCrearModalOpen(false);
      setNuevoUsuario({
        nombre: '',
        cedula: '',
        email: '',
        telefono: '',
        tipo: 'trabajador',
        area: 'ganaderia',
        password: '',
        confirmPassword: '',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
      alert('Usuario creado y vinculado a la finca exitosamente');
    } catch (err: any) {
      setCrearError(err.response?.data?.message || err.message || 'Error al crear usuario');
    } finally {
      setCrearLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsuario) return;

    try {
      await usuarioService.update(editingUsuario.id, formData);
      fetchUsuarios();
      handleCloseModal();
    } catch (error) {
      console.error('Error updating usuario:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de desactivar este usuario?')) {
      try {
        await usuarioService.delete(id);
        fetchUsuarios();
      } catch (error) {
        console.error('Error deleting usuario:', error);
      }
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      area: usuario.area,
      tipo: usuario.tipo,
      activo: usuario.activo,
    });
    setModalOpen(true);
  };

  const handleChangePassword = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsuario) return;

    try {
      await usuarioService.changePassword(editingUsuario.id, newPassword);
      alert('Contraseña actualizada exitosamente');
      setPasswordModalOpen(false);
      setEditingUsuario(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUsuario(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      area: '',
      tipo: '',
      activo: true,
    });
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'cedula', label: 'Cédula' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    {
      key: 'area',
      label: 'Área',
      render: (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '-',
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'administrador'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Trabajador'}
        </span>
      ),
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'fechaRegistro',
      label: 'Registro',
      render: (value: string) => value ? format(new Date(value), 'dd/MM/yyyy') : 'N/A',
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Usuario) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <FiEdit />
          </button>
          <button
            onClick={() => handleChangePassword(row)}
            className="text-yellow-600 hover:text-yellow-800"
            title="Cambiar contraseña"
          >
            <FiKey />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
            title="Desactivar"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  // Pantalla de carga mientras valida permisos de administrador
  if (authLoading || (!user || user.tipo !== 'administrador')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <Card
          title="Gestión de Usuarios"
          subtitle="Administra los usuarios del sistema (Solo Administradores)"
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-green-50 border border-green-200 p-4 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Administración de Usuarios y Roles de la Finca
                  </p>
                  <p className="text-xs text-green-700">
                    Crea y gestiona los trabajadores y administradores de tu finca asignándoles su área productiva (Ganadería, Agricultura o Administración).
                  </p>
                </div>
                <Button variant="primary" onClick={() => setCrearModalOpen(true)}>
                  + Crear Nuevo Usuario
                </Button>
              </div>
              <Table columns={columns} data={usuarios} />
            </>
          )}
        </Card>

        {/* Modal de edición */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title="Editar Usuario"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre Completo"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />

              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                required
              />

              <Select
                label="Área"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                options={[
                  { value: 'cultivos', label: 'Cultivos' },
                  { value: 'ganaderia', label: 'Ganadería' },
                  { value: 'administracion', label: 'Administración' },
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

              <Select
                label="Estado"
                value={formData.activo ? 'true' : 'false'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    activo: e.target.value === 'true',
                  })
                }
                options={[
                  { value: 'true', label: 'Activo' },
                  { value: 'false', label: 'Inactivo' },
                ]}
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Actualizar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de cambio de contraseña */}
        <Modal
          isOpen={passwordModalOpen}
          onClose={() => {
            setPasswordModalOpen(false);
            setEditingUsuario(null);
            setNewPassword('');
          }}
          title={`Cambiar Contraseña - ${editingUsuario?.nombre}`}
          size="md"
        >
          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <Input
              label="Nueva Contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                La contraseña debe tener al menos 6 caracteres.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPasswordModalOpen(false);
                  setEditingUsuario(null);
                  setNewPassword('');
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Cambiar Contraseña
              </Button>
            </div>
          </form>
        </Modal>
        {/* Modal Crear Usuario */}
        <Modal
          isOpen={crearModalOpen}
          onClose={() => setCrearModalOpen(false)}
          title="Crear Nuevo Usuario de la Finca"
          size="lg"
        >
          {crearError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {crearError}
            </div>
          )}
          <form onSubmit={handleCrearUsuario} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre Completo"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                required
              />

              <Input
                label="Cédula"
                type="text"
                placeholder="10 dígitos numéricos"
                value={nuevoUsuario.cedula}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, cedula: e.target.value })}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                required
              />

              <Input
                label="Teléfono"
                type="tel"
                placeholder="0987654321"
                value={nuevoUsuario.telefono}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })}
                required
              />

              <Select
                label="Tipo de Usuario"
                value={nuevoUsuario.tipo}
                onChange={(e) => {
                  const nuevoTipo = e.target.value;
                  setNuevoUsuario((prev) => ({
                    ...prev,
                    tipo: nuevoTipo,
                    area: nuevoTipo === 'administrador' ? 'administracion' : prev.area === 'administracion' ? 'ganaderia' : prev.area,
                  }));
                }}
                options={[
                  { value: 'trabajador', label: 'Trabajador (Operador)' },
                  { value: 'administrador', label: 'Administrador' },
                ]}
                required
              />

              <Select
                label="Área en la que Trabaja"
                value={nuevoUsuario.area}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, area: e.target.value })}
                options={[
                  { value: 'ganaderia', label: 'Ganadería' },
                  { value: 'cultivos', label: 'Agricultura (Cultivos)' },
                  { value: 'administracion', label: 'Administración' },
                ]}
                required
              />

              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                }
              />

              <Input
                label="Confirmar Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                value={nuevoUsuario.confirmPassword}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, confirmPassword: e.target.value })}
                placeholder="Repite la contraseña"
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded"
                    title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="secondary" onClick={() => setCrearModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={crearLoading}>
                Crear Usuario
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}