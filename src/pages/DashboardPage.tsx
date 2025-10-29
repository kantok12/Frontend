import React from 'react';
import { 
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DashboardStats } from '../components/dashboard/DashboardStats';

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  // Usar datos simulados si hay error o está cargando
  const dashboardStats = stats || {
    total_personal: 45,
    total_empresas: 12,
    total_servicios: 8,
    personal_activo: 38,
    servicios_activos: 7,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards y Gráficos */}
        <div className="slide-up animate-delay-200">
          <DashboardStats />
        </div>

        {/* Información adicional */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Próximos eventos */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Próximos Eventos</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {[
                { hora: '08:00', evento: 'Mantenimiento Industrial', ubicacion: 'Planta Norte' },
                { hora: '10:30', evento: 'Servicio Spot', ubicacion: 'Zona Sur' },
                { hora: '14:00', evento: 'Programa de Lubricación', ubicacion: 'Área Central' },
                { hora: '16:30', evento: 'Inspección General', ubicacion: 'Planta Principal' }
              ].map((evento, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{evento.evento}</p>
                    <p className="text-sm text-gray-500">{evento.ubicacion}</p>
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {evento.hora}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de rendimiento */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Rendimiento</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Servicios Completados</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">94%</p>
                  <p className="text-xs text-green-600">+5% vs mes anterior</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Personal Activo</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">87%</p>
                  <p className="text-xs text-blue-600">+3% vs mes anterior</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Satisfacción Cliente</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">4.8/5</p>
                  <p className="text-xs text-purple-600">+0.2 vs mes anterior</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Eficiencia Operacional</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">91%</p>
                  <p className="text-xs text-orange-600">+7% vs mes anterior</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};