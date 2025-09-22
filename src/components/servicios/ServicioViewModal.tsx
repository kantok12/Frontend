import React from 'react';
import { X, MapPin, Clock, Calendar, Users, FileText, Settings } from 'lucide-react';

interface ServicioViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicio: any;
}

export const ServicioViewModal: React.FC<ServicioViewModalProps> = ({
  isOpen,
  onClose,
  servicio
}) => {
  if (!isOpen || !servicio) return null;

  const getZonaColor = (zona: string) => {
    return zona === 'Minería' ? 'text-orange-600 bg-orange-100' : 'text-blue-600 bg-blue-100';
  };

  const getEstadoColor = (activo: boolean) => {
    return activo ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getZonaColor(servicio.zonaGestion)}`}>
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{servicio.nombre}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getZonaColor(servicio.zonaGestion)}`}>
                  {servicio.zonaGestion}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(servicio.activo)}`}>
                  {servicio.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-6">
          {/* Información General */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Descripción</label>
                <p className="text-gray-900 mt-1">{servicio.descripcion}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Categoría</label>
                <p className="text-gray-900 mt-1">{servicio.categoria}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Cartera</label>
                <p className="text-gray-900 mt-1">{servicio.cartera}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Lugar</label>
                <p className="text-gray-900 mt-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {servicio.lugar}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles Técnicos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Detalles Técnicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Duración</label>
                <p className="text-gray-900 mt-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {servicio.duracion_horas} horas
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tiempo de Planificación</label>
                <p className="text-gray-900 mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {servicio.tiempoPlanificacion}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Personal Requerido</label>
                <p className="text-gray-900 mt-1 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {servicio.personalRequerido} personas
                </p>
              </div>
            </div>
          </div>


          {/* Actividades */}
          {servicio.diasActividad && servicio.diasActividad.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Actividades Programadas
              </h3>
              <div className="space-y-3">
                {servicio.diasActividad.map((actividad: any, index: number) => (
                  <div key={`actividad-${actividad.dia}-${index}`} className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{actividad.dia}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{actividad.actividad}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                <p className="text-gray-900 mt-1">
                  {new Date(servicio.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Última Actualización</label>
                <p className="text-gray-900 mt-1">
                  {new Date(servicio.updated_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
