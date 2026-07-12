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
import { ganadoSchema, GanadoSchemaType } from '@/schemas/ganadoSchema';
import {
  ganadoService,
  Ganado,
} from '@/services/ganado.service';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

export default function GanadoPage() {
  const [ganado, setGanado] = useState<Ganado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Ganado | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GanadoSchemaType>({
    resolver: zodResolver(ganadoSchema),
    defaultValues: {
      identificacion: '',
      tipo: 'bovino',
      raza: '',
      fechaNacimiento: '',
      sexo: 'macho',
      estadoSalud: 'bueno',
      pesoInicial: 0,
      pesoActual: 0,
      observaciones: '',
      activo: true,
    },
  });

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

  useEffect(() => {
    fetchGanado();
  }, []);

  const onSubmit = async (data: GanadoSchemaType) => {
    try {
      // Saneamiento de datos antes de enviar
      const payload = {
        ...data,
        identificacion: data.identificacion.trim(),
        raza: data.raza.trim(),
        observaciones: data.observaciones?.trim() || '',
        pesoInicial: data.pesoInicial || null,
        pesoActual: data.pesoActual || null,
      };

      if (editingAnimal) {
        await ganadoService.update(editingAnimal.id, payload);
      } else {
        await ganadoService.create(payload);
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
    reset({
      identificacion: animal.identificacion,
      tipo: animal.tipo as any,
      raza: animal.raza,
      fechaNacimiento: animal.fechaNacimiento ? animal.fechaNacimiento.split('T')[0] : '',
      sexo: animal.sexo as any,
      pesoInicial: animal.pesoInicial || 0,
      pesoActual: animal.pesoActual || 0,
      estadoSalud: animal.estadoSalud as any,
      observaciones: animal.observaciones || '',
      activo: animal.activo,
    });
    setModalOpen(true);
  };

  const handleOpenNewModal = () => {
    reset({
      identificacion: `GAN-${Math.floor(100000 + Math.random() * 900000)}`, // ID Auto-generado
      tipo: 'bovino',
      raza: '',
      fechaNacimiento: '',
      sexo: 'macho',
      estadoSalud: 'bueno',
      pesoInicial: 0,
      pesoActual: 0,
      observaciones: '',
      activo: true,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAnimal(null);
    reset({
      identificacion: '',
      tipo: 'bovino',
      raza: '',
      fechaNacimiento: '',
      sexo: 'macho',
      estadoSalud: 'bueno',
      pesoInicial: 0,
      pesoActual: 0,
      observaciones: '',
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
            <Button onClick={handleOpenNewModal} icon={<FiPlus />}>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Identificación"
                error={errors.identificacion?.message}
                {...register('identificacion')}
                readOnly // El ID es auto-generado
                className="bg-gray-50 cursor-not-allowed font-semibold text-gray-600"
                required
              />

              <Select
                label="Tipo"
                error={errors.tipo?.message}
                options={[
                  { value: 'bovino', label: 'Bovino' },
                  { value: 'porcino', label: 'Porcino' },
                  { value: 'ovino', label: 'Ovino' },
                  { value: 'caprino', label: 'Caprino' },
                  { value: 'avicola', label: 'Avícola' },
                  { value: 'otro', label: 'Otro' },
                ]}
                {...register('tipo')}
                required
              />

              <Input
                label="Raza"
                error={errors.raza?.message}
                {...register('raza')}
                suggestions={Array.from(new Set(ganado.map((g) => g.raza).filter(Boolean)))}
                required
              />

              <Input
                label="Fecha de Nacimiento"
                type="date"
                error={errors.fechaNacimiento?.message}
                {...register('fechaNacimiento')}
                required
              />

              <Select
                label="Sexo"
                error={errors.sexo?.message}
                options={[
                  { value: 'macho', label: 'Macho' },
                  { value: 'hembra', label: 'Hembra' },
                ]}
                {...register('sexo')}
                required
              />

              <Select
                label="Estado de Salud"
                error={errors.estadoSalud?.message}
                options={[
                  { value: 'excelente', label: 'Excelente' },
                  { value: 'bueno', label: 'Bueno' },
                  { value: 'regular', label: 'Regular' },
                  { value: 'enfermo', label: 'Enfermo' },
                ]}
                {...register('estadoSalud')}
                required
              />

              <Input
                label="Peso Inicial (kg)"
                type="number"
                step="0.01"
                error={errors.pesoInicial?.message}
                {...register('pesoInicial', { valueAsNumber: true })}
              />

              <Input
                label="Peso Actual (kg)"
                type="number"
                step="0.01"
                error={errors.pesoActual?.message}
                {...register('pesoActual', { valueAsNumber: true })}
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
                {editingAnimal ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
