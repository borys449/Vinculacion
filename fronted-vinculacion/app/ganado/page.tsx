'use client';

import { useEffect, useState, useMemo } from 'react';
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
import {
  ganadoService,
  Ganado,
  ProduccionLecheraStats,
  ResumenControlLechero,
} from '@/services/ganado.service';
import {
  PROPOSITOS_BOVINO,
  RAZAS_POR_PROPOSITO,
  TODAS_LAS_RAZAS_BOVINAS,
  validarPesoEdadBovino,
  calcularEdadMeses,
  PropositoBovino,
} from '@/constants/bovinos';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiAlertTriangle,
  FiDroplet,
  FiCalendar,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';
import { GiCow, GiMilkCarton } from 'react-icons/gi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function GanadoPage() {
  // Pestañas principales
  const [activeTab, setActiveTab] = useState<'inventario' | 'leche'>('inventario');

  // Estados de datos
  const [ganado, setGanado] = useState<Ganado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Ganado | null>(null);

  // Estados para búsqueda y filtrado de inventario
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [propositoFilter, setPropositoFilter] = useState('todos');

  // Estados para Control Lechero
  const [resumenLechero, setResumenLechero] = useState<ResumenControlLechero | null>(null);
  const [loadingLechero, setLoadingLechero] = useState(false);
  const [selectedBovinoId, setSelectedBovinoId] = useState<number | null>(null);
  const [perfilLecheroVaca, setPerfilLecheroVaca] = useState<ProduccionLecheraStats | null>(null);
  const [ordenioModalOpen, setOrdenioModalOpen] = useState(false);
  const [ordenioBovinoId, setOrdenioBovinoId] = useState<number | ''>('');
  const [ordenioCantidad, setOrdenioCantidad] = useState<string>('');
  const [ordenioFecha, setOrdenioFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ordenioSesion, setOrdenioSesion] = useState<'mañana' | 'tarde' | 'completa'>('completa');
  const [ordenioObservaciones, setOrdenioObservaciones] = useState<string>('');
  const [guardandoOrdenio, setGuardandoOrdenio] = useState(false);

  // Formulario de Ganado
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GanadoSchemaType>({
    resolver: zodResolver(ganadoSchema),
    defaultValues: {
      identificacion: '',
      tipo: 'bovino',
      raza: '',
      proposito: 'leche',
      produccionEstimadaDiaria: 0,
      fechaNacimiento: '',
      sexo: 'hembra',
      estadoSalud: 'bueno',
      estado: 'activo',
      pesoInicial: 0,
      pesoActual: 0,
      observaciones: '',
      activo: true,
    },
  });

  // Watchers para lógica reactiva del formulario
  const watchTipo = watch('tipo');
  const watchProposito = watch('proposito') as PropositoBovino | undefined;
  const watchFechaNacimiento = watch('fechaNacimiento');
  const watchPesoActual = watch('pesoActual');
  const watchPesoInicial = watch('pesoInicial');

  // Opciones de raza dinámicas filtradas por propósito
  const opcionesRaza = useMemo(() => {
    if (watchTipo === 'bovino' && watchProposito && RAZAS_POR_PROPOSITO[watchProposito]) {
      return RAZAS_POR_PROPOSITO[watchProposito];
    }
    if (watchTipo === 'bovino') {
      return TODAS_LAS_RAZAS_BOVINAS;
    }
    return [];
  }, [watchTipo, watchProposito]);

  // Validación biológica en tiempo real (Edad vs. Peso)
  const evaluacionBiologicaForm = useMemo(() => {
    if (watchTipo !== 'bovino' || !watchFechaNacimiento) {
      return { edadMeses: null, alertas: [] };
    }
    const pesoAValidar =
      watchPesoActual && watchPesoActual > 0
        ? watchPesoActual
        : watchPesoInicial && watchPesoInicial > 0
        ? watchPesoInicial
        : null;

    return validarPesoEdadBovino(watchFechaNacimiento, pesoAValidar);
  }, [watchTipo, watchFechaNacimiento, watchPesoActual, watchPesoInicial]);

  // Cargar inventario de ganado
  const fetchGanado = async () => {
    try {
      const response = await ganadoService.getAll();
      if (response.success) {
        setGanado(response.data);
      }
    } catch (error) {
      console.error('Error fetching ganado:', error);
      toast.error('Error al cargar inventario de ganado');
    } finally {
      setLoading(false);
    }
  };

  // Cargar resumen de control lechero
  const fetchControlLechero = async () => {
    setLoadingLechero(true);
    try {
      const response = await ganadoService.getResumenControlLechero();
      if (response.success) {
        setResumenLechero(response.data);
      }
    } catch (error) {
      console.error('Error fetching resumen lechero:', error);
    } finally {
      setLoadingLechero(false);
    }
  };

  // Cargar perfil lechero de la vaca seleccionada
  const fetchPerfilVaca = async (id: number) => {
    try {
      const response = await ganadoService.getControlLechero(id);
      if (response.success) {
        setPerfilLecheroVaca(response.data);
      }
    } catch (error) {
      console.error('Error fetching perfil vaca:', error);
    }
  };

  useEffect(() => {
    fetchGanado();
    fetchControlLechero();
  }, []);

  useEffect(() => {
    if (selectedBovinoId) {
      fetchPerfilVaca(selectedBovinoId);
    } else {
      setPerfilLecheroVaca(null);
    }
  }, [selectedBovinoId]);

  // Lista de solo bovinos para el control lechero
  const bovinosList = useMemo(() => {
    return ganado.filter((g) => g.tipo === 'bovino');
  }, [ganado]);

  // Si cambia a la pestaña de leche y no hay vaca seleccionada, seleccionar la primera por defecto
  useEffect(() => {
    if (activeTab === 'leche' && !selectedBovinoId && bovinosList.length > 0) {
      setSelectedBovinoId(bovinosList[0].id);
    }
  }, [activeTab, selectedBovinoId, bovinosList]);

  // Filtrado de inventario
  const filteredGanado = ganado.filter((animal) => {
    const matchesSearch =
      (animal.identificacion?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (animal.raza?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || animal.estado === statusFilter;
    const matchesProposito =
      propositoFilter === 'todos' || animal.proposito === propositoFilter;

    return matchesSearch && matchesStatus && matchesProposito;
  });

  const onSubmit: SubmitHandler<GanadoSchemaType> = async (data) => {
    try {
      const payload: any = {
        ...data,
        identificacion: data.identificacion.trim(),
        raza: data.raza?.trim() || '',
        observaciones: data.observaciones?.trim() || '',
        pesoInicial: data.pesoInicial || null,
        pesoActual: data.pesoActual || null,
        proposito: data.tipo === 'bovino' ? data.proposito || null : null,
        produccionEstimadaDiaria:
          data.tipo === 'bovino' ? Number(data.produccionEstimadaDiaria || 0) : 0,
      };

      if (editingAnimal) {
        const res = await ganadoService.update(editingAnimal.id, payload);
        toast.success('Animal actualizado exitosamente');
        if (res.advertenciasBiologicas?.length) {
          toast(res.advertenciasBiologicas[0], { icon: '⚠️', duration: 5000 });
        }
      } else {
        const res = await ganadoService.create(payload);
        toast.success('Animal registrado exitosamente');
        if (res.advertenciasBiologicas?.length) {
          toast(res.advertenciasBiologicas[0], { icon: '⚠️', duration: 5000 });
        }
      }
      await fetchGanado();
      await fetchControlLechero();
      if (selectedBovinoId) {
        await fetchPerfilVaca(selectedBovinoId);
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving ganado:', error);
      toast.error(`Error al guardar: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este animal?')) {
      try {
        await ganadoService.delete(id);
        toast.success('Animal eliminado');
        fetchGanado();
        fetchControlLechero();
      } catch (error: any) {
        console.error('Error deleting ganado:', error);
        toast.error(`Error al eliminar: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleEdit = (animal: Ganado) => {
    setEditingAnimal(animal);
    reset({
      identificacion: animal.identificacion,
      tipo: animal.tipo as any,
      raza: animal.raza || '',
      proposito: (animal.proposito as any) || (animal.tipo === 'bovino' ? 'leche' : ''),
      produccionEstimadaDiaria: animal.produccionEstimadaDiaria || 0,
      fechaNacimiento: animal.fechaNacimiento ? animal.fechaNacimiento.split('T')[0] : '',
      sexo: animal.sexo as any,
      pesoInicial: animal.pesoInicial || 0,
      pesoActual: animal.pesoActual || 0,
      estadoSalud: animal.estadoSalud as any,
      estado: animal.estado as any,
      observaciones: animal.observaciones || '',
      activo: animal.activo,
    });
    setModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingAnimal(null);
    reset({
      identificacion: `GAN-${Math.floor(100000 + Math.random() * 900000)}`,
      tipo: 'bovino',
      raza: 'Holstein Friesian',
      proposito: 'leche',
      produccionEstimadaDiaria: 0,
      fechaNacimiento: '',
      sexo: 'hembra',
      estadoSalud: 'bueno',
      estado: 'activo',
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
  };

  // Guardar Ordeño Diario
  const handleGuardarOrdenio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenioBovinoId) {
      toast.error('Seleccione un bovino para registrar el ordeño');
      return;
    }
    const litrosNum = parseFloat(ordenioCantidad);
    if (isNaN(litrosNum) || litrosNum <= 0) {
      toast.error('Ingrese una cantidad válida de litros mayor a cero');
      return;
    }

    setGuardandoOrdenio(true);
    try {
      await ganadoService.registrarOrdenio(Number(ordenioBovinoId), {
        cantidad: litrosNum,
        fecha: ordenioFecha,
        sesion: ordenioSesion,
        observaciones: ordenioObservaciones,
      });

      toast.success(`Ordeño de ${litrosNum} L registrado con éxito`);
      setOrdenioModalOpen(false);
      setOrdenioCantidad('');
      setOrdenioObservaciones('');

      // Refrescar datos
      await fetchControlLechero();
      if (selectedBovinoId) {
        await fetchPerfilVaca(selectedBovinoId);
      }
    } catch (error: any) {
      console.error('Error registrando ordeño:', error);
      toast.error(`Error al registrar ordeño: ${error.response?.data?.message || error.message}`);
    } finally {
      setGuardandoOrdenio(false);
    }
  };

  const abrirModalOrdenio = (bovinoId?: number) => {
    if (bovinoId) {
      setOrdenioBovinoId(bovinoId);
    } else if (selectedBovinoId) {
      setOrdenioBovinoId(selectedBovinoId);
    } else if (bovinosList.length > 0) {
      setOrdenioBovinoId(bovinosList[0].id);
    }
    setOrdenioFecha(new Date().toISOString().split('T')[0]);
    setOrdenioCantidad('');
    setOrdenioObservaciones('');
    setOrdenioModalOpen(true);
  };

  const irAControlLecheroVaca = (bovinoId: number) => {
    setSelectedBovinoId(bovinoId);
    setActiveTab('leche');
  };

  // Mapeo estético de badges
  const estadoColors: Record<string, string> = {
    activo: 'bg-green-100 text-green-800',
    inactivo: 'bg-gray-100 text-gray-800',
    vendido: 'bg-blue-100 text-blue-800',
    gestacion: 'bg-purple-100 text-purple-800',
    fallecido: 'bg-red-100 text-red-800',
  };

  const propositoBadges: Record<string, { label: string; class: string }> = {
    leche: { label: 'Leche', class: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    carne: { label: 'Carne', class: 'bg-amber-100 text-amber-800 border-amber-200' },
    doble_proposito: {
      label: 'Doble Propósito',
      class: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  };

  const columns = [
    { key: 'identificacion', label: 'ID' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    {
      key: 'proposito',
      label: 'Propósito',
      render: (value: string, row: Ganado) => {
        if (row.tipo !== 'bovino' || !value) return <span className="text-gray-400 text-xs">-</span>;
        const config = propositoBadges[value] || { label: value, class: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${config.class}`}>
            {config.label}
          </span>
        );
      },
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
      key: 'produccionEstimadaDiaria',
      label: 'Prod. Est.',
      render: (value?: number, row?: Ganado) =>
        row?.tipo === 'bovino' && value ? (
          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {value} L/día
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        ),
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
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles}`}>
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
      render: (value: string) => {
        if (!value) return 'N/A';
        try {
          const fechaSegura = new Date(value.replace(/-/g, '/'));
          return format(fechaSegura, 'dd/MM/yyyy');
        } catch (error) {
          return value;
        }
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Ganado) => (
        <div className="flex items-center space-x-2">
          {row.tipo === 'bovino' && (
            <button
              onClick={() => irAControlLecheroVaca(row.id)}
              className="p-1.5 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-md transition-colors"
              title="Ver Control Lechero"
            >
              <FiDroplet className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50 transition-colors"
            title="Editar Animal"
          >
            <FiEdit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50 transition-colors"
            title="Eliminar Animal"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Barra de Pestañas Superior */}
          <div className="flex flex-wrap items-center justify-between border-b border-gray-200 gap-4 pb-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('inventario')}
                className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'inventario'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <GiCow className="mr-2 h-5 w-5" />
                Inventario de Ganado ({ganado.length})
              </button>

              <button
                onClick={() => setActiveTab('leche')}
                className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'leche'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <GiMilkCarton className="mr-2 h-5 w-5" />
                Control Lechero (Bovinos)
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {activeTab === 'leche' && (
                <Button
                  onClick={() => abrirModalOrdenio()}
                  variant="primary"
                  className="!bg-cyan-600 hover:!bg-cyan-700"
                  icon={<FiPlus />}
                >
                  + Registrar Ordeño Diario
                </Button>
              )}
              {activeTab === 'inventario' && (
                <Button onClick={handleOpenNewModal} icon={<FiPlus />}>
                  Nuevo Animal
                </Button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PESTAÑA 1: INVENTARIO DE GANADO */}
          {/* ========================================================================= */}
          {activeTab === 'inventario' && (
            <Card
              title="Gestión de Ganado"
              subtitle="Administra bovinos, porcinos y demás especies de la finca"
            >
              {/* Barra de búsqueda y filtros */}
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

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  <span className="text-gray-600 text-sm flex items-center gap-1 font-medium">
                    <FiFilter /> Filtros:
                  </span>
                  <select
                    value={propositoFilter}
                    onChange={(e) => setPropositoFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg text-sm text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  >
                    <option value="todos">Todos los Propósitos</option>
                    <option value="leche">Leche</option>
                    <option value="carne">Carne</option>
                    <option value="doble_proposito">Doble Propósito</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg text-sm text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="vendido">Vendido</option>
                    <option value="gestacion">Gestación</option>
                    <option value="fallecido">Fallecido</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <Table columns={columns} data={filteredGanado} />
              )}
            </Card>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: CONTROL LECHERO (BOVINOS) */}
          {/* ========================================================================= */}
          {activeTab === 'leche' && (
            <div className="space-y-6">
              {/* Tarjetas informativas de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tarjeta 1: Producción de Hoy */}
                <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl shadow-sm border border-cyan-200 p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-cyan-700 tracking-wide uppercase">
                        Producción de Hoy
                      </p>
                      <div className="flex items-baseline space-x-2 mt-2">
                        <span className="text-3xl font-extrabold text-cyan-900">
                          {resumenLechero?.produccionHoy ?? 0}
                        </span>
                        <span className="text-base font-semibold text-cyan-700">Litros</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <FiCalendar className="mr-1 h-3.5 w-3.5" />
                        {format(new Date(), 'dd MMMM yyyy')}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600">
                      <FiDroplet className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Tarjeta 2: Promedio Diario (Calculado) */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border border-blue-200 p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-blue-700 tracking-wide uppercase">
                          Promedio Diario (Calculado)
                        </p>
                      </div>
                      <div className="flex items-baseline space-x-2 mt-2">
                        <span className="text-3xl font-extrabold text-blue-900">
                          {resumenLechero?.promedioDiario ?? 0}
                        </span>
                        <span className="text-base font-semibold text-blue-700">L / animal</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Suma del mes / Días con ordeño
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <GiMilkCarton className="h-7 w-7" />
                    </div>
                  </div>
                </div>

                {/* Tarjeta 3: Total Acumulado del Mes */}
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-200 p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-indigo-700 tracking-wide uppercase">
                        Total Acumulado del Mes
                      </p>
                      <div className="flex items-baseline space-x-2 mt-2">
                        <span className="text-3xl font-extrabold text-indigo-900">
                          {resumenLechero?.totalMes ?? 0}
                        </span>
                        <span className="text-base font-semibold text-indigo-700">Litros</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Suma directa de registros en {format(new Date(), 'MMMM')}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <FiCheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de Bovino y Perfil Lechero Individual */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <GiCow className="mr-2 text-cyan-600 h-6 w-6" />
                      Perfil de Producción Lechera por Animal (Estimada vs. Real)
                    </h3>
                    <p className="text-sm text-gray-500">
                      Selecciona un bovino para evaluar su rendimiento individual en tiempo real
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Bovino:
                    </span>
                    <select
                      value={selectedBovinoId || ''}
                      onChange={(e) => setSelectedBovinoId(Number(e.target.value))}
                      className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none min-w-[240px]"
                    >
                      {bovinosList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.identificacion} — {b.raza || 'Sin raza'} (
                          {b.proposito ? b.proposito.replace('_', ' ') : 'General'})
                        </option>
                      ))}
                    </select>

                    <Button
                      onClick={() => abrirModalOrdenio(selectedBovinoId || undefined)}
                      variant="primary"
                      className="!bg-cyan-600 hover:!bg-cyan-700 whitespace-nowrap"
                      icon={<FiPlus />}
                    >
                      Ordeñar Vaca
                    </Button>
                  </div>
                </div>

                {perfilLecheroVaca ? (
                  <div className="space-y-6">
                    {/* Banner explicativo de estado Híbrido: Estimada vs Real */}
                    {perfilLecheroVaca.tieneRegistros ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
                        <FiCheckCircle className="text-emerald-600 h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-emerald-900">
                            Producción en Base a Registros Reales del Mes
                          </p>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            El Promedio Diario Real se calcula dividiendo la suma de litros del mes
                            actual ({perfilLecheroVaca.totalMensualReal} L) entre los días con ordeño
                            registrado ({perfilLecheroVaca.diasConRegistro} días).
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                        <FiInfo className="text-amber-600 h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-amber-900">
                            Sin Registros Previos en el Mes — Modo Proyección Estimada
                          </p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Esta vaca aún no cuenta con lecturas de ordeño registradas en este mes.
                            El promedio diario y la proyección mensual se calculan en base a la{' '}
                            <strong>
                              Producción Diaria Estimada ({perfilLecheroVaca.produccionEstimadaDiaria} L/día)
                            </strong>{' '}
                            ingresada durante su registro inicial.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Fichas de Métricas Comparativas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                          Promedio Diario Actual
                        </span>
                        <span className="text-2xl font-bold text-gray-900 mt-1 block">
                          {perfilLecheroVaca.promedioDiarioCalculado} L/día
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 mt-2 rounded-full text-xs font-semibold ${
                            perfilLecheroVaca.tieneRegistros
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {perfilLecheroVaca.tieneRegistros ? 'Real Calculado' : 'Estimación Inicial'}
                        </span>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                          Total del Mes (Real)
                        </span>
                        <span className="text-2xl font-bold text-gray-900 mt-1 block">
                          {perfilLecheroVaca.totalMensualReal} Litros
                        </span>
                        <span className="text-xs text-gray-500 mt-2 block">
                          En {perfilLecheroVaca.diasConRegistro} días con registro
                        </span>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                          Producción Hoy
                        </span>
                        <span className="text-2xl font-bold text-cyan-700 mt-1 block">
                          {perfilLecheroVaca.produccionHoy} Litros
                        </span>
                        <span className="text-xs text-gray-500 mt-2 block">
                          Registrado el día de hoy
                        </span>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                          Proyección a 30 Días
                        </span>
                        <span className="text-2xl font-bold text-indigo-700 mt-1 block">
                          {perfilLecheroVaca.proyeccionMensual} Litros
                        </span>
                        <span className="text-xs text-gray-500 mt-2 block">
                          Promedio x 30 días
                        </span>
                      </div>
                    </div>

                    {/* Tabla de registros de ordeño del mes */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center">
                          <FiCalendar className="mr-2 text-cyan-600" />
                          Lecturas de Ordeño en el Mes ({perfilLecheroVaca.registrosMes?.length || 0})
                        </h4>
                        <button
                          onClick={() => abrirModalOrdenio(selectedBovinoId || undefined)}
                          className="text-xs font-semibold text-cyan-700 hover:text-cyan-900"
                        >
                          + Agregar Lectura
                        </button>
                      </div>

                      {perfilLecheroVaca.registrosMes && perfilLecheroVaca.registrosMes.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase">
                              <tr>
                                <th className="px-4 py-2.5 text-left">Fecha</th>
                                <th className="px-4 py-2.5 text-left">Litros Recolectados</th>
                                <th className="px-4 py-2.5 text-left">Descripción / Turno</th>
                                <th className="px-4 py-2.5 text-left">Observaciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {perfilLecheroVaca.registrosMes.map((reg: any) => (
                                <tr key={reg.id} className="hover:bg-cyan-50/50">
                                  <td className="px-4 py-2.5 font-medium text-gray-900">
                                    {format(new Date(reg.fecha), 'dd/MM/yyyy')}
                                  </td>
                                  <td className="px-4 py-2.5 font-bold text-cyan-800">
                                    {reg.cantidad} L
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-600">
                                    {reg.descripcion || 'Ordeño diario'}
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-500 text-xs">
                                    {reg.observaciones || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          No hay lecturas de ordeño registradas para esta vaca en el mes actual.
                          <div className="mt-3">
                            <Button
                              onClick={() => abrirModalOrdenio(selectedBovinoId || undefined)}
                              variant="secondary"
                              className="text-xs"
                            >
                              Registrar primer ordeño
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <GiCow className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    No hay vacas bovinas registradas en el sistema para control lechero.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL: REGISTRAR / EDITAR ANIMAL */}
          {/* ========================================================================= */}
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
                  readOnly={!editingAnimal}
                  className={!editingAnimal ? 'bg-gray-50 cursor-not-allowed font-semibold text-gray-600' : ''}
                  required
                />

                <Select
                  label="Tipo de Animal"
                  error={errors.tipo?.message}
                  options={[
                    { value: 'bovino', label: 'Bovino (Ganado Vacuno)' },
                    { value: 'porcino', label: 'Porcino (Cerdos)' },
                    { value: 'ovino', label: 'Ovino (Ovejas)' },
                    { value: 'caprino', label: 'Caprino (Cabras)' },
                    { value: 'avicola', label: 'Avícola (Aves)' },
                    { value: 'otro', label: 'Otro' },
                  ]}
                  {...register('tipo')}
                  required
                />

                {/* Campos específicos de Bovinos: Propósito, Raza filtrada y Producción Estimada */}
                {watchTipo === 'bovino' && (
                  <>
                    <Select
                      label="Propósito Productivo"
                      error={errors.proposito?.message}
                      options={PROPOSITOS_BOVINO.map((p) => ({
                        value: p.value,
                        label: p.label,
                      }))}
                      {...register('proposito')}
                      onChange={(e) => {
                        setValue('proposito', e.target.value as any);
                        // Sugerir la primera raza correspondiente al nuevo propósito
                        const razas = RAZAS_POR_PROPOSITO[e.target.value as PropositoBovino];
                        if (razas && razas.length > 0) {
                          setValue('raza', razas[0]);
                        }
                      }}
                      required
                    />

                    <div>
                      <Select
                        label="Raza (Filtrada por Propósito)"
                        error={errors.raza?.message}
                        options={opcionesRaza.map((r) => ({
                          value: r,
                          label: r,
                        }))}
                        {...register('raza')}
                        required
                      />
                    </div>

                    <Input
                      label="Producción diaria estimada (Litros/día)"
                      type="number"
                      step="0.1"
                      placeholder="Ej: 15.5"
                      error={errors.produccionEstimadaDiaria?.message}
                      {...register('produccionEstimadaDiaria', { valueAsNumber: true })}
                    />
                  </>
                )}

                {watchTipo !== 'bovino' && (
                  <Input
                    label="Raza"
                    error={errors.raza?.message}
                    {...register('raza')}
                    placeholder="Ej: Landrace, Dorper, etc."
                    suggestions={Array.from(new Set(ganado.map((g) => g.raza).filter(Boolean) as string[]))}
                    required
                  />
                )}

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
                    { value: 'hembra', label: 'Hembra' },
                    { value: 'macho', label: 'Macho' },
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
                    { value: 'inactivo', label: 'Inactivo' },
                    { value: 'vendido', label: 'Vendido' },
                    { value: 'gestacion', label: 'Gestación' },
                    { value: 'fallecido', label: 'Fallecido' },
                  ]}
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

              {/* Alertas Biológicas Interactivas (Edad vs. Peso) */}
              {evaluacionBiologicaForm.alertas.length > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg space-y-1">
                  <div className="flex items-center space-x-2 text-amber-800 font-semibold text-sm">
                    <FiAlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <span>
                      Control Biológico de Desarrollo ({evaluacionBiologicaForm.edadMeses} meses de edad)
                    </span>
                  </div>
                  {evaluacionBiologicaForm.alertas.map((alerta, idx) => (
                    <p key={idx} className="text-xs text-amber-700 pl-7">
                      {alerta.mensaje}
                    </p>
                  ))}
                  <p className="text-[11px] text-amber-600 pl-7 italic">
                    (Nota: Estas alertas son advertencias orientativas para evitar inconsistencias de digitación y no bloquean el guardado).
                  </p>
                </div>
              )}

              <TextArea
                label="Observaciones"
                error={errors.observaciones?.message}
                {...register('observaciones')}
                rows={3}
              />

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingAnimal ? 'Actualizar Animal' : 'Crear Animal'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* ========================================================================= */}
          {/* MODAL: REGISTRAR ORDEÑO DIARIO */}
          {/* ========================================================================= */}
          <Modal
            isOpen={ordenioModalOpen}
            onClose={() => setOrdenioModalOpen(false)}
            title="Registrar Ordeño Diario"
            size="md"
          >
            <form onSubmit={handleGuardarOrdenio} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vaca / Bovino <span className="text-red-500">*</span>
                </label>
                <select
                  value={ordenioBovinoId}
                  onChange={(e) => setOrdenioBovinoId(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="">Seleccionar bovino...</option>
                  {bovinosList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.identificacion} — {b.raza} ({b.proposito || 'bovino'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del Ordeño <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={ordenioFecha}
                    onChange={(e) => setOrdenioFecha(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Litros Recolectados <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Ej: 14.5"
                    value={ordenioCantidad}
                    onChange={(e) => setOrdenioCantidad(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turno / Sesión
                </label>
                <select
                  value={ordenioSesion}
                  onChange={(e) => setOrdenioSesion(e.target.value as any)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="completa">Día Completo</option>
                  <option value="mañana">Mañana</option>
                  <option value="tarde">Tarde</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={ordenioObservaciones}
                  onChange={(e) => setOrdenioObservaciones(e.target.value)}
                  rows={2}
                  placeholder="Ej: Buen caudal, sin mastitis ni anomalías..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOrdenioModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="!bg-cyan-600 hover:!bg-cyan-700"
                  disabled={guardandoOrdenio}
                >
                  {guardandoOrdenio ? 'Guardando...' : 'Guardar Ordeño'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}