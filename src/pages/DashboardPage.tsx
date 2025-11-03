import React from 'react';
import { useDashboardStats } from '../hooks/useDashboard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import ResumenPersonalWidget from '../components/dashboard/ResumenPersonalWidget';
import ResumenPersonalDetalle from '../components/dashboard/ResumenPersonalDetalle';

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

        {/* Información adicional: Resumen Personal y detalle */}
        <div className="mt-8 grid grid-cols-1 gap-8">
          <div className="grid grid-cols-1 gap-6">
            <ResumenPersonalWidget />
            <ResumenPersonalDetalle />
          </div>
        </div>

      </div>
    </div>
  );
};