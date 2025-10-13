import React from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Settings, Activity, Clock, Users, Building2 } from 'lucide-react';
import { useNodos } from '../../hooks/useServicios';
import { useCarteras } from '../../hooks/useServicios';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Cartera, Nodo } from '../../types';

interface NodosInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalNodos: number;
}

export const NodosInfoModal: React.FC<NodosInfoModalProps> = ({
  isOpen,
  onClose,
  totalNodos
}) => {
  // Obtener datos de nodos y carteras
  const { data: nodosData, isLoading: nodosLoading } = useNodos({ limit: 100 });
  const { data: carterasData, isLoading: carterasLoading } = useCarteras({ limit: 100 });

  const nodos = nodosData?.data?.items || [];
  const carteras = carterasData?.data?.items || [];


  // Agrupar nodos por cartera
  const nodosPorCartera = carteras.map((cartera: Cartera) => ({
    cartera: cartera,
    nodos: nodos.filter((nodo: Nodo) => nodo.cartera_id === cartera.id),
    total: nodos.filter((nodo: Nodo) => nodo.cartera_id === cartera.id).length
  }));

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Información de Nodos</h2>
                <p className="text-orange-100">
                  {totalNodos} nodo{totalNodos !== 1 ? 's' : ''} registrado{totalNodos !== 1 ? 's' : ''} en el sistema
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Scorecards por Cartera */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 text-orange-500 mr-2" />
              Distribución por Cartera
            </h3>
            
            {nodosLoading || carterasLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodosPorCartera.map(({ cartera, total }: { cartera: Cartera; total: number }) => (
                  <div key={cartera.id} className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{cartera.nombre}</h4>
                      <div className="p-1 rounded bg-orange-500">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{total}</p>
                    <p className="text-xs text-gray-600">nodos</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabla de Nodos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 text-orange-500 mr-2" />
              Lista Detallada de Nodos
            </h3>
            
            {nodosLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nodo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cartera
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Creación
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {nodos.map((nodo: Nodo) => (
                        <tr key={nodo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-1 rounded bg-orange-100 mr-3">
                                <MapPin className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">{nodo.nombre}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {nodo.cliente_nombre || 'Sin asignar'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {nodo.cartera_nombre || 'Sin asignar'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(nodo.created_at).toLocaleDateString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {nodos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No hay nodos registrados</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onClose();
              window.location.href = '/servicios';
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            Ver Servicios
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NodosInfoModal;
