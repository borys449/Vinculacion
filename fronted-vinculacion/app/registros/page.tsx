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
  registroService,
  Registro,
  RegistroFormData,
} from '@/services/registro.service';
import { cultivoService } from '@/services/cultivo.service';
import { ganadoService } from '@/services/ganado.service';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { format } from 'date-fns';

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cultivos, setCultivos] = useState<any[]>([]);
  const [ganado, setGanado] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);
  const [formData, setFormData] = useState<RegistroFormData>({
    tipo: 'cultivo',
    categoria: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const [totales, setTotales] = useState({
    ingresos: 0,
    costos: 0,
    balance: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [registrosRes, cultivosRes, ganadoRes] = await Promise.all([
        registroService.getAll(),
        cultivoService.getAll(),
        ganadoService.getAll(),
      ]);

      if (registrosRes.success) {
        setRegistros(registrosRes.data);
        calcularTotales(registrosRes.data);
      }
      if (cultivosRes.success) setCultivos(cultivosRes.data);
      if (ganadoRes.success) setGanado(ganadoRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotales = (data: Registro[]) => {
    let ingresos = 0;
    let costos = 0;

    data.forEach((registro) => {
      if (registro.ingresos)
        ingresos += parseFloat(registro.ingresos.toString());
      if (registro.costo) costos += parseFloat(registro.costo.toString());
    });

    setTotales({
      ingresos,
      costos,
      balance: ingresos - costos,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Limpiar datos antes de enviar
      const cleanData: any = {
        tipo: formData.tipo,
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        fecha: formData.fecha,
      };

      // Solo agregar campos numéricos si tienen valores válidos
      if (formData.cantidad && !isNaN(formData.cantidad)) {
        cleanData.cantidad = formData.cantidad;
      }
      if (formData.costo && !isNaN(formData.costo)) {
        cleanData.costo = formData.costo;
      }
      if (formData.ingresos && !isNaN(formData.ingresos)) {
        cleanData.ingresos = formData.ingresos;
      }

      // Solo agregar campos opcionales si tienen valores
      if (formData.unidad) cleanData.unidad = formData.unidad;
      if (formData.observaciones)
        cleanData.observaciones = formData.observaciones;
      if (formData.cultivoId) cleanData.cultivoId = formData.cultivoId;
      if (formData.ganadoId) cleanData.ganadoId = formData.ganadoId;

      console.log('Datos a enviar:', cleanData);

      if (editingRegistro) {
        await registroService.update(editingRegistro.id, cleanData);
      } else {
        await registroService.create(cleanData);
      }
      fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving registro:', error);
      console.error('Error response:', error.response?.data);

      // Mostrar errores de validación específicos
      if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        const errorMessages = error.response.data.errors
          .map((e: any) => e.msg)
          .join('\n');
        alert(`Errores de validación:\n${errorMessages}`);
      } else {
        alert(
          `Error al guardar: ${error.response?.data?.message || error.message}`
        );
      }
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
    setFormData({
      tipo: registro.tipo,
      categoria: registro.categoria,
      descripcion: registro.descripcion,
      fecha: registro.fecha.split('T')[0],
      cantidad: registro.cantidad,
      unidad: registro.unidad,
      costo: registro.costo,
      ingresos: registro.ingresos,
      observaciones: registro.observaciones,
      cultivoId: registro.cultivoId,
      ganadoId: registro.ganadoId,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRegistro(null);
    setFormData({
      tipo: 'cultivo',
      categoria: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
    });
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Registro"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value as any })
                }
                options={[
                  { value: 'cultivo', label: 'Cultivo' },
                  { value: 'ganado', label: 'Ganado' },
                  { value: 'mantenimiento', label: 'Mantenimiento' },
                  { value: 'produccion', label: 'Producción' },
                  { value: 'venta', label: 'Venta' },
                  { value: 'otro', label: 'Otro' },
                ]}
                required
              />

              <Input
                label="Categoría"
                value={formData.categoria}
                onChange={(e) =>
                  setFormData({ ...formData, categoria: e.target.value })
                }
                placeholder="Ej: Fertilizante, Semillas, etc."
                required
              />

              <Input
                label="Fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) =>
                  setFormData({ ...formData, fecha: e.target.value })
                }
                required
              />

              {formData.tipo === 'cultivo' && (
                <Select
                  label="Cultivo Relacionado"
                  value={formData.cultivoId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cultivoId: parseInt(e.target.value),
                    })
                  }
                  options={cultivos.map((c) => ({
                    value: c.id,
                    label: c.nombre,
                  }))}
                />
              )}

              {formData.tipo === 'ganado' && (
                <Select
                  label="Ganado Relacionado"
                  value={formData.ganadoId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ganadoId: parseInt(e.target.value),
                    })
                  }
                  options={ganado.map((g) => ({
                    value: g.id,
                    label: g.identificacion,
                  }))}
                />
              )}

              <Input
                label="Cantidad"
                type="number"
                step="0.01"
                value={formData.cantidad || ''}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  setFormData({
                    ...formData,
                    cantidad: value,
                  });
                }}
              />

              <Select
                label="Unidad"
                value={formData.unidad || ''}
                onChange={(e) =>
                  setFormData({ ...formData, unidad: e.target.value as any })
                }
                options={[
                  { value: 'kg', label: 'Kilogramos' },
                  { value: 'toneladas', label: 'Toneladas' },
                  { value: 'litros', label: 'Litros' },
                  { value: 'unidades', label: 'Unidades' },
                  { value: 'metros', label: 'Metros' },
                  { value: 'hectareas', label: 'Hectáreas' },
                  { value: 'otro', label: 'Otro' },
                ]}
              />

              <Input
                label="Costo ($)"
                type="number"
                step="0.01"
                value={formData.costo || ''}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  setFormData({
                    ...formData,
                    costo: value,
                  });
                }}
              />

              <Input
                label="Ingresos ($)"
                type="number"
                step="0.01"
                value={formData.ingresos || ''}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  setFormData({
                    ...formData,
                    ingresos: value,
                  });
                }}
              />
            </div>

            <TextArea
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Mínimo 5 caracteres"
              rows={3}
              required
            />

            <TextArea
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
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
