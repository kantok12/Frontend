import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar,
  Settings, 
  Activity
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useDashboard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PersonalInfoModal } from './PersonalInfoModal';

// Importar datos mock reales de las páginas
// Datos mock del personal (copiados de PersonalPage.tsx)
const mockPersonal = [
  {
    id: '1',
    nombre: 'Juan Carlos',
    apellido: 'Pérez González',
    cargo: 'Ingeniero IMC',
    ubicacion: 'Santiago',
    activo: true,
    estadoActividad: { label: 'Trabajando' }
  },
  {
    id: '2',
    nombre: 'María Elena',
    apellido: 'Rodríguez López',
    cargo: 'Ingeniero de Aplicaciones',
    ubicacion: 'Valparaíso',
    activo: true,
    estadoActividad: { label: 'En Reunión' }
  },
  {
    id: '3',
    nombre: 'Carlos Alberto',
    apellido: 'Martínez Silva',
    cargo: 'Ingeniero en Servicio',
    ubicacion: 'Concepción',
    activo: true,
    estadoActividad: { label: 'Trabajando' }
  },
  {
    id: '4',
    nombre: 'Ana Sofía',
    apellido: 'García Fernández',
    cargo: 'Técnico Nivel 3',
    ubicacion: 'La Serena',
    activo: false,
    estadoActividad: { label: 'Licencia Médica' }
  },
  {
    id: '5',
    nombre: 'Luis Fernando',
    apellido: 'Ramírez Morales',
    cargo: 'Capataz',
    ubicacion: 'Santiago',
    activo: true,
    estadoActividad: { label: 'En Descanso' }
  },
  {
    id: '6',
    nombre: 'Patricia',
    apellido: 'Vargas Castro',
    cargo: 'Técnico Nivel 2',
    ubicacion: 'Valparaíso',
    activo: true,
    estadoActividad: { label: 'Capacitación' }
  },
  {
    id: '7',
    nombre: 'Roberto',
    apellido: 'Silva Mendoza',
    cargo: 'Técnico Nivel 1',
    ubicacion: 'Concepción',
    activo: true,
    estadoActividad: { label: 'Trabajando' }
  },
  {
    id: '8',
    nombre: 'Carmen',
    apellido: 'López Torres',
    cargo: 'Ingeniero IMC',
    ubicacion: 'La Serena',
    activo: true,
    estadoActividad: { label: 'Trabajando' }
  }
];

// Datos mock de servicios (copiados de ServiciosPage.tsx)
const mockServicios = [
  { id: '1', zonaGestion: 'Minería', categoria: 'Mantenimiento', activo: true },
  { id: '2', zonaGestion: 'Minería', categoria: 'Servicio Spot', activo: true },
  { id: '3', zonaGestion: 'Industria', categoria: 'Servicio Integral', activo: true },
  { id: '4', zonaGestion: 'Industria', categoria: 'Programa de Lubricación', activo: true },
  { id: '5', zonaGestion: 'Industria', categoria: 'Levantamientos', activo: true },
  { id: '6', zonaGestion: 'Industria', categoria: 'Instalaciones', activo: true }
];

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
  { id: '1', fecha: proximosDias[0], estado: 'en_progreso' },
  { id: '2', fecha: proximosDias[1], estado: 'programado' },
  { id: '3', fecha: proximosDias[2], estado: 'programado' },
  { id: '4', fecha: proximosDias[4], estado: 'programado' },
  { id: '5', fecha: proximosDias[6], estado: 'programado' },
  { id: '6', fecha: proximosDias[8], estado: 'programado' },
  { id: '7', fecha: proximosDias[10], estado: 'programado' },
  { id: '8', fecha: proximosDias[12], estado: 'programado' },
  { id: '9', fecha: proximosDias[14], estado: 'programado' }
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
  const { data: stats, isLoading, error } = useDashboardStats();
  const [showPersonalModal, setShowPersonalModal] = useState(false);

  // Calcular estadísticas reales de las tablas existentes
  const totalPersonal = mockPersonal.length;
  const personalActivo = mockPersonal.filter(p => p.activo).length;
  const personalTrabajando = mockPersonal.filter(p => 
    p.activo && p.estadoActividad.label === 'Trabajando'
  ).length;
  const personalAcreditacion = mockPersonal.filter(p => 
    p.activo && p.estadoActividad.label === 'En Acreditación'
  ).length;
  
  const totalServicios = mockServicios.length;
  const serviciosActivos = mockServicios.filter(s => s.activo).length;
  
  const totalEventos = mockEventos.length;
  const eventosHoy = mockEventos.filter(e => {
    const hoy = new Date().toISOString().split('T')[0];
    return e.fecha === hoy;
  }).length;

  // Usar datos reales calculados de las tablas
  const dashboardStats = {
    total_personal: totalPersonal,
    personal_activo: personalActivo,
    personal_trabajando: personalTrabajando,
    total_servicios: totalServicios,
    servicios_activos: serviciosActivos,
    total_eventos: totalEventos,
    eventos_hoy: eventosHoy,
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-6 rounded-lg border border-gray-200 bg-white">
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
          <StatCard
            title="Personal Trabajando"
            value={dashboardStats.personal_trabajando}
            icon={<Activity className="h-6 w-6 text-white" />}
            color="bg-green-500"
          />
        </div>
        <div className="stagger-item animate-delay-300">
          <StatCard
            title="Eventos (15 días)"
            value={dashboardStats.total_eventos}
            icon={<Calendar className="h-6 w-6 text-white" />}
            color="bg-blue-500"
            href="/calendario"
          />
        </div>
        <div className="stagger-item animate-delay-400">
          <StatCard
            title="Total Servicios"
            value={dashboardStats.total_servicios}
            icon={<Settings className="h-6 w-6 text-white" />}
            color="bg-orange-500"
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
    </>
  );
};
