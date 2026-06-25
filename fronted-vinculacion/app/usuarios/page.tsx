'use client';

import { useEffect, useState } from 'react';
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
import { FiEdit, FiTrash2, FiKey } from 'react-icons/fi';
import { format } from 'date-fns';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    area: '',
    tipo: '',
    activo: true,
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
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
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
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
          {value.charAt(0).toUpperCase() + value.slice(1)}
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
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
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
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Los nuevos usuarios deben registrarse
                  desde la página de registro. Aquí solo puedes editar usuarios
                  existentes, cambiar contraseñas o desactivarlos.
                </p>
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
