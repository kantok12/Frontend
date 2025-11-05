import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar,
  Settings, 
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useDashboardStats } from '../../hooks/useDashboard';
import useResumenPersonalPorCliente from '../../hooks/useResumenPersonalPorCliente';
import { usePersonalList } from '../../hooks/usePersonal';
import { useEstadisticasServicios } from '../../hooks/useServicios';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PersonalInfoModal } from './PersonalInfoModal';
import { PersonalTrabajandoModal } from './PersonalTrabajandoModal';
import { EventosModal } from './EventosModal';
import { NodosInfoModal } from './NodosInfoModal';
import { CarterasInfoModal } from './CarterasInfoModal';

// Función para obtener los próximos 15 días
const getProximosDias = () => {
  const dias = [];
  const hoy = new Date();
  for (let i = 0; i < 15; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    dias.push(fecha.toISOString().split('T')[0]);
  }
  return dias;
};

// const proximosDias = getProximosDias(); // TODO: Usar cuando se implementen eventos reales


const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href?: string;
  onClick?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}> = ({ title, value, icon, color, href, onClick, trend }) => {
  const content = (
    <div className={`p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 ${(href || onClick) ? 'cursor-pointer hover:scale-105' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color} shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return content;
};

export const DashboardStats: React.FC = () => {
  const { isLoading } = useDashboardStats();
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showPersonalTrabajandoModal, setShowPersonalTrabajandoModal] = useState(false);
  const [showEventosModal, setShowEventosModal] = useState(false);
  const [showNodosModal, setShowNodosModal] = useState(false);
  const [showCarterasModal, setShowCarterasModal] = useState(false);
  const [semanaActual, setSemanaActual] = useState(true); // true = semana actual, false = próxima semana
  const [semanaActualTendencias, setSemanaActualTendencias] = useState(true); // true = semana actual, false = próxima semana

  // Obtener datos reales del backend
  const { data: personalData, isLoading: personalLoading } = usePersonalList(1, 100, '');
  const { data: estadisticasServicios, isLoading: serviciosLoading } = useEstadisticasServicios();
  
  // Calcular estadísticas reales de los datos del backend
  const personalList = personalData?.data?.items || [];
  const totalPersonal = personalData?.data?.total || 0;
  const personalActivo = personalList.filter(p => p.activo).length;
  
  const personalTrabajando = personalList.filter(p => p.activo).length;
  
  const personalAcreditacion = personalList.filter(p => 
    p.activo && p.comentario_estado?.toLowerCase().includes('acreditación')
  ).length;
  
  const totalEventos = 0; // TODO: Implementar carga de eventos reales desde el backend
  const eventosHoy = 0; // TODO: Implementar carga de eventos reales desde el backend

  // Usar datos reales del backend
  const serviciosData = estadisticasServicios?.data;
  const dashboardStats = {
    total_personal: totalPersonal,
    personal_activo: personalActivo,
    personal_trabajando: personalTrabajando,
    total_servicios: serviciosData?.totales?.nodos || 0,
    servicios_activos: serviciosData?.totales?.nodos || 0,
    total_eventos: totalEventos,
    eventos_hoy: eventosHoy,
    total_carteras: serviciosData?.totales?.carteras || 0,
    total_clientes: serviciosData?.totales?.clientes || 0,
  };

  // Obtener total asignado desde el resumen por cliente (misma fuente que el widget inferior)
  const { data: resumenData, isLoading: resumenLoading } = useResumenPersonalPorCliente(undefined, undefined, undefined);
  const resumenRows: any[] = resumenData?.data || [];
  const totalPersonasAsignadas = resumenRows.reduce((s, r) => s + (Number(r.total_personal) || 0), 0);


  // Función para obtener el inicio de la semana (lunes)
  const getInicioSemana = (fecha: Date) => {
    const inicio = new Date(fecha);
    const dia = inicio.getDay();
    const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar para que lunes sea 1
    inicio.setDate(diff);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  };

  // Función para generar datos de eventos por día
  const generarEventosPorDia = (esSemanaActual: boolean) => {
    const hoy = new Date();
    const inicioSemana = getInicioSemana(hoy);
    
    // Si es próxima semana, agregar 7 días
    if (!esSemanaActual) {
      inicioSemana.setDate(inicioSemana.getDate() + 7);
    }

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const eventosPorDia = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      
      // Generar datos estables basados en la fecha (no aleatorios)
      const seed = fecha.getDate() + (esSemanaActual ? 0 : 100); // Diferente seed para cada semana
      const eventos = (seed % 6) + 1; // 1-6 eventos
      const completados = Math.min(eventos, (seed % 4) + 1); // 1-4 completados, máximo eventos
      
      eventosPorDia.push({
        name: diasSemana[i],
        eventos: eventos,
        completados: completados,
        fecha: fecha.toISOString().split('T')[0]
      });
    }

    return eventosPorDia;
  };

  // Datos para gráfico de eventos por día
  const eventosPorDia = generarEventosPorDia(semanaActual);

  // Función para generar datos de tendencias de servicios por día
  const generarTendenciasServicios = (esSemanaActual: boolean) => {
    const hoy = new Date();
    const inicioSemana = getInicioSemana(hoy);
    
    // Si es próxima semana, agregar 7 días
    if (!esSemanaActual) {
      inicioSemana.setDate(inicioSemana.getDate() + 7);
    }

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const tiposServicios = [
      'Mantenimiento Industrial',
      'Servicio Spot', 
      'Servicio Integral',
      'Programa de Lubricación',
      'Levantamientos',
      'Instalaciones'
    ];
    
    const tendenciasServicios = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      
      // Generar datos estables basados en la fecha (no aleatorios)
      const seed = fecha.getDate() + (esSemanaActual ? 0 : 200); // Diferente seed para cada semana
      const totalServicios = (seed % 8) + 2; // 2-9 servicios
      const totalPersonal = (seed % 12) + 3; // 3-14 personas
      const serviciosCompletados = Math.min(totalServicios, (seed % 5) + 1); // 1-5 completados, máximo totalServicios
      
      // Generar distribución de tipos de servicios
      const serviciosPorTipo = tiposServicios.map((tipo, index) => ({
        tipo: tipo,
        cantidad: (seed + index) % 3, // 0-2 servicios por tipo
        personalAsignado: ((seed + index) % 4) + 1 // 1-4 personas por tipo
      }));

      tendenciasServicios.push({
        name: diasSemana[i],
        fecha: fecha.toISOString().split('T')[0],
        totalServicios: totalServicios,
        totalPersonal: totalPersonal,
        serviciosCompletados: serviciosCompletados,
        serviciosPorTipo: serviciosPorTipo
      });
    }

    return tendenciasServicios;
  };

  // Datos para gráfico de tendencia de servicios
  const tendenciaServicios = generarTendenciasServicios(semanaActualTendencias);

  if (isLoading || personalLoading || serviciosLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`loading-card-${index}`} className="p-6 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-center h-24">
              <LoadingSpinner size="md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Tarjetas principales con animaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="stagger-item animate-delay-100">
          <StatCard
            title="Total Personal"
            value={dashboardStats.total_personal}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            onClick={() => setShowPersonalModal(true)}
            trend={{ value: 12, isPositive: true }}
          />
        </div>
        <div className="stagger-item animate-delay-200">
          <StatCard
            title="Personal en Servicio"
            value={dashboardStats.personal_trabajando}
            icon={<Activity className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-green-500 to-green-600"
            onClick={() => setShowPersonalTrabajandoModal(true)}
            trend={{ value: 8, isPositive: true }}
          />
        </div>
        <div className="stagger-item animate-delay-300">
          <StatCard
            title="Personal Asignado"
            value={resumenLoading ? dashboardStats.total_personal : totalPersonasAsignadas}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            onClick={() => setShowPersonalModal(true)}
            trend={{ value: 5, isPositive: true }}
          />
        </div>
      </div>


      {/* Gráfico de tendencia y eventos por día */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tendencia de servicios */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Programación de Servicios</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSemanaActualTendencias(true)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    semanaActualTendencias
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Semana Actual
                </button>
                <button
                  onClick={() => setSemanaActualTendencias(false)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    !semanaActualTendencias
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Próxima Semana
                </button>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tendenciaServicios}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.name} - ${new Date(data.fecha).toLocaleDateString('es-CL')}`;
                  }
                  return value;
                }}
                formatter={(value, name) => {
                  if (name === 'totalServicios') return [`${value} servicios`, 'Total Servicios'];
                  if (name === 'totalPersonal') return [`${value} personas`, 'Personal Asignado'];
                  if (name === 'serviciosCompletados') return [`${value} servicios`, 'Servicios Completados'];
                  return [value, name];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalServicios" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
                name="Total Servicios"
              />
              <Area 
                type="monotone" 
                dataKey="totalPersonal" 
                stackId="2" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Personal Asignado"
              />
              <Area 
                type="monotone" 
                dataKey="serviciosCompletados" 
                stackId="3" 
                stroke="#F59E0B" 
                fill="#F59E0B" 
                fillOpacity={0.6}
                name="Servicios Completados"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Total Servicios</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Personal Asignado</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Servicios Completados</span>
            </div>
          </div>
        </div>

        {/* Eventos por día */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Eventos por Día</h3>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSemanaActual(true)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    semanaActual
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Semana Actual
                </button>
                <button
                  onClick={() => setSemanaActual(false)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    !semanaActual
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Próxima Semana
                </button>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eventosPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.name} - ${new Date(data.fecha).toLocaleDateString('es-CL')}`;
                  }
                  return value;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="eventos" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                name="Eventos Programados"
              />
              <Line 
                type="monotone" 
                dataKey="completados" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                name="Eventos Completados"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Eventos Programados</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Eventos Completados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stagger-item animate-delay-500">
          <StatCard
            title="Total Carteras"
            value={dashboardStats.total_carteras}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            onClick={() => setShowCarterasModal(true)}
          />
        </div>
        <div className="stagger-item animate-delay-600">
          <StatCard
            title="Total Clientes"
            value={dashboardStats.total_clientes}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            href="/servicios"
          />
        </div>
        <div className="stagger-item animate-delay-700">
          <StatCard
            title="Total Nodos"
            value={dashboardStats.total_servicios}
            icon={<Settings className="h-6 w-6 text-white" />}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
            onClick={() => setShowNodosModal(true)}
          />
        </div>
      </div>


      {/* Modal de información del personal */}
      <PersonalInfoModal
        isOpen={showPersonalModal}
        onClose={() => setShowPersonalModal(false)}
        totalPersonal={dashboardStats.total_personal}
        personalActivo={dashboardStats.personal_activo}
        personalTrabajando={dashboardStats.personal_trabajando}
        personalAcreditacion={personalAcreditacion}
      />

      {/* Modal de personal en servicio */}
      <PersonalTrabajandoModal
        isOpen={showPersonalTrabajandoModal}
        onClose={() => setShowPersonalTrabajandoModal(false)}
        personalTrabajando={personalList.filter(p => p.activo).map(p => ({
          id: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          cargo: p.cargo,
          ubicacion: p.zona_geografica || 'No especificada',
          servicioAsignado: {
            id: p.servicio_id || '1',
            nombre: 'Servicio Asignado',
            categoria: 'General',
            zonaGestion: p.zona_geografica || 'No especificada'
          },
          estadoActividad: {
            label: p.activo ? 'Trabajando' : 'Inactivo'
          }
        }))}
      />

      {/* Modal de eventos */}
      <EventosModal
        isOpen={showEventosModal}
        onClose={() => setShowEventosModal(false)}
        eventos={[]}
      />

      {/* Modal de información de nodos */}
      <NodosInfoModal
        isOpen={showNodosModal}
        onClose={() => setShowNodosModal(false)}
        totalNodos={dashboardStats.total_servicios}
      />

      {/* Modal de información de carteras */}
      <CarterasInfoModal
        isOpen={showCarterasModal}
        onClose={() => setShowCarterasModal(false)}
        totalCarteras={dashboardStats.total_carteras}
      />
    </>
  );
};