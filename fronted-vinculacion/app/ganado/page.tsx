'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input, { Select, TextArea } from '@/components/ui/Input';
import { ganadoSchema, GanadoSchemaType } from '@/schemas/ganadoSchema';
import { ganadoService, Ganado } from '@/services/ganado.service';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';

export default function GanadoPage() {
  const [ganado, setGanado] = useState<Ganado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Ganado | null>(null);

  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

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
      estado: 'activo', // 
      pesoInicial: 0,
      pesoActual: 0,
      observaciones: '',
      activo: true,
      estado: 'activo',
    },
  });

  // 2. Modificado para enviar los filtros reactivos al backend
  const fetchGanado = async () => {
    try {
      const response = await ganadoService.getAll({
        search: search.trim(),
        estado: estadoFilter,
        tipo: tipoFilter,
      });
      if (response.success) {
        setGanado(response.data);
      }
    } catch (error) {
      console.error('Error fetching ganado:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. El useEffect se dispara automáticamente cada vez que cambia un filtro
  useEffect(() => {
    fetchGanado();
  }, [search, estadoFilter, tipoFilter]);

  // Lógica de filtrado en tiempo real
  const filteredGanado = ganado.filter((animal) => {
    const matchesSearch =
      animal.identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.raza.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'todos' || animal.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const onSubmit: SubmitHandler<GanadoSchemaType> = async (data) => {
    try {
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
      estado: animal.estado as any, 
      observaciones: animal.observaciones || '',
      activo: animal.activo,
      estado: animal.estado as any,
    });
    setModalOpen(true);
  };

  const handleOpenNewModal = () => {
    reset({
      identificacion: `GAN-${Math.floor(100000 + Math.random() * 900000)}`,
      tipo: 'bovino',
      raza: '',
      fechaNacimiento: '',
      sexo: 'macho',
      estadoSalud: 'bueno',
      estado: 'activo',
      pesoInicial: 0,
      pesoActual: 0,
      observaciones: '',
      activo: true,
      estado: 'activo',
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
      estado: 'activo',
      pesoInicial: 0,
      pesoActual: 0,
      observaciones: '',
      activo: true,
      estado: 'activo',
    });
  };

  // Mapeo de colores estéticos para las badges del nuevo estado de gestión
  const estadoColors: Record<string, string> = {
    activo: 'bg-green-100 text-green-800',
    inactivo: 'bg-gray-100 text-gray-800',
    vendido: 'bg-blue-100 text-blue-800',
    enfermo: 'bg-amber-100 text-amber-800',
    gestacion: 'bg-purple-100 text-purple-800',
    fallecido: 'bg-red-100 text-red-800',
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
      key: 'estado',
      label: 'Estado',
      render: (value: string) => {
        let badgeStyles = 'bg-gray-100 text-gray-800';
        if (value === 'activo') badgeStyles = 'bg-green-100 text-green-800';
        if (value === 'inactivo') badgeStyles = 'bg-orange-100 text-orange-800';
        if (value === 'en_cuarentena') badgeStyles = 'bg-purple-100 text-purple-800';

        const label = value === 'en_cuarentena' ? 'Cuarentena' : value.charAt(0).toUpperCase() + value.slice(1);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeStyles}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'estadoSalud',
      label: 'Salud',
      render: (value: string) => {
        let badgeStyles = 'bg-gray-100 text-gray-800';
        if (value === 'excelente') badgeStyles = 'bg-green-100 text-green-800';
        if (value === 'bueno') badgeStyles = 'bg-blue-100 text-blue-800';
        if (value === 'regular') badgeStyles = 'bg-yellow-100 text-yellow-800';
        if (value === 'enfermo') badgeStyles = 'bg-red-100 text-red-800';

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeStyles}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'estado', 
      label: 'Estado',
      render: (value: string) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            estadoColors[value] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Activo'}
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
          {/* Barra de búsqueda y filtrado */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Buscar por ID o Raza..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-gray-600 text-sm flex items-center gap-1 font-medium">
                <FiFilter /> Filtrar por:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg text-sm text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
              >
                <option value="todos" className="text-gray-900">Todos los Estados</option>
                <option value="activo" className="text-gray-900">Activos</option>
                <option value="inactivo" className="text-gray-900">Inactivos</option>
                <option value="en_cuarentena" className="text-gray-900">En Cuarentena</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <Table columns={columns} data={filteredGanado} />
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
                readOnly
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

              <Select
                label="Estado del Animal"
                error={errors.estado?.message}
                options={[
                  { value: 'activo', label: 'Activo' },
                  { value: 'inactivo', label: 'Inactivo (Vendido / De Baja)' },
                  { value: 'en_cuarentena', label: 'En Cuarentena' },
                ] as any}
                {...register('estado')}
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