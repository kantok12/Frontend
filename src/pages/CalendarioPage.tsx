import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

// Función para generar fechas dentro de los próximos 15 días
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

// Datos mock para eventos del calendario (próximos 15 días)
const mockEventos = [
  {
    id: '1',
    titulo: 'Mantenimiento Sistema Minero - Planta Norte',
    fecha: proximosDias[0], // Hoy
    hora: '08:00',
    duracion: '8 horas',
    ubicacion: 'Planta Minera',
    zonaGestion: 'Minería',
    categoria: 'Mantenimiento',
    personal: ['Juan Carlos Pérez', 'Roberto Silva'],
    estado: 'en_progreso'
  },
  {
    id: '2',
    titulo: 'Servicio Spot - Emergencia Excavadora',
    fecha: proximosDias[1], // Mañana
    hora: '14:30',
    duracion: '4 horas',
    ubicacion: 'Sitio Minero',
    zonaGestion: 'Minería',
    categoria: 'Servicio Spot',
    personal: ['Patricia Vargas'],
    estado: 'programado'
  },
  {
    id: '3',
    titulo: 'Servicio Integral Industrial',
    fecha: proximosDias[2], // Día 3
    hora: '09:00',
    duracion: '12 horas',
    ubicacion: 'Planta Industrial',
    zonaGestion: 'Industria',
    categoria: 'Servicio Integral',
    personal: ['María Elena Rodríguez', 'Carlos Alberto Martínez'],
    estado: 'programado'
  },
  {
    id: '4',
    titulo: 'Levantamiento Sistemas Existentes',
    fecha: proximosDias[4], // Día 5
    hora: '10:00',
    duracion: '10 horas',
    ubicacion: 'Centro Industrial',
    zonaGestion: 'Industria',
    categoria: 'Levantamientos',
    personal: ['Ana Sofía García', 'Luis Fernando Ramírez'],
    estado: 'programado'
  },
  {
    id: '5',
    titulo: 'Instalación Sistema Automático',
    fecha: proximosDias[6], // Día 7
    hora: '07:00',
    duracion: '16 horas',
    ubicacion: 'Planta Industrial',
    zonaGestion: 'Industria',
    categoria: 'Instalaciones',
    personal: ['Carmen López', 'Roberto Silva', 'Patricia Vargas'],
    estado: 'programado'
  },
  {
    id: '6',
    titulo: 'Programa Lubricación Mensual',
    fecha: proximosDias[8], // Día 9
    hora: '06:00',
    duracion: '6 horas',
    ubicacion: 'Centro Industrial',
    zonaGestion: 'Industria',
    categoria: 'Programa de Lubricación',
    personal: ['Carlos Alberto Martínez', 'Ana Sofía García'],
    estado: 'programado'
  },
  {
    id: '7',
    titulo: 'Mantenimiento Preventivo Equipos Mineros',
    fecha: proximosDias[10], // Día 11
    hora: '08:30',
    duracion: '8 horas',
    ubicacion: 'Planta Minera',
    zonaGestion: 'Minería',
    categoria: 'Mantenimiento',
    personal: ['Luis Fernando Ramírez', 'Roberto Silva'],
    estado: 'programado'
  },
  {
    id: '8',
    titulo: 'Levantamiento Técnico Final',
    fecha: proximosDias[12], // Día 13
    hora: '09:30',
    duracion: '10 horas',
    ubicacion: 'Laboratorio Técnico',
    zonaGestion: 'Industria',
    categoria: 'Levantamientos',
    personal: ['Patricia Vargas', 'Carmen López'],
    estado: 'programado'
  },
  {
    id: '9',
    titulo: 'Servicio Spot - Mantenimiento Urgente',
    fecha: proximosDias[14], // Día 15
    hora: '15:00',
    duracion: '4 horas',
    ubicacion: 'Sitio Minero',
    zonaGestion: 'Minería',
    categoria: 'Servicio Spot',
    personal: ['Juan Carlos Pérez'],
    estado: 'programado'
  }
];

export const CalendarioPage: React.FC = () => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState<'15dias' | 'semana' | 'dia'>('15dias');

  // Función para formatear fecha legible
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    // Verificar si es hoy o mañana
    if (fecha.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    } else if (fecha.toDateString() === manana.toDateString()) {
      return 'Mañana';
    } else {
      return fecha.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  // Función para obtener el rango de fechas actual
  const getRangoFechas = () => {
    const hoy = new Date();
    const fechaFinal = new Date(hoy);
    fechaFinal.setDate(hoy.getDate() + 14);
    
    return `${hoy.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${fechaFinal.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_progreso':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getZonaColor = (zona: string) => {
    return zona === 'Minería' 
      ? 'bg-orange-100 text-orange-800 border-orange-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 fade-in">
        <h1 className="text-3xl font-bold text-gray-900">Calendario de Servicios</h1>
        <button className="btn-primary hover-grow">
          <Plus className="h-4 w-4" />
          Nuevo Evento
        </button>
      </div>

      {/* Controles del calendario */}
      <div className="card hover-lift slide-up animate-delay-200 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {getRangoFechas()}
            </h2>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            {['15dias', 'semana', 'dia'].map((vista) => (
              <button
                key={vista}
                onClick={() => setVistaCalendario(vista as '15dias' | 'semana' | 'dia')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaCalendario === vista
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {vista === '15dias' ? '15 Días' : vista.charAt(0).toUpperCase() + vista.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen por zona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 slide-up animate-delay-300">
        {/* Eventos Minería */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Eventos Minería</h3>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {mockEventos.filter(e => e.zonaGestion === 'Minería').length}
          </div>
          <div className="text-sm text-gray-600">
            Eventos próximos 15 días
          </div>
        </div>

        {/* Eventos Industria */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Eventos Industria</h3>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {mockEventos.filter(e => e.zonaGestion === 'Industria').length}
          </div>
          <div className="text-sm text-gray-600">
            Eventos próximos 15 días
          </div>
        </div>
      </div>

      {/* Lista de eventos */}
      <div className="slide-up animate-delay-400">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Próximos Eventos ({mockEventos.length} programados)
          </h2>
        </div>

        <div className="space-y-4">
          {mockEventos.map((evento, index) => (
            <div key={evento.id} className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 stagger-item animate-delay-${(index + 1) * 100}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {evento.titulo}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      {formatearFecha(evento.fecha)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-purple-500" />
                      {evento.hora} ({evento.duracion})
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-green-500" />
                      {evento.ubicacion}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-orange-500" />
                      {evento.personal.length} personas
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getZonaColor(evento.zonaGestion)}`}>
                      {evento.zonaGestion}
                    </span>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      evento.zonaGestion === 'Minería' 
                        ? 'bg-orange-50 text-orange-700 border border-orange-300' 
                        : 'bg-blue-50 text-blue-700 border border-blue-300'
                    }`}>
                      {evento.categoria}
                    </span>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getEstadoColor(evento.estado)}`}>
                      {evento.estado === 'programado' ? 'Programado' : 
                       evento.estado === 'en_progreso' ? 'En Progreso' : 
                       evento.estado === 'completado' ? 'Completado' : 'Cancelado'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Personal Asignado</h4>
                    <div className="flex flex-wrap gap-1">
                      {evento.personal.map((persona, idx) => (
                        <span key={idx} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {persona}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
