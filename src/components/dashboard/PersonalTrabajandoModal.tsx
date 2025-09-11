import React from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Activity, MapPin, Briefcase } from 'lucide-react';

interface PersonalTrabajando {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string;
  ubicacion: string;
  servicioAsignado: {
    id: string;
    nombre: string;
    categoria: string;
    zonaGestion: string;
  };
  estadoActividad: {
    label: string;
  };
}

interface PersonalTrabajandoModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalTrabajando: PersonalTrabajando[];
}

export const PersonalTrabajandoModal: React.FC<PersonalTrabajandoModalProps> = ({
  isOpen,
  onClose,
  personalTrabajando
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Personal en Servicio</h2>
                <p className="text-green-100">
                  {personalTrabajando.length} persona{personalTrabajando.length !== 1 ? 's' : ''} en servicio actualmente
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {personalTrabajando.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay personal en servicio</h3>
              <p className="text-gray-500">Actualmente no hay personas en servicio en el sistema.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalTrabajando.map((persona) => (
                <div
                  key={persona.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {persona.nombre} {persona.apellido}
                        </h3>
                        <p className="text-sm text-gray-600">{persona.cargo}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>{persona.estadoActividad.label}</span>
                    </div>
                  </div>

                  {/* Información del servicio asignado */}
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Servicio Asignado</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-blue-800">{persona.servicioAsignado.nombre}</p>
                        <p className="text-sm text-blue-700">{persona.servicioAsignado.categoria}</p>
                        <p className="text-xs text-blue-600">{persona.servicioAsignado.zonaGestion}</p>
                      </div>
                    </div>

                    {/* Ubicación */}
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{persona.ubicacion}</span>
                    </div>
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
              <span className="font-medium">Total en servicio:</span> {personalTrabajando.length} persona{personalTrabajando.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
