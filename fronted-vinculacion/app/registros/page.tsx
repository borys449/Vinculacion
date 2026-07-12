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
import {
  registroService,
  Registro,
} from '@/services/registro.service';
import { cultivoService } from '@/services/cultivo.service';
import { ganadoService } from '@/services/ganado.service';
import { registroContableSchema, RegistroContableSchemaType } from '@/schemas/registroContableSchema';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { format } from 'date-fns';

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cultivos, setCultivos] = useState<any[]>([]);
  const [ganado, setGanado] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);

  const [totales, setTotales] = useState({
    ingresos: 0,
    costos: 0,
    balance: 0,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegistroContableSchemaType>({
    resolver: zodResolver(registroContableSchema),
    defaultValues: {
      tipo: 'cultivo',
      categoria: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidad: 0,
      unidad: '',
      costo: 0,
      ingresos: 0,
      observaciones: '',
      cultivoId: 0,
      ganadoId: 0,
    },
  });

  const watchTipo = watch('tipo');
  const watchCategoria = watch('categoria');

  // Limpiar/actualizar campos relacionados si cambia el tipo
  useEffect(() => {
    if (!editingRegistro) {
      setValue('categoria', '');
      setValue('cultivoId', 0);
      setValue('ganadoId', 0);
    }
  }, [watchTipo, setValue, editingRegistro]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [registrosRes, cultivosRes, ganadoRes, resumenRes] = await Promise.all([
        registroService.getAll(),
        cultivoService.getAll(),
        ganadoService.getAll(),
        registroService.getResumenFinanciero(),
      ]);

      if (registrosRes.success) {
        setRegistros(registrosRes.data);
      }
      if (resumenRes.success) {
        setTotales(resumenRes.data);
      }
      if (cultivosRes.success) setCultivos(cultivosRes.data);
      if (ganadoRes.success) setGanado(ganadoRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegistroContableSchemaType) => {
    try {
      // Limpiar datos antes de enviar
      const cleanData: any = {
        tipo: data.tipo,
        categoria: data.categoria.trim(),
        descripcion: data.descripcion.trim(),
        fecha: data.fecha,
        observaciones: data.observaciones?.trim() || '',
      };

      if (data.cantidad && !isNaN(data.cantidad)) {
        cleanData.cantidad = data.cantidad;
      }
      if (data.costo && !isNaN(data.costo)) {
        cleanData.costo = data.costo;
      }
      if (data.ingresos && !isNaN(data.ingresos)) {
        cleanData.ingresos = data.ingresos;
      }
      if (data.unidad) cleanData.unidad = data.unidad;

      if (data.tipo === 'cultivo' && data.cultivoId) {
        cleanData.cultivoId = data.cultivoId;
      }
      if (data.tipo === 'ganado' && data.ganadoId) {
        cleanData.ganadoId = data.ganadoId;
      }

      if (editingRegistro) {
        await registroService.update(editingRegistro.id, cleanData);
      } else {
        await registroService.create(cleanData);
      }
      fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving registro:', error);
      alert(`Error al guardar: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      try {
        await registroService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting registro:', error);
      }
    }
  };

  const handleEdit = (registro: Registro) => {
    setEditingRegistro(registro);
    reset({
      tipo: registro.tipo,
      categoria: registro.categoria,
      descripcion: registro.descripcion,
      fecha: registro.fecha.split('T')[0],
      cantidad: registro.cantidad || 0,
      unidad: registro.unidad || '',
      costo: registro.costo || 0,
      ingresos: registro.ingresos || 0,
      observaciones: registro.observaciones || '',
      cultivoId: registro.cultivoId || 0,
      ganadoId: registro.ganadoId || 0,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRegistro(null);
    reset({
      tipo: 'cultivo',
      categoria: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidad: 0,
      unidad: '',
      costo: 0,
      ingresos: 0,
      observaciones: '',
      cultivoId: 0,
      ganadoId: 0,
    });
  };

  // Filtrado de cultivos según la categoría
  const filteredCultivos = cultivos.filter(
    (c) => !watchCategoria || c.tipo.toLowerCase() === watchCategoria.toLowerCase()
  );

  // Filtrado de ganado según la categoría
  const filteredGanado = ganado.filter(
    (g) => !watchCategoria || g.tipo.toLowerCase() === watchCategoria.toLowerCase()
  );

  const columns = [
    {
      key: 'fecha',
      label: 'Fecha',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    { key: 'categoria', label: 'Categoría' },
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'costo',
      label: 'Costo',
      render: (value?: number) =>
        value !== undefined && value !== null
          ? `$${Number(value).toFixed(2)}`
          : '-',
    },
    {
      key: 'ingresos',
      label: 'Ingresos',
      render: (value?: number) =>
        value !== undefined && value !== null
          ? `$${Number(value).toFixed(2)}`
          : '-',
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Registro) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <FiEdit />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
            title="Eliminar"
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
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Total Ingresos
                  </p>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    ${totales.ingresos.toFixed(2)}
                  </p>
                </div>
                <FiDollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Total Costos
                  </p>
                  <p className="text-2xl font-bold text-red-700 mt-2">
                    ${totales.costos.toFixed(2)}
                  </p>
                </div>
                <FiDollarSign className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div
              className={`${
                totales.balance >= 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              } rounded-lg shadow-sm border p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-medium ${
                      totales.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}
                  >
                    Balance
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      totales.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                    } mt-2`}
                  >
                    ${totales.balance.toFixed(2)}
                  </p>
                </div>
                <FiDollarSign
                  className={`h-8 w-8 ${
                    totales.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}
                />
              </div>
            </div>
          </div>

          <Card
            title="Registros Contables"
            subtitle="Administra todos los registros de ingresos y gastos"
            headerAction={
              <Button onClick={() => setModalOpen(true)} icon={<FiPlus />}>
                Nuevo Registro
              </Button>
            }
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <Table columns={columns} data={registros} />
            )}
          </Card>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingRegistro ? 'Editar Registro' : 'Nuevo Registro'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Registro"
                error={errors.tipo?.message}
                options={[
                  { value: 'cultivo', label: 'Cultivo' },
                  { value: 'ganado', label: 'Ganado' },
                  { value: 'mantenimiento', label: 'Mantenimiento' },
                  { value: 'produccion', label: 'Producción' },
                  { value: 'venta', label: 'Venta' },
                  { value: 'otro', label: 'Otro' },
                ]}
                {...register('tipo')}
                required
              />

              <Input
                label="Categoría"
                error={errors.categoria?.message}
                placeholder="Ej: Fertilizante, Alimento, Vacunas, etc."
                {...register('categoria')}
                suggestions={Array.from(new Set(registros.map((r) => r.categoria).filter(Boolean)))}
                required
              />

              <Input
                label="Fecha"
                type="date"
                error={errors.fecha?.message}
                {...register('fecha')}
                required
              />

              {watchTipo === 'cultivo' && (
                <Select
                  label="Cultivo Relacionado"
                  error={errors.cultivoId?.message}
                  options={filteredCultivos.map((c) => ({
                    value: c.id,
                    label: `${c.nombre} (${c.tipo})`,
                  }))}
                  {...register('cultivoId', { valueAsNumber: true })}
                />
              )}

              {watchTipo === 'ganado' && (
                <Select
                  label="Ganado Relacionado"
                  error={errors.ganadoId?.message}
                  options={filteredGanado.map((g) => ({
                    value: g.id,
                    label: `${g.identificacion} (${g.raza})`,
                  }))}
                  {...register('ganadoId', { valueAsNumber: true })}
                />
              )}

              <Input
                label="Cantidad"
                type="number"
                step="0.01"
                error={errors.cantidad?.message}
                {...register('cantidad', { valueAsNumber: true })}
              />

              <Select
                label="Unidad"
                error={errors.unidad?.message}
                options={[
                  { value: 'kg', label: 'Kilogramos' },
                  { value: 'toneladas', label: 'Toneladas' },
                  { value: 'litros', label: 'Litros' },
                  { value: 'unidades', label: 'Unidades' },
                  { value: 'metros', label: 'Metros' },
                  { value: 'hectareas', label: 'Hectáreas' },
                  { value: 'otro', label: 'Otro' },
                ]}
                {...register('unidad')}
              />

              <Input
                label="Costo ($)"
                type="number"
                step="0.01"
                error={errors.costo?.message}
                {...register('costo', { valueAsNumber: true })}
              />

              <Input
                label="Ingresos ($)"
                type="number"
                step="0.01"
                error={errors.ingresos?.message}
                {...register('ingresos', { valueAsNumber: true })}
              />
            </div>

            <TextArea
              label="Descripción"
              error={errors.descripcion?.message}
              placeholder="Mínimo 5 caracteres"
              {...register('descripcion')}
              rows={3}
              required
            />

            <TextArea
              label="Observaciones"
              error={errors.observaciones?.message}
              {...register('observaciones')}
              rows={2}
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
                {editingRegistro ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
