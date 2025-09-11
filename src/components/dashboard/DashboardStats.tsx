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
import { PersonalTrabajandoModal } from './PersonalTrabajandoModal';
import { EventosModal } from './EventosModal';

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
    estadoActividad: { label: 'Trabajando' },
    servicioAsignado: {
      id: '1',
      nombre: 'Mantenimiento Industrial',
      categoria: 'Mantenimiento',
      zonaGestion: 'Minería'
    }
  },
  {
    id: '2',
    nombre: 'María Elena',
    apellido: 'Rodríguez López',
    cargo: 'Ingeniero de Aplicaciones',
    ubicacion: 'Valparaíso',
    activo: true,
    estadoActividad: { label: 'En Reunión' },
    servicioAsignado: {
      id: '2',
      nombre: 'Servicio Spot',
      categoria: 'Servicio Spot',
      zonaGestion: 'Minería'
    }
  },
  {
    id: '3',
    nombre: 'Carlos Alberto',
    apellido: 'Martínez Silva',
    cargo: 'Ingeniero en Servicio',
    ubicacion: 'Concepción',
    activo: true,
    estadoActividad: { label: 'Trabajando' },
    servicioAsignado: {
      id: '3',
      nombre: 'Servicio Integral',
      categoria: 'Servicio Integral',
      zonaGestion: 'Industria'
    }
  },
  {
    id: '4',
    nombre: 'Ana Sofía',
    apellido: 'García Fernández',
    cargo: 'Técnico Nivel 3',
    ubicacion: 'La Serena',
    activo: false,
    estadoActividad: { label: 'Licencia Médica' },
    servicioAsignado: {
      id: '4',
      nombre: 'Programa de Lubricación',
      categoria: 'Programa de Lubricación',
      zonaGestion: 'Industria'
    }
  },
  {
    id: '5',
    nombre: 'Luis Fernando',
    apellido: 'Ramírez Morales',
    cargo: 'Capataz',
    ubicacion: 'Santiago',
    activo: true,
    estadoActividad: { label: 'En Descanso' },
    servicioAsignado: {
      id: '5',
      nombre: 'Levantamientos',
      categoria: 'Levantamientos',
      zonaGestion: 'Industria'
    }
  },
  {
    id: '6',
    nombre: 'Patricia',
    apellido: 'Vargas Castro',
    cargo: 'Técnico Nivel 2',
    ubicacion: 'Valparaíso',
    activo: true,
    estadoActividad: { label: 'Capacitación' },
    servicioAsignado: {
      id: '6',
      nombre: 'Instalaciones',
      categoria: 'Instalaciones',
      zonaGestion: 'Industria'
    }
  },
  {
    id: '7',
    nombre: 'Roberto',
    apellido: 'Silva Mendoza',
    cargo: 'Técnico Nivel 1',
    ubicacion: 'Concepción',
    activo: true,
    estadoActividad: { label: 'Trabajando' },
    servicioAsignado: {
      id: '1',
      nombre: 'Mantenimiento Industrial',
      categoria: 'Mantenimiento',
      zonaGestion: 'Minería'
    }
  },
  {
    id: '8',
    nombre: 'Carmen',
    apellido: 'López Torres',
    cargo: 'Ingeniero IMC',
    ubicacion: 'La Serena',
    activo: true,
    estadoActividad: { label: 'Trabajando' },
    servicioAsignado: {
      id: '3',
      nombre: 'Servicio Integral',
      categoria: 'Servicio Integral',
      zonaGestion: 'Industria'
    }
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

  // Calcular estadísticas reales de las tablas existentes
  const totalPersonal = mockPersonal.length;
  const personalActivo = mockPersonal.filter(p => p.activo).length;
  const personalTrabajando = mockPersonal.filter(p => 
    p.activo && p.estadoActividad.label === 'Trabajando'
  ).length;
  const personalAcreditacion = mockPersonal.filter(p => 
    p.activo && p.estadoActividad.label === 'En Acreditación'
  ).length;
  
  
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
    total_servicios: mockServicios.length,
    servicios_activos: mockServicios.filter(s => s.activo).length,
    total_eventos: totalEventos,
    eventos_hoy: eventosHoy,
  };

  if (isLoading) {
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

      {/* Modal de personal en servicio */}
      <PersonalTrabajandoModal
        isOpen={showPersonalTrabajandoModal}
        onClose={() => setShowPersonalTrabajandoModal(false)}
        personalTrabajando={mockPersonal.filter(p => 
          p.activo && p.estadoActividad.label === 'Trabajando'
        )}
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
