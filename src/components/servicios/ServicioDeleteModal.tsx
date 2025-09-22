import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ServicioDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  servicio: any;
}

export const ServicioDeleteModal: React.FC<ServicioDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  servicio
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 1000));
      onConfirm();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al eliminar servicio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !servicio) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Eliminar Servicio</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            ¿Está seguro de que desea eliminar el siguiente servicio?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
            <h3 className="font-semibold text-gray-800 mb-2">{servicio.nombre}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Zona:</span> {servicio.zonaGestion}</p>
              <p><span className="font-medium">Categoría:</span> {servicio.categoria}</p>
              <p><span className="font-medium">Cartera:</span> {servicio.cartera}</p>
              <p><span className="font-medium">Lugar:</span> {servicio.lugar}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Esta acción no se puede deshacer.</p>
                <p>Se eliminará permanentemente toda la información del servicio, incluyendo:</p>
                <ul className="list-disc list-inside mt-1 ml-4">
                  <li>Datos del servicio</li>
                  <li>Asignaciones de personal</li>
                  <li>Actividades programadas</li>
                  <li>Historial de actualizaciones</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Servicio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
