import React, { useState } from 'react';
import { useServiciosDashboard } from '../../hooks/useServicios';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EstructuraCompleta, Cliente, Nodo } from '../../types';
import { 
  Building2, 
  Users, 
  MapPin, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Search
} from 'lucide-react';

export const ServiciosDashboard: React.FC = () => {
  const { estadisticas, estructura, carteras, isLoading, error } = useServiciosDashboard();
  const [expandedCarteras, setExpandedCarteras] = useState<Set<number>>(new Set());
  const [expandedClientes, setExpandedClientes] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCartera = (carteraId: number) => {
    const newExpanded = new Set(expandedCarteras);
    if (newExpanded.has(carteraId)) {
      newExpanded.delete(carteraId);
    } else {
      newExpanded.add(carteraId);
    }
    setExpandedCarteras(newExpanded);
  };

  const toggleCliente = (clienteId: number) => {
    const newExpanded = new Set(expandedClientes);
    if (newExpanded.has(clienteId)) {
      newExpanded.delete(clienteId);
    } else {
      newExpanded.add(clienteId);
    }
    setExpandedClientes(newExpanded);
  };

  const filteredEstructura = estructura?.filter((cartera: EstructuraCompleta) => 
    cartera.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cartera.clientes?.some((cliente: Cliente) => 
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nodos?.some((nodo: Nodo) => 
        nodo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error al cargar los datos de servicios</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Servicios</h1>
          <p className="text-gray-600 mt-1">
            Estructura jerárquica: Carteras → Clientes → Nodos
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cartera
        </button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Carteras</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.totales.carteras}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-500">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.totales.clientes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-500">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Nodos</p>
                <p className="text-3xl font-bold text-gray-900">{estadisticas.totales.nodos}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar carteras, clientes o nodos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estructura Jerárquica */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Estructura Jerárquica</h2>
        </div>
        
        <div className="p-6">
          {filteredEstructura && filteredEstructura.length > 0 ? (
            <div className="space-y-4">
              {filteredEstructura.map((cartera: EstructuraCompleta) => (
                <div key={cartera.id} className="border border-gray-200 rounded-lg">
                  {/* Cartera */}
                  <div 
                    className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleCartera(cartera.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {expandedCarteras.has(cartera.id) ? (
                          <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
                        )}
                        <Building2 className="h-5 w-5 text-purple-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{cartera.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            {cartera.clientes?.length || 0} clientes • {cartera.clientes?.reduce((acc: number, cliente: Cliente) => acc + (cliente.nodos?.length || 0), 0) || 0} nodos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clientes */}
                  {expandedCarteras.has(cartera.id) && cartera.clientes && (
                    <div className="border-t border-gray-200">
                      {cartera.clientes.map((cliente: Cliente) => (
                        <div key={cliente.id}>
                          <div 
                            className="p-4 pl-8 bg-white hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                            onClick={() => toggleCliente(cliente.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {expandedClientes.has(cliente.id) ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                                )}
                                <Users className="h-4 w-4 text-indigo-600 mr-3" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{cliente.nombre}</h4>
                                  <p className="text-sm text-gray-600">
                                    {cliente.nodos?.length || 0} nodos
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Nodos */}
                          {expandedClientes.has(cliente.id) && cliente.nodos && (
                            <div className="bg-gray-50">
                              {cliente.nodos.map((nodo: Nodo) => (
                                <div key={nodo.id} className="p-4 pl-16 border-b border-gray-100 last:border-b-0">
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 text-orange-600 mr-3" />
                                    <div>
                                      <h5 className="font-medium text-gray-900">{nodo.nombre}</h5>
                                      <p className="text-sm text-gray-600">
                                        Creado: {new Date(nodo.created_at).toLocaleDateString('es-CL')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No se encontraron resultados para la búsqueda' : 'No hay datos de servicios disponibles'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
