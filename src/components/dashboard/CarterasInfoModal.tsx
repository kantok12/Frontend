import React from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Users, MapPin, Activity, Clock, Briefcase } from 'lucide-react';
import { useCarteras } from '../../hooks/useServicios';
import { useClientes } from '../../hooks/useServicios';
import { useNodos } from '../../hooks/useServicios';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Cartera, Cliente, Nodo } from '../../types';

interface CarterasInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCarteras: number;
}

export const CarterasInfoModal: React.FC<CarterasInfoModalProps> = ({
  isOpen,
  onClose,
  totalCarteras
}) => {
  // Obtener datos de carteras, clientes y nodos
  const { data: carterasData, isLoading: carterasLoading } = useCarteras({ limit: 100 });
  const { data: clientesData, isLoading: clientesLoading } = useClientes({ limit: 100 });
  const { data: nodosData, isLoading: nodosLoading } = useNodos({ limit: 100 });

  const carteras = carterasData?.data?.items || [];
  const clientes = clientesData?.data?.items || [];
  const nodos = nodosData?.data?.items || [];


  // Calcular estadísticas por cartera
  const carterasConEstadisticas = carteras.map((cartera: Cartera) => {
    const clientesCartera = clientes.filter((cliente: Cliente) => cliente.cartera_id === cartera.id);
    const nodosCartera = nodos.filter((nodo: Nodo) => nodo.cartera_id === cartera.id);
    
    return {
      ...cartera,
      total_clientes: clientesCartera.length,
      total_nodos: nodosCartera.length
    };
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Información de Carteras</h2>
                <p className="text-purple-100">
                  {totalCarteras} cartera{totalCarteras !== 1 ? 's' : ''} registrada{totalCarteras !== 1 ? 's' : ''} en el sistema
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Scorecards de Carteras */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 text-purple-500 mr-2" />
              Resumen por Cartera
            </h3>
            
            {carterasLoading || clientesLoading || nodosLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carterasConEstadisticas.map((cartera: any) => (
                  <div key={cartera.id} className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 text-sm">{cartera.nombre}</h4>
                      <div className="p-1 rounded bg-purple-500">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-xs text-gray-600">Clientes</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{cartera.total_clientes}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-orange-500 mr-2" />
                          <span className="text-xs text-gray-600">Nodos</span>
                        </div>
                        <span className="text-sm font-semibold text-orange-600">{cartera.total_nodos}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-purple-200">
                      <p className="text-xs text-gray-500">
                        Creada: {new Date(cartera.fecha_creacion).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabla de Carteras */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 text-purple-500 mr-2" />
              Lista Detallada de Carteras
            </h3>
            
            {carterasLoading ? (
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
                          Cartera
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clientes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nodos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Creación
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {carterasConEstadisticas.map((cartera: any) => (
                        <tr key={cartera.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-1 rounded bg-purple-100 mr-3">
                                <Building2 className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">{cartera.nombre}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-blue-500 mr-2" />
                              <span className="text-sm text-gray-900">{cartera.total_clientes}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-orange-500 mr-2" />
                              <span className="text-sm text-gray-900">{cartera.total_nodos}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(cartera.fecha_creacion).toLocaleDateString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {carteras.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No hay carteras registradas</p>
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onClose();
              window.location.href = '/servicios';
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-500 border border-transparent rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            Ver Servicios
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CarterasInfoModal;
