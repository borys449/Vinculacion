'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Select, TextArea } from '@/components/ui/Input';
import {
  ganadoService,
  Ganado,
  GanadoFormData,
} from '@/services/ganado.service';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

export default function GanadoPage() {
  const [ganado, setGanado] = useState<Ganado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Ganado | null>(null);
  const [formData, setFormData] = useState<GanadoFormData>({
    identificacion: '',
    tipo: 'bovino',
    raza: '',
    fechaNacimiento: '',
    sexo: 'macho',
    estadoSalud: 'bueno',
    activo: true,
  });

  useEffect(() => {
    fetchGanado();
  }, []);

  const fetchGanado = async () => {
    try {
      const response = await ganadoService.getAll();
      if (response.success) {
        setGanado(response.data);
      }
    } catch (error) {
      console.error('Error fetching ganado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnimal) {
        await ganadoService.update(editingAnimal.id, formData);
      } else {
        await ganadoService.create(formData);
      }
      fetchGanado();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving ganado:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este animal?')) {
      try {
        await ganadoService.delete(id);
        fetchGanado();
      } catch (error) {
        console.error('Error deleting ganado:', error);
      }
    }
  };

  const handleEdit = (animal: Ganado) => {
    setEditingAnimal(animal);
    setFormData({
      identificacion: animal.identificacion,
      tipo: animal.tipo,
      raza: animal.raza,
      fechaNacimiento: animal.fechaNacimiento,
      sexo: animal.sexo,
      pesoInicial: animal.pesoInicial,
      pesoActual: animal.pesoActual,
      estadoSalud: animal.estadoSalud,
      observaciones: animal.observaciones,
      activo: animal.activo,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAnimal(null);
    setFormData({
      identificacion: '',
      tipo: 'bovino',
      raza: '',
      fechaNacimiento: '',
      sexo: 'macho',
      estadoSalud: 'bueno',
      activo: true,
    });
  };

  const columns = [
    { key: 'identificacion', label: 'ID' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    { key: 'raza', label: 'Raza' },
    {
      key: 'sexo',
      label: 'Sexo',
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    {
      key: 'pesoActual',
      label: 'Peso (kg)',
      render: (value?: number) => (value ? `${value} kg` : 'N/A'),
    },
    {
      key: 'estadoSalud',
      label: 'Estado',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'excelente'
              ? 'bg-green-100 text-green-800'
              : value === 'bueno'
              ? 'bg-blue-100 text-blue-800'
              : value === 'regular'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'fechaNacimiento',
      label: 'Nacimiento',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Ganado) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <FiEdit />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Card
          title="Gestión de Ganado"
          subtitle="Administra todo el ganado de la finca"
          headerAction={
            <Button onClick={() => setModalOpen(true)} icon={<FiPlus />}>
              Nuevo Animal
            </Button>
          }
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <Table columns={columns} data={ganado} />
          )}
        </Card>

        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingAnimal ? 'Editar Animal' : 'Nuevo Animal'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Identificación"
                value={formData.identificacion}
                onChange={(e) =>
                  setFormData({ ...formData, identificacion: e.target.value })
                }
                required
              />

              <Select
                label="Tipo"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value as any })
                }
                options={[
                  { value: 'bovino', label: 'Bovino' },
                  { value: 'porcino', label: 'Porcino' },
                  { value: 'ovino', label: 'Ovino' },
                  { value: 'caprino', label: 'Caprino' },
                  { value: 'avicola', label: 'Avícola' },
                  { value: 'otro', label: 'Otro' },
                ]}
                required
              />

              <Input
                label="Raza"
                value={formData.raza}
                onChange={(e) =>
                  setFormData({ ...formData, raza: e.target.value })
                }
                required
              />

              <Input
                label="Fecha de Nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) =>
                  setFormData({ ...formData, fechaNacimiento: e.target.value })
                }
                required
              />

              <Select
                label="Sexo"
                value={formData.sexo}
                onChange={(e) =>
                  setFormData({ ...formData, sexo: e.target.value as any })
                }
                options={[
                  { value: 'macho', label: 'Macho' },
                  { value: 'hembra', label: 'Hembra' },
                ]}
                required
              />

              <Select
                label="Estado de Salud"
                value={formData.estadoSalud}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estadoSalud: e.target.value as any,
                  })
                }
                options={[
                  { value: 'excelente', label: 'Excelente' },
                  { value: 'bueno', label: 'Bueno' },
                  { value: 'regular', label: 'Regular' },
                  { value: 'enfermo', label: 'Enfermo' },
                ]}
                required
              />

              <Input
                label="Peso Inicial (kg)"
                type="number"
                step="0.01"
                value={formData.pesoInicial || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pesoInicial: parseFloat(e.target.value),
                  })
                }
              />

              <Input
                label="Peso Actual (kg)"
                type="number"
                step="0.01"
                value={formData.pesoActual || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pesoActual: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <TextArea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              rows={3}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingAnimal ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
