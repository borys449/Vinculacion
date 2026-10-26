'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/Card';
import { cultivoService } from '@/services/cultivo.service';
import { ganadoService } from '@/services/ganado.service';
import { registroService } from '@/services/registro.service';
import { GiCorn, GiCow } from 'react-icons/gi';
import {
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiClock,
  FiFilter,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  // Estados para segmentación de área
  const isAdmin = user?.tipo === 'administrador';
  const [areaFiltro, setAreaFiltro] = useState<'global' | 'cultivos' | 'ganaderia'>('global');

  // Determinar área activa efectiva: si es admin usa el selector, si no, usa su área asignada
  const activeArea: 'global' | 'cultivos' | 'ganaderia' = useMemo(() => {
    if (isAdmin) return areaFiltro;
    if (user?.area === 'ganaderia') return 'ganaderia';
    return 'cultivos';
  }, [isAdmin, areaFiltro, user?.area]);

  const [stats, setStats] = useState({
    cultivos: 0,
    ganado: 0,
    registros: 0,
    ingresos: 0,
    costos: 0,
  });
  const [actividadReciente, setActividadReciente] = useState<any[]>([]);
  const [datosTendencias, setDatosTendencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Bitácora Completa y Filtros
  const [showModalBitacora, setShowModalBitacora] = useState(false);
  const [historialCompleto, setHistorialCompleto] = useState<any[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const fetchDashboardData = async (targetArea: 'global' | 'cultivos' | 'ganaderia') => {
    try {
      setLoading(true);
      const areaParam = targetArea === 'global' ? undefined : targetArea;

      const [cultivosRes, ganadoRes, registrosRes, resumenRes, statsDashboardRes] =
        await Promise.all([
          targetArea === 'global' || targetArea === 'cultivos'
            ? cultivoService.getAll().catch(() => ({ count: 0, data: [] }))
            : Promise.resolve({ count: 0, data: [] }),
          targetArea === 'global' || targetArea === 'ganaderia'
            ? ganadoService.getAll().catch(() => ({ count: 0, data: [] }))
            : Promise.resolve({ count: 0, data: [] }),
          registroService.getAll(areaParam).catch(() => ({ success: false, count: 0, data: [] })),
          registroService.getResumenFinanciero(areaParam).catch(() => ({
            success: false,
            data: { ingresos: 0, costos: 0, balance: 0 },
          })),
          registroService.getDashboardStats(areaParam).catch(() => ({
            success: false,
            data: { actividadReciente: [], datosGraficoTendencias: [] },
          })),
        ]);

      const totalIngresos =
        resumenRes?.success && resumenRes?.data
          ? Number(resumenRes.data.ingresos || 0)
          : 0;
      const totalCostos =
        resumenRes?.success && resumenRes?.data
          ? Number(resumenRes.data.costos || 0)
          : 0;

      const totalCultivos =
        targetArea === 'ganaderia'
          ? 0
          : cultivosRes?.count !== undefined
          ? Number(cultivosRes.count)
          : Array.isArray(cultivosRes?.data)
          ? cultivosRes.data.length
          : 0;

      const totalGanado =
        targetArea === 'cultivos'
          ? 0
          : ganadoRes?.count !== undefined
          ? Number(ganadoRes.count)
          : Array.isArray(ganadoRes?.data)
          ? ganadoRes.data.length
          : 0;

      const totalRegistros =
        registrosRes?.count !== undefined
          ? Number(registrosRes.count)
          : Array.isArray(registrosRes?.data)
          ? registrosRes.data.length
          : 0;

      setStats({
        cultivos: totalCultivos,
        ganado: totalGanado,
        registros: totalRegistros,
        ingresos: totalIngresos,
        costos: totalCostos,
      });

      if (statsDashboardRes && statsDashboardRes.success && statsDashboardRes.data) {
        setActividadReciente(statsDashboardRes.data.actividadReciente || []);
        setDatosTendencias(statsDashboardRes.data.datosGraficoTendencias || []);
      } else {
        setActividadReciente([]);
        setDatosTendencias([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData(activeArea);
    }
  }, [user, activeArea]);

  const abrirModalBitacora = async () => {
    setShowModalBitacora(true);
    setLoadingHistorial(true);
    try {
      const areaParam = activeArea === 'global' ? undefined : activeArea;
      const res = await registroService.getAll(areaParam);
      if (res.success) {
        setHistorialCompleto(res.data || []);
      }
    } catch (error) {
      console.error('Error al cargar historial completo:', error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const balance = stats.ingresos - stats.costos;

  const maxValorGrafico = Math.max(
    ...datosTendencias.flatMap((item) => [Number(item.ingresos || 0), Number(item.costos || 0)]),
    100
  );

  const getAreaLabel = () => {
    if (activeArea === 'cultivos') return 'Cultivos';
    if (activeArea === 'ganaderia') return 'Ganadería';
    return 'Global (Todo el Sistema)';
  };

  const obtenerIniciales = (nombre?: string) => {
    if (!nombre) return 'SI';
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'SI';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div>
          {/* Header con título y selector de segmentación para administrador */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido, {user?.nombre?.trim()}
              </h1>
              <p className="text-gray-600 mt-1">
                Panel de control - Sistema de Gestión Agropecuaria ({getAreaLabel()})
              </p>
            </div>

            {/* Selector de segmentación exclusivo para administradores */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200 self-start md:self-auto">
                <span className="text-xs font-semibold text-gray-500 px-2 flex items-center gap-1">
                  <FiFilter /> Segmentar por Área:
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
              <div className="self-start md:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Área exclusiva: {user?.area ? user.area.toUpperCase() : 'ASIGNADA'}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              {/* Tarjetas flotantes filtradas de forma estricta según área */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${
                  activeArea === 'global' ? 'xl:grid-cols-6' : 'xl:grid-cols-5'
                } gap-5 mb-8`}
              >
                {(activeArea === 'global' || activeArea === 'cultivos') && (
                  <StatCard
                    title="Total Cultivos"
                    value={stats.cultivos}
                    icon={<GiCorn className="h-6 w-6" />}
                    color="green"
                  />
                )}
                {(activeArea === 'global' || activeArea === 'ganaderia') && (
                  <StatCard
                    title="Total Ganado"
                    value={stats.ganado}
                    icon={<GiCow className="h-6 w-6" />}
                    color="blue"
                  />
                )}
                <StatCard
                  title={`Registros (${activeArea === 'cultivos' ? 'Cultivos' : activeArea === 'ganaderia' ? 'Ganadería' : 'Totales'})`}
                  value={stats.registros}
                  icon={<FiFileText className="h-6 w-6" />}
                  color="purple"
                />
                <StatCard
                  title="Total Ingresos"
                  value={`$${stats.ingresos.toFixed(2)}`}
                  icon={<FiTrendingUp className="h-6 w-6" />}
                  color="green"
                />
                <StatCard
                  title="Total Gastos"
                  value={`$${stats.costos.toFixed(2)}`}
                  icon={<FiTrendingDown className="h-6 w-6" />}
                  color="red"
                />
                <StatCard
                  title="Balance Neto"
                  value={`$${balance.toFixed(2)}`}
                  icon={<FiDollarSign className="h-6 w-6" />}
                  color={balance >= 0 ? 'green' : 'red'}
                />
              </div>

              {/* Gráfico de Barras: Tendencias Financieras del Área */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FiTrendingUp className="text-blue-600" /> Tendencia Financiera (Últimos 6 Meses)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ingresos y gastos mensuales segmentados ({getAreaLabel()})
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-500 rounded-sm inline-block"></span> Ingresos
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-red-400 rounded-sm inline-block"></span> Gastos
                    </span>
                  </div>
                </div>

                <div className="h-56 flex items-end justify-between gap-4 pt-6 border-b border-gray-100 px-4">
                  {datosTendencias.length === 0 ? (
                    <div className="w-full flex items-center justify-center text-gray-400 text-sm">
                      No hay datos históricos en los últimos 6 meses para {getAreaLabel()}.
                    </div>
                  ) : (
                    datosTendencias.map((item, index) => {
                      const ingresosNum = Number(item.ingresos || 0);
                      const costosNum = Number(item.costos || 0);
                      const alturaIngresos = (ingresosNum / maxValorGrafico) * 100;
                      const alturaCostos = (costosNum / maxValorGrafico) * 100;

                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center h-full justify-end group relative"
                        >
                          <div className="absolute -top-12 bg-gray-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-md">
                            {item.mes}: <span className="text-green-400">+${ingresosNum.toFixed(2)}</span> /{' '}
                            <span className="text-red-400">-${costosNum.toFixed(2)}</span>
                          </div>

                          <div className="w-full flex items-end justify-center gap-2 h-44">
                            <div
                              style={{ height: `${Math.max(alturaIngresos, 4)}%` }}
                              className="w-1/2 bg-green-500 rounded-t transition-all duration-300 group-hover:bg-green-600"
                            ></div>
                            <div
                              style={{ height: `${Math.max(alturaCostos, 4)}%` }}
                              className="w-1/2 bg-red-400 rounded-t transition-all duration-300 group-hover:bg-red-500"
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 mt-2 font-medium capitalize truncate w-full text-center">
                            {item.mes}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Fila Inferior: Bitácora de Actividad Reciente y Accesos Rápidos */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div
                  onClick={abrirModalBitacora}
                  className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-2 cursor-pointer hover:border-purple-400 transition-all group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FiClock className="text-purple-600" /> Bitácora de Actividad Reciente
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Trazabilidad exclusiva de: {getAreaLabel()}
                      </p>
                    </div>
                    <span className="text-xs text-purple-600 font-medium group-hover:underline">
                      Ver todo y filtrar →
                    </span>
                  </div>

                  <div className="space-y-4">
                    {actividadReciente.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6">
                        No hay registros de actividad reciente para {getAreaLabel()}.
                      </p>
                    ) : (
                      actividadReciente.map((item) => {
                        const nombreUsuario = item.registradoPor
                          ? item.registradoPor.nombre
                          : 'Sistema';
                        const iniciales = obtenerIniciales(nombreUsuario);
                        const fechaFormateada = new Date(item.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                          >
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {iniciales}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium truncate">
                                {nombreUsuario}{' '}
                                <span className="text-xs text-gray-500 font-normal">
                                  ({item.tipo})
                                </span>
                              </p>
                              <p className="text-xs text-gray-600 truncate">{item.descripcion}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded uppercase font-semibold">
                                  {item.categoria}
                                </span>
                                <span className="text-[10px] text-gray-400">{fechaFormateada}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {Number(item.ingresos) > 0 ? (
                                <span className="text-xs font-semibold text-green-600">
                                  +${parseFloat(item.ingresos).toFixed(2)}
                                </span>
                              ) : Number(item.costo) > 0 ? (
                                <span className="text-xs font-semibold text-red-600">
                                  -${parseFloat(item.costo).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-gray-400">
                                  Operativo
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(activeArea === 'global' || activeArea === 'cultivos') && (
                      <Link
                        href="/cultivos"
                        className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <GiCorn className="h-8 w-8 text-green-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Cultivos</span>
                      </Link>
                    )}
                    {(activeArea === 'global' || activeArea === 'ganaderia') && (
                      <Link
                        href="/ganado"
                        className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <GiCow className="h-8 w-8 text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-gray-700">Ganado</span>
                      </Link>
                    )}
                    <Link
                      href="/registros"
                      className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <FiFileText className="h-8 w-8 text-purple-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Registros</span>
                    </Link>
                    <Link
                      href="/registros"
                      className="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                    >
                      <FiTrendingUp className="h-8 w-8 text-yellow-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Reportes</span>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Modal de Bitácora Completa */}
          {showModalBitacora && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Bitácora Completa de Actividad
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Historial operativo y trazabilidad ({getAreaLabel()})
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModalBitacora(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Filtrar por mes:
                    </label>
                    <input
                      type="month"
                      value={mesSeleccionado}
                      onChange={(e) => setMesSeleccionado(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {mesSeleccionado && (
                    <button
                      onClick={() => setMesSeleccionado('')}
                      className="text-xs text-purple-600 hover:underline font-medium"
                    >
                      Limpiar filtro
                    </button>
                  )}
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-3">
                  {loadingHistorial ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    (() => {
                      const registrosFiltrados = historialCompleto.filter((item) => {
                        if (!mesSeleccionado) return true;
                        const fechaItem = new Date(item.fecha).toISOString().slice(0, 7);
                        return fechaItem === mesSeleccionado;
                      });

                      if (registrosFiltrados.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 text-center py-12">
                            No hay registros en la bitácora para el periodo seleccionado.
                          </p>
                        );
                      }

                      return registrosFiltrados.map((item) => {
                        const nombreUsuario = item.registradoPor
                          ? item.registradoPor.nombre
                          : 'Sistema';
                        const iniciales = obtenerIniciales(nombreUsuario);
                        const fechaFormateada = new Date(item.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/60 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {iniciales}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium">
                                {nombreUsuario}{' '}
                                <span className="text-xs text-gray-500 font-normal">
                                  ({item.tipo})
                                </span>
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">{item.descripcion}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded uppercase font-semibold">
                                  {item.categoria}
                                </span>
                                <span className="text-[10px] text-gray-400">{fechaFormateada}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {Number(item.ingresos) > 0 ? (
                                <span className="text-xs font-semibold text-green-600">
                                  +${parseFloat(item.ingresos).toFixed(2)}
                                </span>
                              ) : Number(item.costo) > 0 ? (
                                <span className="text-xs font-semibold text-red-600">
                                  -${parseFloat(item.costo).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-gray-400">
                                  Operativo
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setShowModalBitacora(false)}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
