'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/ui/Card';
import { fincaService, Finca, Lote } from '@/services/finca.service';
import { useAuth } from '@/context/AuthContext';

const MapaFinca = dynamic(() => import('@/components/map/MapaFinca'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-gray-100 rounded-xl">
      <p className="text-sm text-gray-500 animate-pulse">Cargando visor satelital...</p>
    </div>
  ),
});

export default function ConfigurarMapaPage() {
  const { user } = useAuth();
  const [finca, setFinca] = useState<Finca | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const resFinca = await fincaService.getMiFinca();
      if (resFinca.success) {
        setFinca(resFinca.data);
      }
      const resLotes = await fincaService.getLotes();
      if (resLotes.success) {
        setLotes(resLotes.data);
      }
    } catch (err: any) {
      console.error('Error cargando datos de la finca:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGuardarPerimetro = async (geometria: any) => {
    try {
      setMensaje(null);
      const res = await fincaService.actualizarPerimetro(geometria);
      if (res.success) {
        setFinca(res.data);
        setMensaje({ tipo: 'ok', texto: 'Perímetro general de la finca guardado exitosamente.' });
      }
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'Error al guardar el perímetro de la finca'
      });
    }
  };

  const handleCrearLote = async (data: { nombre: string; tipo: 'agricultura' | 'ganaderia'; geometria: any }) => {
    try {
      setMensaje(null);
      const res = await fincaService.crearLote(data);
      if (res.success) {
        setLotes((prev) => [...prev, res.data]);
        setMensaje({ tipo: 'ok', texto: `Lote '${data.nombre}' (${data.tipo}) creado exitosamente.` });
      }
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'Error al crear el lote'
      });
    }
  };

  const handleEliminarLote = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este lote? Se registrará en la bitácora.')) return;
    try {
      await fincaService.eliminarLote(id);
      setLotes((prev) => prev.filter((l) => l.id !== id));
      setMensaje({ tipo: 'ok', texto: 'Lote eliminado de la finca.' });
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'Error al eliminar el lote'
      });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <Card
            title="Cartografía Satelital y Lotes de la Finca"
            subtitle={
              finca
                ? `Finca: ${finca.nombre} — Gestión de polígono perimetral y sub-lotes agrícolas y ganaderos`
                : 'Gestión cartográfica'
            }
          >
            {mensaje && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs font-medium ${
                  mensaje.tipo === 'ok'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {mensaje.texto}
              </div>
            )}

            {!loading && (
              <MapaFinca
                fincaId={finca ? String(finca.id) : ''}
                perimetroInicial={finca?.poligonoPerimetro}
                lotesExistentes={lotes as any}
                onGuardarPerimetro={handleGuardarPerimetro}
                onCrearLote={handleCrearLote}
              />
            )}
          </Card>

          {/* Listado de Lotes Actuales */}
          <Card title="Sub-lotes Registrados" subtitle="Visibilidad cruzada de lotes agrícolas y ganaderos">
            {lotes.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No hay lotes registrados aún. Usa la herramienta del mapa para dibujar un lote.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lotes.map((lote) => (
                  <div
                    key={lote.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      lote.tipo === 'agricultura'
                        ? 'bg-green-50/50 border-green-200'
                        : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold text-gray-900">{lote.nombre}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            lote.tipo === 'agricultura'
                              ? 'bg-green-200 text-green-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {lote.tipo}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Creado por: <span className="font-semibold">{lote.creadoPor?.nombre || 'Usuario'}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200/60 flex justify-end">
                      <button
                        onClick={() => handleEliminarLote(lote.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar Lote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
