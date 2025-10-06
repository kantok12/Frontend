import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DashboardStats } from '../components/dashboard/DashboardStats';

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href?: string;
}> = ({ title, value, icon, color, href }) => {
  const content = (
    <div className={`p-6 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};


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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Resumen general del sistema de gestión de personal
        </p>
      </div>

      {/* Stats Cards */}
      <div className="slide-up animate-delay-200">
        <DashboardStats />
      </div>
      

      {/* System Status */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado del Sistema
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Backend</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base de Datos</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                Activo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Autenticación</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                Funcionando
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información del Sistema
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Versión</span>
              <span className="text-sm font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Última Actualización</span>
              <span className="text-sm font-medium text-gray-900">Hoy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Soporte</span>
              <span className="text-sm font-medium text-primary-600">Disponible</span>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};
