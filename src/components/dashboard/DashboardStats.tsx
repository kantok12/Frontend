import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar,
  Settings, 
  Activity
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useDashboard';
import { usePersonalList } from '../../hooks/usePersonal';
import { useEstadisticasServicios } from '../../hooks/useServicios';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PersonalInfoModal } from './PersonalInfoModal';
import { PersonalTrabajandoModal } from './PersonalTrabajandoModal';
import { EventosModal } from './EventosModal';

// Notas: se mantendrán solo datos de eventos mock hasta contar con endpoint real

// Datos mock de eventos del calendario (próximos 15 días)
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

const proximosDias = getProximosDias();
const mockEventos = [
  { 
    id: '1', 
    fecha: proximosDias[0], 
    estado: 'en_progreso',
    tipo: 'Mantenimiento Industrial',
    ubicacion: 'Planta Minera Norte',
    horaInicio: '08:00',
    horaFin: '16:00',
    descripcion: 'Mantenimiento preventivo de equipos críticos',
    prioridad: 'alta',
    personasAsignadas: [
      { id: '1', nombre: 'Juan Carlos Pérez' },
      { id: '3', nombre: 'Carlos Alberto Martínez' }
    ]
  },
  { 
    id: '2', 
    fecha: proximosDias[1], 
    estado: 'programado',
    tipo: 'Servicio Spot',
    ubicacion: 'Zona Industrial Sur',
    horaInicio: '09:00',
    horaFin: '13:00',
    descripcion: 'Inspección de equipos de lubricación',
    prioridad: 'media',
    personasAsignadas: [
      { id: '2', nombre: 'María Elena Rodríguez' }
    ]
  },
  { 
    id: '3', 
    fecha: proximosDias[2], 
    estado: 'programado',
    tipo: 'Servicio Integral',
    ubicacion: 'Planta de Procesamiento',
    horaInicio: '07:30',
    horaFin: '15:30',
    descripcion: 'Servicio completo de mantenimiento',
    prioridad: 'alta',
    personasAsignadas: [
      { id: '3', nombre: 'Carlos Alberto Martínez' },
      { id: '8', nombre: 'Carmen López Torres' },
      { id: '7', nombre: 'Roberto Silva Mendoza' }
    ]
  },
  { 
    id: '4', 
    fecha: proximosDias[4], 
    estado: 'programado',
    tipo: 'Programa de Lubricación',
    ubicacion: 'Área de Maquinaria',
    horaInicio: '10:00',
    horaFin: '14:00',
    descripcion: 'Aplicación de programa de lubricación preventiva',
    prioridad: 'media',
    personasAsignadas: [
      { id: '6', nombre: 'Patricia Vargas Castro' },
      { id: '5', nombre: 'Luis Fernando Ramírez' }
    ]
  },
  { 
    id: '5', 
    fecha: proximosDias[6], 
    estado: 'programado',
    tipo: 'Levantamientos',
    ubicacion: 'Sector de Transporte',
    horaInicio: '08:30',
    horaFin: '12:30',
    descripcion: 'Levantamiento de equipos pesados',
    prioridad: 'baja',
    personasAsignadas: [
      { id: '5', nombre: 'Luis Fernando Ramírez' }
    ]
  },
  { 
    id: '6', 
    fecha: proximosDias[8], 
    estado: 'programado',
    tipo: 'Instalaciones',
    ubicacion: 'Nueva Línea de Producción',
    horaInicio: '09:00',
    horaFin: '17:00',
    descripcion: 'Instalación de nuevos equipos',
    prioridad: 'alta',
    personasAsignadas: [
      { id: '1', nombre: 'Juan Carlos Pérez' },
      { id: '3', nombre: 'Carlos Alberto Martínez' },
      { id: '7', nombre: 'Roberto Silva Mendoza' },
      { id: '8', nombre: 'Carmen López Torres' }
    ]
  },
  { 
    id: '7', 
    fecha: proximosDias[10], 
    estado: 'programado',
    tipo: 'Mantenimiento Industrial',
    ubicacion: 'Planta Minera Sur',
    horaInicio: '08:00',
    horaFin: '16:00',
    descripcion: 'Mantenimiento de sistemas hidráulicos',
    prioridad: 'media',
    personasAsignadas: [
      { id: '1', nombre: 'Juan Carlos Pérez' },
      { id: '6', nombre: 'Patricia Vargas Castro' }
    ]
  },
  { 
    id: '8', 
    fecha: proximosDias[12], 
    estado: 'programado',
    tipo: 'Servicio Spot',
    ubicacion: 'Área de Almacenamiento',
    horaInicio: '11:00',
    horaFin: '15:00',
    descripcion: 'Revisión de equipos de almacenamiento',
    prioridad: 'baja',
    personasAsignadas: [
      { id: '2', nombre: 'María Elena Rodríguez' },
      { id: '7', nombre: 'Roberto Silva Mendoza' }
    ]
  },
  { 
    id: '9', 
    fecha: proximosDias[14], 
    estado: 'programado',
    tipo: 'Servicio Integral',
    ubicacion: 'Planta Principal',
    horaInicio: '07:00',
    horaFin: '15:00',
    descripcion: 'Servicio completo de mantenimiento general',
    prioridad: 'alta',
    personasAsignadas: [
      { id: '3', nombre: 'Carlos Alberto Martínez' },
      { id: '8', nombre: 'Carmen López Torres' },
      { id: '5', nombre: 'Luis Fernando Ramírez' }
    ]
  }
];

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

export const DashboardStats: React.FC = () => {
  const { isLoading } = useDashboardStats();
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showPersonalTrabajandoModal, setShowPersonalTrabajandoModal] = useState(false);
  const [showEventosModal, setShowEventosModal] = useState(false);

  // Obtener datos reales del backend
  const { data: personalData, isLoading: personalLoading } = usePersonalList(1, 100, ''); // Obtener todos los registros
  const { data: estadisticasServicios, isLoading: serviciosLoading } = useEstadisticasServicios();
  
  // Calcular estadísticas reales de los datos del backend
  const personalList = personalData?.data?.items || [];
  const totalPersonal = personalData?.data?.total || 0;
  const personalActivo = personalList.filter(p => p.activo).length;
  
  // Para personal trabajando, usamos el campo activo como indicador
  // ya que no tenemos un campo específico de estado de actividad
  const personalTrabajando = personalList.filter(p => p.activo).length;
  
  // Para personal en acreditación, usamos el comentario de estado
  const personalAcreditacion = personalList.filter(p => 
    p.activo && p.comentario_estado?.toLowerCase().includes('acreditación')
  ).length;
  
  const totalEventos = mockEventos.length;
  const eventosHoy = mockEventos.filter(e => {
    const hoy = new Date().toISOString().split('T')[0];
    return e.fecha === hoy;
  }).length;

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

  if (isLoading || personalLoading || serviciosLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`loading-card-${index}`} className="p-6 rounded-lg border border-gray-200 bg-white">
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
      {/* Gráfico simple: comparación de totales */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Resumen de Servicios</h3>
          <Settings className="h-5 w-5 text-gray-400" />
        </div>
        {(() => {
          const chartData = [
            { label: 'Carteras', value: dashboardStats.total_carteras, color: 'bg-purple-500' },
            { label: 'Clientes', value: dashboardStats.total_clientes, color: 'bg-indigo-500' },
            { label: 'Nodos', value: dashboardStats.total_servicios, color: 'bg-orange-500' },
          ];
          const maxValue = Math.max(1, ...chartData.map(d => d.value));
          return (
            <div className="space-y-3">
              {chartData.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-1">
                    <span>{d.label}</span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded">
                    <div
                      className={`h-3 ${d.color} rounded`}
                      style={{ width: `${(d.value / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stagger-item animate-delay-100">
          <div 
            className="p-6 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowPersonalModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Personal</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.total_personal}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-500">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="stagger-item animate-delay-200">
          <div 
            className="p-6 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowPersonalTrabajandoModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Personal en Servicio</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.personal_trabajando}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="stagger-item animate-delay-300">
          <div 
            className="p-6 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowEventosModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos (15 días)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardStats.total_eventos}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="stagger-item animate-delay-400">
          <StatCard
            title="Total Nodos"
            value={dashboardStats.total_servicios}
            icon={<Settings className="h-6 w-6 text-white" />}
            color="bg-orange-500"
            href="/servicios"
          />
        </div>
      </div>

      {/* Segunda fila de estadísticas de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="stagger-item animate-delay-500">
          <StatCard
            title="Total Carteras"
            value={dashboardStats.total_carteras}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-purple-500"
            href="/servicios"
          />
        </div>
        <div className="stagger-item animate-delay-600">
          <StatCard
            title="Total Clientes"
            value={dashboardStats.total_clientes}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-indigo-500"
            href="/servicios"
          />
        </div>
        <div className="stagger-item animate-delay-700">
          <StatCard
            title="Servicios Activos"
            value={dashboardStats.servicios_activos}
            icon={<Activity className="h-6 w-6 text-white" />}
            color="bg-green-500"
            href="/servicios"
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
        eventos={mockEventos}
      />
    </>
  );
};
