'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import {
  registroService,
  Registro,
} from '@/services/registro.service';
import { cultivoService } from '@/services/cultivo.service';
import { ganadoService } from '@/services/ganado.service';
import { registroContableSchema, RegistroContableSchemaType } from '@/schemas/registroContableSchema';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';

export default function RegistrosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.tipo === 'administrador';
  const isCultivos = user?.area === 'cultivos';
  const isGanaderia = user?.area === 'ganaderia';

  // Segmentación por área para administrador
  const [areaFiltro, setAreaFiltro] = useState<'global' | 'cultivos' | 'ganaderia'>('global');

  const activeArea: 'global' | 'cultivos' | 'ganaderia' = useMemo(() => {
    if (isAdmin) return areaFiltro;
    if (isGanaderia) return 'ganaderia';
    return 'cultivos';
  }, [isAdmin, areaFiltro, isGanaderia]);

  // Redirección de seguridad
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (!isAdmin && !isCultivos && !isGanaderia) {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, isAdmin, isCultivos, isGanaderia, router]);

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

  const defaultTipo = isGanaderia ? 'ganado' : 'cultivo';

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
      tipo: defaultTipo as any,
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

  useEffect(() => {
    if (!editingRegistro) {
      setValue('categoria', '');
      setValue('cultivoId', 0);
      setValue('ganadoId', 0);
    }
  }, [watchTipo, setValue, editingRegistro]);

  const fetchData = async (targetArea: 'global' | 'cultivos' | 'ganaderia' = activeArea) => {
    try {
      setLoading(true);
      const areaParam = targetArea === 'global' ? undefined : targetArea;

      const [registrosRes, cultivosRes, ganadoRes, resumenRes] = await Promise.all([
        registroService.getAll(areaParam).catch((err) => {
          console.error('Error al cargar registros:', err);
          return { success: false, data: [] };
        }),
        isAdmin || isCultivos
          ? cultivoService.getAll().catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: true, data: [] }),
        isAdmin || isGanaderia
          ? ganadoService.getAll().catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: true, data: [] }),
        registroService.getResumenFinanciero(areaParam).catch(() => ({
          success: false,
          data: { ingresos: 0, costos: 0, balance: 0 },
        })),
      ]);

      if (registrosRes && registrosRes.success) {
        setRegistros(registrosRes.data || []);
      }
      if (resumenRes && resumenRes.success && resumenRes.data) {
        setTotales({
          ingresos: Number(resumenRes.data.ingresos || 0),
          costos: Number(resumenRes.data.costos || 0),
          balance: Number(resumenRes.data.balance || 0),
        });
      }
      if (cultivosRes && cultivosRes.success) setCultivos(cultivosRes.data || []);
      if (ganadoRes && ganadoRes.success) setGanado(ganadoRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin || isCultivos || isGanaderia) {
        fetchData(activeArea);
      }
    }
  }, [authLoading, user, activeArea]);

  const onSubmit = async (data: RegistroContableSchemaType) => {
    try {
      // Limpiar datos y autogenerar descripción con la categoría si viene vacía
      const cleanData: any = {
        tipo: data.tipo,
        categoria: data.categoria.trim(),
        descripcion: data.descripcion?.trim() || data.categoria.trim(),
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
      if ((data.tipo === 'ganado' || data.tipo === 'leche') && data.ganadoId) {
        cleanData.ganadoId = data.ganadoId;
      }

      if (editingRegistro) {
        await registroService.update(editingRegistro.id, cleanData);
      } else {
        await registroService.create(cleanData);
      }
      fetchData(activeArea);
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
        fetchData(activeArea);
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
      descripcion: registro.descripcion || '',
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
      tipo: defaultTipo as any,
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

  const filteredCultivos = cultivos;
  const filteredGanado = ganado;

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

  const tipoOptions = useMemo(() => {
    if (isCultivos) {
      return [
        { value: 'cultivo', label: 'Cultivo' },
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'produccion', label: 'Producción' },
        { value: 'venta', label: 'Venta' },
        { value: 'otro', label: 'Otro' },
      ];
    }
    if (isGanaderia) {
      return [
        { value: 'ganado', label: 'Ganado' },
        { value: 'leche', label: 'Producción de Leche (Ordeño)' },
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'produccion', label: 'Producción' },
        { value: 'venta', label: 'Venta' },
        { value: 'otro', label: 'Otro' },
      ];
    }
    return [
      { value: 'cultivo', label: 'Cultivo' },
      { value: 'ganado', label: 'Ganado' },
      { value: 'leche', label: 'Producción de Leche (Ordeño)' },
      { value: 'mantenimiento', label: 'Mantenimiento' },
      { value: 'produccion', label: 'Producción' },
      { value: 'venta', label: 'Venta' },
      { value: 'otro', label: 'Otro' },
    ];
  }, [isCultivos, isGanaderia]);

  const getAreaLabel = () => {
    if (activeArea === 'cultivos') return 'Cultivos';
    if (activeArea === 'ganaderia') return 'Ganadería';
    return 'Global (Todo el Sistema)';
  };

  if (
    authLoading ||
    !user ||
    (!isAdmin && !isCultivos && !isGanaderia)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Registros Contables</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Área activa: <span className="font-semibold text-gray-800">{getAreaLabel()}</span>
              </p>
            </div>

            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                <span className="text-xs font-semibold text-gray-500 px-2 flex items-center gap-1">
                  <FiFilter /> Segmentar:
                </span>
                <button
                  type="button"
                  onClick={() => setAreaFiltro('global')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    areaFiltro === 'global'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🌐 Global
                </button>
                <button
                  type="button"
                  onClick={() => setAreaFiltro('cultivos')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    areaFiltro === 'cultivos'
                      ? 'bg-white text-green-700 shadow-sm border border-green-200'
                      : 'text-gray-600 hover:text-green-700'
                  }`}
                >
                  🌱 Cultivos
                </button>
                <button
                  type="button"
                  onClick={() => setAreaFiltro('ganaderia')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    areaFiltro === 'ganaderia'
                      ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                      : 'text-gray-600 hover:text-blue-700'
                  }`}
                >
                  🐄 Ganadería
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Área exclusiva: {user.area ? user.area.toUpperCase() : 'ASIGNADA'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Total Ingresos ({getAreaLabel()})
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
                    Total Costos ({getAreaLabel()})
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
                    Balance ({getAreaLabel()})
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
            title="Listado de Registros"
            subtitle={`Visualizando ${registros.length} registros para ${getAreaLabel()}`}
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
            ) : registros.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No hay registros contables creados para {getAreaLabel()}.
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
                options={tipoOptions}
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

              {(watchTipo === 'ganado' || watchTipo === 'leche') && (
                <Select
                  label={watchTipo === 'leche' ? 'Vaca / Bovino Ordeñado' : 'Ganado Relacionado'}
                  error={errors.ganadoId?.message}
                  options={filteredGanado.map((g) => ({
                    value: g.id,
                    label: `${g.identificacion} (${g.raza || 'Sin raza'})`,
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
                  { value: '', label: 'Seleccionar unidad (opcional)' },
                  { value: 'kg', label: 'Kilogramos (kg)' },
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
                placeholder="0.00"
                {...register('costo', { valueAsNumber: true })}
              />

              <Input
                label="Ingresos ($)"
                type="number"
                step="0.01"
                error={errors.ingresos?.message}
                placeholder="0.00"
                {...register('ingresos', { valueAsNumber: true })}
              />
            </div>

            <Input
              label="Observaciones"
              error={errors.observaciones?.message}
              placeholder="Detalles adicionales opcionales..."
              {...register('observaciones')}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <Button type="submit">
                {editingRegistro ? 'Actualizar' : 'Crear Registro'}
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}