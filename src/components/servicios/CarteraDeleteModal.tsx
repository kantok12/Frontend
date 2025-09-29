import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Users, Building } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CarteraDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (carteraId: string) => void;
  cartera: any;
}

export const CarteraDeleteModal: React.FC<CarteraDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  cartera
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const expectedText = 'ELIMINAR';

  const handleConfirm = async () => {
    if (confirmText !== expectedText) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onConfirm(cartera.id);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al eliminar cartera:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen || !cartera) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-red-600 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2" />
            Eliminar Cartera
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Información de la Cartera */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 capitalize">
                  {cartera.name?.replace('_', ' ') || 'Cartera'}
                </h3>
                <p className="text-sm text-gray-600">ID: {cartera.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-gray-600">Clientes:</span>
                <span className="font-semibold ml-1">{cartera.total_clientes}</span>
              </div>
              <div className="flex items-center">
                <Building className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-gray-600">Nodos:</span>
                <span className="font-semibold ml-1">{cartera.total_nodos}</span>
              </div>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 font-semibold mb-2">¡Advertencia!</h4>
                <p className="text-red-700 text-sm mb-2">
                  Esta acción eliminará permanentemente la cartera y todos sus datos asociados:
                </p>
                <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                  <li>Todos los clientes asignados a esta cartera</li>
                  <li>Historial de servicios y actividades</li>
                  <li>Configuraciones y preferencias</li>
                  <li>Reportes y estadísticas asociadas</li>
                </ul>
                <p className="text-red-800 font-semibold mt-2">
                  Esta acción NO se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmación */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm mb-3">
              Para confirmar la eliminación, escribe <strong>ELIMINAR</strong> en el campo de abajo:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribir ELIMINAR"
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || confirmText !== expectedText}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Cartera
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
