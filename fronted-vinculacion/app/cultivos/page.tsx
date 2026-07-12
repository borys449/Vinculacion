'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Select, TextArea } from '@/components/ui/Input';
import { cultivoSchema, CultivoSchemaType } from '@/schemas/cultivoSchema';
import {
  cultivoService,
  Cultivo,
} from '@/services/cultivo.service';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

export default function CultivosPage() {
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCultivo, setEditingCultivo] = useState<Cultivo | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CultivoSchemaType>({
    resolver: zodResolver(cultivoSchema),
    defaultValues: {
      nombre: '',
      tipo: 'vegetal',
      area: 0,
      unidad: 'hectareas',
      ubicacion: '',
      fechaSiembra: '',
      estado: 'siembra',
      fechaCosechaEstimada: '',
      rendimiento: 0,
      observaciones: '',
    },
  });

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

  useEffect(() => {
    fetchCultivos();
  }, []);

  const onSubmit = async (data: CultivoSchemaType) => {
    try {
      // Saneamiento de datos antes de enviar
      const payload = {
        ...data,
        nombre: data.nombre.trim(),
        ubicacion: data.ubicacion.trim(),
        observaciones: data.observaciones?.trim() || '',
        fechaCosechaEstimada: data.fechaCosechaEstimada || null,
        rendimiento: data.rendimiento || null,
      };

      if (editingCultivo) {
        await cultivoService.update(editingCultivo.id, payload);
      } else {
        await cultivoService.create(payload);
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
    reset({
      nombre: cultivo.nombre,
      tipo: cultivo.tipo as any,
      area: cultivo.area,
      unidad: cultivo.unidad as any,
      ubicacion: cultivo.ubicacion,
      fechaSiembra: cultivo.fechaSiembra ? cultivo.fechaSiembra.split('T')[0] : '',
      fechaCosechaEstimada: cultivo.fechaCosechaEstimada ? cultivo.fechaCosechaEstimada.split('T')[0] : '',
      estado: cultivo.estado as any,
      rendimiento: cultivo.rendimiento || 0,
      observaciones: cultivo.observaciones || '',
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCultivo(null);
    reset({
      nombre: '',
      tipo: 'vegetal',
      area: 0,
      unidad: 'hectareas',
      ubicacion: '',
      fechaSiembra: '',
      estado: 'siembra',
      fechaCosechaEstimada: '',
      rendimiento: 0,
      observaciones: '',
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del Cultivo"
                error={errors.nombre?.message}
                {...register('nombre')}
                suggestions={Array.from(new Set(cultivos.map((c) => c.nombre).filter(Boolean)))}
                required
              />

              <Select
                label="Tipo"
                error={errors.tipo?.message}
                options={[
                  { value: 'vegetal', label: 'Vegetal' },
                  { value: 'frutal', label: 'Frutal' },
                  { value: 'cereal', label: 'Cereal' },
                  { value: 'hortaliza', label: 'Hortaliza' },
                  { value: 'leguminosa', label: 'Leguminosa' },
                  { value: 'otro', label: 'Otro' },
                ]}
                {...register('tipo')}
                required
              />

              <Input
                label="Área"
                type="number"
                step="0.01"
                error={errors.area?.message}
                {...register('area', { valueAsNumber: true })}
                required
              />

              <Select
                label="Unidad"
                error={errors.unidad?.message}
                options={[
                  { value: 'metros', label: 'Metros cuadrados' },
                  { value: 'hectareas', label: 'Hectáreas' },
                ]}
                {...register('unidad')}
                required
              />

              <Input
                label="Ubicación"
                error={errors.ubicacion?.message}
                {...register('ubicacion')}
                required
              />

              <Select
                label="Estado"
                error={errors.estado?.message}
                options={[
                  { value: 'siembra', label: 'Siembra' },
                  { value: 'crecimiento', label: 'Crecimiento' },
                  { value: 'floracion', label: 'Floración' },
                  { value: 'cosecha', label: 'Cosecha' },
                  { value: 'completado', label: 'Completado' },
                ]}
                {...register('estado')}
                required
              />

              <Input
                label="Fecha de Siembra"
                type="date"
                error={errors.fechaSiembra?.message}
                {...register('fechaSiembra')}
                required
              />

              <Input
                label="Fecha de Cosecha Estimada"
                type="date"
                error={errors.fechaCosechaEstimada?.message}
                {...register('fechaCosechaEstimada')}
              />

              <Input
                label="Rendimiento"
                type="number"
                step="0.01"
                error={errors.rendimiento?.message}
                {...register('rendimiento', { valueAsNumber: true })}
              />
            </div>

            <TextArea
              label="Observaciones"
              error={errors.observaciones?.message}
              {...register('observaciones')}
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
