import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, Activity, CheckCircle, AlertCircle, Play, Users } from 'lucide-react';

interface PersonaAsignada {
  id: string;
  nombre: string;
}

interface Evento {
  id: string;
  fecha: string;
  estado: string;
  tipo?: string;
  ubicacion?: string;
  horaInicio?: string;
  horaFin?: string;
  descripcion?: string;
  prioridad?: string;
  personasAsignadas?: PersonaAsignada[];
}

interface EventosModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventos: Evento[];
}

export const EventosModal: React.FC<EventosModalProps> = ({
  isOpen,
  onClose,
  eventos
}) => {
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  // Función para formatear la fecha
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);
    
    if (fecha === hoy.toISOString().split('T')[0]) {
      return 'Hoy';
    } else if (fecha === mañana.toISOString().split('T')[0]) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
  };

  // Función para obtener el ícono según el estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'en_progreso':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'programado':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelado':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'programado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el texto del estado
  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'en_progreso':
        return 'En Progreso';
      case 'programado':
        return 'Programado';
      case 'completado':
        return 'Completado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  };

  // Funciones para manejar el tooltip
  const handleMouseEnter = (eventoId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setTooltipVisible(eventoId);
  };

  const handleMouseLeave = () => {
    setTooltipVisible(null);
  };

  // Agrupar eventos por fecha
  const eventosPorFecha = eventos.reduce((acc, evento) => {
    const fecha = evento.fecha;
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(evento);
    return acc;
  }, {} as Record<string, Evento[]>);

  // Ordenar fechas
  const fechasOrdenadas = Object.keys(eventosPorFecha).sort();

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Eventos (15 días)</h2>
                <p className="text-blue-100">
                  {eventos.length} evento{eventos.length !== 1 ? 's' : ''} programado{eventos.length !== 1 ? 's' : ''} en los próximos 15 días
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {eventos.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos programados</h3>
              <p className="text-gray-500">No hay eventos programados para los próximos 15 días.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {fechasOrdenadas.map((fecha) => (
                <div key={fecha} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Header de la fecha */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {formatearFecha(fecha)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {eventosPorFecha[fecha].length} evento{eventosPorFecha[fecha].length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Lista de eventos para esta fecha */}
                  <div className="divide-y divide-gray-200">
                    {eventosPorFecha[fecha].map((evento) => (
                      <div key={evento.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getEstadoIcon(evento.estado)}
                              <h4 className="font-medium text-gray-900">
                                {evento.tipo || 'Evento de Servicio'}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getEstadoColor(evento.estado)}`}>
                                {getEstadoTexto(evento.estado)}
                              </span>
                            </div>
                            
                            {evento.descripcion && (
                              <p className="text-sm text-gray-600 mb-2">{evento.descripcion}</p>
                            )}

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {evento.horaInicio && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{evento.horaInicio}{evento.horaFin && ` - ${evento.horaFin}`}</span>
                                </div>
                              )}
                              
                              {evento.ubicacion && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{evento.ubicacion}</span>
                                </div>
                              )}

                              {evento.prioridad && (
                                <div className="flex items-center space-x-1">
                                  <Activity className="h-4 w-4" />
                                  <span className="capitalize">{evento.prioridad}</span>
                                </div>
                              )}

                              {evento.personasAsignadas && evento.personasAsignadas.length > 0 && (
                                <div 
                                  className="flex items-center space-x-1 relative"
                                  onMouseEnter={(e) => handleMouseEnter(evento.id, e)}
                                  onMouseLeave={handleMouseLeave}
                                >
                                  <Users className="h-4 w-4" />
                                  <span className="font-medium text-blue-600 cursor-help">
                                    {evento.personasAsignadas.length} persona{evento.personasAsignadas.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total de eventos:</span> {eventos.length} en los próximos 15 días
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Tooltip para mostrar nombres de personas */}
      {tooltipVisible && (
        <div
          className="fixed z-[100000] bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="font-semibold mb-1">Personas Asignadas:</div>
          <div className="space-y-1">
            {eventos.find(e => e.id === tooltipVisible)?.personasAsignadas?.map((persona) => (
              <div key={persona.id} className="text-xs">
                • {persona.nombre}
              </div>
            ))}
          </div>
          {/* Flecha del tooltip */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          />
        </div>
      )}
    </div>,
    document.body
  );
};
