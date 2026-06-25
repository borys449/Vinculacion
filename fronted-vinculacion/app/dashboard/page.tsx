'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/Card';
import { cultivoService } from '@/services/cultivo.service';
import { ganadoService } from '@/services/ganado.service';
import { registroService } from '@/services/registro.service';
import { GiCorn, GiCow } from 'react-icons/gi';
import { FiFileText, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    cultivos: 0,
    ganado: 0,
    registros: 0,
    ingresos: 0,
    costos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [cultivosRes, ganadoRes, registrosRes] = await Promise.all([
        cultivoService.getAll(),
        ganadoService.getAll(),
        registroService.getAll(),
      ]);

      // Calcular totales
      let totalIngresos = 0;
      let totalCostos = 0;

      if (registrosRes.success && registrosRes.data) {
        registrosRes.data.forEach((registro: any) => {
          if (registro.ingresos) totalIngresos += parseFloat(registro.ingresos);
          if (registro.costo) totalCostos += parseFloat(registro.costo);
        });
      }

      setStats({
        cultivos: cultivosRes.count || 0,
        ganado: ganadoRes.count || 0,
        registros: registrosRes.count || 0,
        ingresos: totalIngresos,
        costos: totalCostos,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const balance = stats.ingresos - stats.costos;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {user?.nombre}
            </h1>
            <p className="text-gray-600 mt-2">
              Panel de control - Sistema de Gestión Agropecuaria
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              {/* Estadísticas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Cultivos"
                  value={stats.cultivos}
                  icon={<GiCorn className="h-6 w-6" />}
                  color="green"
                />
                <StatCard
                  title="Total Ganado"
                  value={stats.ganado}
                  icon={<GiCow className="h-6 w-6" />}
                  color="blue"
                />
                <StatCard
                  title="Registros"
                  value={stats.registros}
                  icon={<FiFileText className="h-6 w-6" />}
                  color="purple"
                />
                <StatCard
                  title="Balance"
                  value={`$${balance.toFixed(2)}`}
                  icon={<FiDollarSign className="h-6 w-6" />}
                  color={balance >= 0 ? 'green' : 'red'}
                />
              </div>

              {/* Resumen financiero */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resumen Financiero
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Ingresos</span>
                      <span className="text-lg font-semibold text-green-600">
                        ${stats.ingresos.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Costos</span>
                      <span className="text-lg font-semibold text-red-600">
                        ${stats.costos.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-semibold">
                          Balance Neto
                        </span>
                        <span
                          className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                          ${balance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Accesos Rápidos
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <a
                      href="/cultivos"
                      className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <GiCorn className="h-8 w-8 text-green-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Cultivos
                      </span>
                    </a>
                    <a
                      href="/ganado"
                      className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <GiCow className="h-8 w-8 text-blue-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Ganado
                      </span>
                    </a>
                    <a
                      href="/registros"
                      className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <FiFileText className="h-8 w-8 text-purple-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Registros
                      </span>
                    </a>
                    <a
                      href="/registros"
                      className="flex flex-col items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                    >
                      <FiTrendingUp className="h-8 w-8 text-yellow-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Reportes
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
