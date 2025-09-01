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



                  {/* Gráfico de Servicios por Zona de Gestión */}
            <div className="slide-up animate-delay-300 card hover-lift">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Servicios por Zona de Gestión
                </h2>
                <div className="floating">
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-4">
                {/* MINERÍA */}
                <div className="stagger-item animate-delay-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Minería</span>
                    <span className="text-sm text-orange-600 font-semibold">33%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '33%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2 servicios</span>
                    <span>Mantenimiento + Spot</span>
                  </div>
                </div>

                {/* INDUSTRIA */}
                <div className="stagger-item animate-delay-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Industria</span>
                    <span className="text-sm text-blue-600 font-semibold">67%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '67%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>4 servicios</span>
                    <span>Integral + Programa + Levantamientos + Instalaciones</span>
                  </div>
                </div>
              </div>

              {/* Desglose por Categorías */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Desglose por Categorías</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Categorías Minería */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-600">• Mantenimiento Minero</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-600">• Servicio Spot</span>
                      <span className="font-medium">1</span>
                    </div>
                  </div>
                  
                  {/* Categorías Industria */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600">• Servicio Integral</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600">• Programa de Lubricación</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600">• Levantamientos</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600">• Instalaciones</span>
                      <span className="font-medium">1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen del gráfico */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">2</div>
                    <div className="text-xs text-gray-600">Servicios Minería</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">4</div>
                    <div className="text-xs text-gray-600">Servicios Industria</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-gray-600">6</div>
                    <div className="text-xs text-gray-600">Total Servicios</div>
                  </div>
                </div>
              </div>
            </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
};
