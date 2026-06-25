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
  cultivoService,
  Cultivo,
  CultivoFormData,
} from '@/services/cultivo.service';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

export default function CultivosPage() {
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCultivo, setEditingCultivo] = useState<Cultivo | null>(null);
  const [formData, setFormData] = useState<CultivoFormData>({
    nombre: '',
    tipo: 'vegetal',
    area: 0,
    unidad: 'hectareas',
    ubicacion: '',
    fechaSiembra: '',
    estado: 'siembra',
  });

  useEffect(() => {
    fetchCultivos();
  }, []);

  const fetchCultivos = async () => {
    try {
      const response = await cultivoService.getAll();
      if (response.success) {
        setCultivos(response.data);
      }
    } catch (error) {
      console.error('Error fetching cultivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCultivo) {
        await cultivoService.update(editingCultivo.id, formData);
      } else {
        await cultivoService.create(formData);
      }
      fetchCultivos();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving cultivo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este cultivo?')) {
      try {
        await cultivoService.delete(id);
        fetchCultivos();
      } catch (error) {
        console.error('Error deleting cultivo:', error);
      }
    }
  };

  const handleEdit = (cultivo: Cultivo) => {
    setEditingCultivo(cultivo);
    setFormData({
      nombre: cultivo.nombre,
      tipo: cultivo.tipo,
      area: cultivo.area,
      unidad: cultivo.unidad,
      ubicacion: cultivo.ubicacion,
      fechaSiembra: cultivo.fechaSiembra,
      fechaCosechaEstimada: cultivo.fechaCosechaEstimada,
      estado: cultivo.estado,
      rendimiento: cultivo.rendimiento,
      observaciones: cultivo.observaciones,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCultivo(null);
    setFormData({
      nombre: '',
      tipo: 'vegetal',
      area: 0,
      unidad: 'hectareas',
      ubicacion: '',
      fechaSiembra: '',
      estado: 'siembra',
    });
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    {
      key: 'area',
      label: 'Área',
      render: (value: number, row: Cultivo) => `${value} ${row.unidad}`,
    },
    { key: 'ubicacion', label: 'Ubicación' },
    {
      key: 'estado',
      label: 'Estado',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'completado'
              ? 'bg-green-100 text-green-800'
              : value === 'cosecha'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'fechaSiembra',
      label: 'Fecha Siembra',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Cultivo) => (
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
          title="Gestión de Cultivos"
          subtitle="Administra todos los cultivos de la finca"
          headerAction={
            <Button onClick={() => setModalOpen(true)} icon={<FiPlus />}>
              Nuevo Cultivo
            </Button>
          }
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <Table columns={columns} data={cultivos} />
          )}
        </Card>

        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingCultivo ? 'Editar Cultivo' : 'Nuevo Cultivo'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del Cultivo"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
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
                  { value: 'vegetal', label: 'Vegetal' },
                  { value: 'frutal', label: 'Frutal' },
                  { value: 'cereal', label: 'Cereal' },
                  { value: 'hortaliza', label: 'Hortaliza' },
                  { value: 'leguminosa', label: 'Leguminosa' },
                  { value: 'otro', label: 'Otro' },
                ]}
                required
              />

              <Input
                label="Área"
                type="number"
                step="0.01"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: parseFloat(e.target.value) })
                }
                required
              />

              <Select
                label="Unidad"
                value={formData.unidad}
                onChange={(e) =>
                  setFormData({ ...formData, unidad: e.target.value as any })
                }
                options={[
                  { value: 'metros', label: 'Metros cuadrados' },
                  { value: 'hectareas', label: 'Hectáreas' },
                ]}
                required
              />

              <Input
                label="Ubicación"
                value={formData.ubicacion}
                onChange={(e) =>
                  setFormData({ ...formData, ubicacion: e.target.value })
                }
                required
              />

              <Select
                label="Estado"
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value as any })
                }
                options={[
                  { value: 'siembra', label: 'Siembra' },
                  { value: 'crecimiento', label: 'Crecimiento' },
                  { value: 'floracion', label: 'Floración' },
                  { value: 'cosecha', label: 'Cosecha' },
                  { value: 'completado', label: 'Completado' },
                ]}
                required
              />

              <Input
                label="Fecha de Siembra"
                type="date"
                value={formData.fechaSiembra}
                onChange={(e) =>
                  setFormData({ ...formData, fechaSiembra: e.target.value })
                }
                required
              />

              <Input
                label="Fecha de Cosecha Estimada"
                type="date"
                value={formData.fechaCosechaEstimada || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fechaCosechaEstimada: e.target.value,
                  })
                }
              />

              <Input
                label="Rendimiento"
                type="number"
                step="0.01"
                value={formData.rendimiento || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rendimiento: parseFloat(e.target.value),
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
                {editingCultivo ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
