import React from 'react';
import { X, User, Building, MapPin, Phone, Mail, Users, Calendar, Settings } from 'lucide-react';
import { useClientesByCartera } from '../../hooks/useCarteras';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Cliente {
  id: string;
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  direccion: string;
  tipo: 'Empresa' | 'Persona';
  ubicacion?: string;
  seccion?: string;
}

interface CarteraViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartera: any;
}

export const CarteraViewModal: React.FC<CarteraViewModalProps> = ({
  isOpen,
  onClose,
  cartera
}) => {
  // Obtener clientes reales del backend (siempre llamar hooks antes de early returns)
  const { data: clientesResponse, isLoading: isLoadingClientes, error: errorClientes } = useClientesByCartera(cartera?.id || '');
  
  if (!isOpen || !cartera) return null;
  
  // Usar datos reales del backend
  const clientes = clientesResponse?.success && clientesResponse.data ? clientesResponse.data : [];

  const ubicaciones = Array.from(new Set(clientes.map(c => c.ubicacion).filter((ubicacion): ubicacion is string => Boolean(ubicacion))));
  const secciones = Array.from(new Set(clientes.map(c => c.seccion).filter((seccion): seccion is string => Boolean(seccion))));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Detalles de la Cartera
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Información de la Cartera */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 capitalize">
                  {cartera.name?.replace('_', ' ') || 'Cartera'}
                </h3>
                <p className="text-gray-600">ID: {cartera.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Clientes</p>
                  <p className="font-semibold text-gray-900">{cartera.total_clientes}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Nodos</p>
                  <p className="font-semibold text-gray-900">{cartera.total_nodos}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Fecha Creación</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(cartera.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen por Ubicaciones */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-600" />
              Ubicaciones ({ubicaciones.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ubicaciones.map((ubicacion) => {
                const clientesEnUbicacion = clientes.filter(c => c.ubicacion === ubicacion);
                return (
                  <div key={ubicacion} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{ubicacion}</h4>
                        <p className="text-sm text-gray-600">{clientesEnUbicacion.length} clientes</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen por Secciones */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              Secciones ({secciones.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {secciones.map((seccion) => {
                const clientesEnSeccion = clientes.filter(c => c.seccion === seccion);
                return (
                  <div key={seccion} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{seccion}</h4>
                        <p className="text-sm text-gray-600">{clientesEnSeccion.length} clientes</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista Detallada de Clientes */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-green-600" />
              Clientes Asignados ({clientes.length})
            </h3>
            {isLoadingClientes ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Cargando clientes...</span>
              </div>
            ) : errorClientes ? (
              <div className="text-center py-8 text-red-500">
                <p>Error al cargar los clientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientes.map((cliente) => (
                <div key={cliente.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${
                        cliente.tipo === 'Empresa' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {cliente.tipo === 'Empresa' ? (
                          <Building className="h-5 w-5 text-blue-600" />
                        ) : (
                          <User className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-semibold text-gray-900 mr-3">{cliente.nombre}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            cliente.tipo === 'Empresa' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {cliente.tipo}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">RUT: {cliente.rut}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {cliente.email}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {cliente.telefono}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {cliente.ubicacion}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Building className="h-4 w-4 mr-2" />
                            {cliente.seccion}
                          </div>
                        </div>
                        {cliente.direccion && (
                          <p className="text-sm text-gray-500 mt-2">{cliente.direccion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botón de Cerrar */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
