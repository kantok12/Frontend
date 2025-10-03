import React, { useState } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Search, Plus, Edit, Trash2, Eye, Settings, Users, Building2, MapPin, AlertCircle, ChevronRight } from 'lucide-react';
import { useServiciosPage } from '../hooks/useServicios';
import { Tooltip } from '../components/common/Tooltip';
import { Cartera, Cliente, Nodo } from '../types';

export const ServiciosPage: React.FC = () => {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<'carteras' | 'clientes' | 'nodos'>('carteras');
  
  // Estado para navegación jerárquica
  const [selectedCartera, setSelectedCartera] = useState<Cartera | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  // Estados comunes
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Cartera | Cliente | Nodo | null>(null);
  
  // Obtener datos reales del backend
  const { 
    estadisticas, 
    estructura, 
    carteras, 
    clientes, 
    nodos, 
    isLoading, 
    error 
  } = useServiciosPage(search, activeTab);
  

  // Obtener datos filtrados según la pestaña activa y selección jerárquica
  const getCurrentData = () => {
    switch (activeTab) {
      case 'carteras':
        return carteras.filter((cartera: Cartera) => 
          cartera.nombre && cartera.nombre.toLowerCase().includes(search.toLowerCase())
        );
      case 'clientes':
        let filteredClientes = clientes;
        // Si hay una cartera seleccionada, filtrar solo sus clientes
        if (selectedCartera) {
          filteredClientes = clientes.filter((cliente: Cliente) => 
            cliente.cartera_id === selectedCartera.id
          );
        }
        return filteredClientes.filter((cliente: Cliente) => 
          cliente.nombre && cliente.nombre.toLowerCase().includes(search.toLowerCase())
        );
      case 'nodos':
        let filteredNodos = nodos;
        // Si hay un cliente seleccionado, filtrar solo sus nodos
        if (selectedCliente) {
          filteredNodos = nodos.filter((nodo: Nodo) => 
            nodo.cliente_id === selectedCliente.id
          );
        }
        // Si hay una cartera seleccionada pero no cliente específico, filtrar por cartera
        else if (selectedCartera) {
          filteredNodos = nodos.filter((nodo: Nodo) => 
            nodo.cartera_id === selectedCartera.id
          );
        }
        return filteredNodos.filter((nodo: Nodo) => 
          nodo.nombre && nodo.nombre.toLowerCase().includes(search.toLowerCase())
        );
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  // Paginación dinámica según la pestaña activa
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedData = currentData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(currentData.length / limit);
  const total = currentData.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Funciones para manejar los modales
  const handleViewItem = (item: Cartera | Cliente | Nodo) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditItem = (item: Cartera | Cliente | Nodo) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDeleteItem = (item: Cartera | Cliente | Nodo) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedItem) {
      // eslint-disable-next-line no-console
      console.log('Eliminando item:', selectedItem);
      // Aquí se implementaría la lógica de eliminación
      setShowDeleteModal(false);
      setSelectedItem(null);
    }
  };

  // Funciones para navegación jerárquica
  const handleCarteraClick = (cartera: Cartera) => {
    setSelectedCartera(cartera);
    setSelectedCliente(null);
    setActiveTab('clientes');
    setPage(1);
    setSearch('');
  };

  const handleClienteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setActiveTab('nodos');
    setPage(1);
    setSearch('');
  };

  const handleBackToCarteras = () => {
    setSelectedCartera(null);
    setSelectedCliente(null);
    setActiveTab('carteras');
    setPage(1);
    setSearch('');
  };

  const handleBackToClientes = () => {
    setSelectedCliente(null);
    setActiveTab('clientes');
    setPage(1);
    setSearch('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error al cargar los datos</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Servicios</h1>
        <p className="text-gray-600">Administra carteras, clientes y nodos de servicios</p>
        {!!error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">
                <strong>Error:</strong> No se pudieron cargar los datos de servicios. Los endpoints del backend pueden no estar disponibles.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Breadcrumb Navigation */}
      {(selectedCartera || selectedCliente) && (
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={handleBackToCarteras}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Settings className="h-4 w-4 mr-1" />
              Carteras
            </button>
            
            {selectedCartera && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button
                  onClick={handleBackToClientes}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {selectedCartera.nombre}
                </button>
              </>
            )}
            
            {selectedCliente && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {selectedCliente.nombre}
                </span>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Pestañas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('carteras')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'carteras'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Carteras
              </div>
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clientes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </div>
            </button>
            <button
              onClick={() => setActiveTab('nodos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'nodos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Nodos
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 items-center">
          {/* Barra de búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <input
              type="text"
              placeholder={
                activeTab === 'carteras' ? 'Buscar carteras por nombre...' :
                activeTab === 'clientes' ? 'Buscar clientes por nombre...' :
                'Buscar nodos por nombre...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Resumen dinámico según pestaña activa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 slide-up animate-delay-300">
        {/* Estadísticas Generales */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Estadísticas Generales</h3>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Carteras:</span>
              <span className="font-semibold text-blue-600">
                {isLoading ? '...' : (estadisticas?.total_carteras || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Clientes:</span>
              <span className="font-semibold text-green-600">
                {isLoading ? '...' : (estadisticas?.total_clientes || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Nodos:</span>
              <span className="font-semibold text-purple-600">
                {isLoading ? '...' : (estadisticas?.total_nodos || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas por Pestaña */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'carteras' ? 'Carteras' : 
               activeTab === 'clientes' ? 'Clientes' : 'Nodos'}
            </h3>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              {activeTab === 'carteras' ? <Building2 className="h-4 w-4 text-green-600" /> :
               activeTab === 'clientes' ? <Users className="h-4 w-4 text-green-600" /> :
               <MapPin className="h-4 w-4 text-green-600" />}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-semibold text-blue-600">
                {isLoading ? '...' : currentData.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mostrando:</span>
              <span className="font-semibold text-green-600">
                {isLoading ? '...' : paginatedData.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Página:</span>
              <span className="font-semibold text-purple-600">
                {isLoading ? '...' : `${page} de ${totalPages}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla dinámica según pestaña activa */}
      <div className="slide-up animate-delay-300">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'carteras' ? 'Carteras' : 
             activeTab === 'clientes' ? 'Clientes' : 'Nodos'} ({total} registros)
          </h2>
        </div>

        {!!error ? (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar datos</h3>
              <p className="text-sm text-red-600 mb-4">
                No se pudieron cargar los datos de {activeTab}. Los endpoints del backend pueden no estar disponibles.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="md" />
                <span className="ml-2">Cargando {activeTab}...</span>
              </div>
            ) : search ? (
              `No se encontraron ${activeTab} con los criterios de búsqueda`
            ) : (
              `No hay ${activeTab} registrados`
            )}
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {activeTab === 'carteras' ? (
                        <>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </>
                      ) : activeTab === 'clientes' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cartera
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nodos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha Creación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </>
                      ) : (
                        <>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item: Cartera | Cliente | Nodo, index: number) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-gray-50 transition-colors duration-200 stagger-item animate-delay-${(index + 1) * 100} ${
                          (activeTab === 'carteras' || activeTab === 'clientes') ? 'cursor-pointer' : ''
                        }`}
                        onClick={
                          activeTab === 'carteras' ? () => handleCarteraClick(item as Cartera) :
                          activeTab === 'clientes' ? () => handleClienteClick(item as Cliente) :
                          undefined
                        }
                      >
                        {activeTab === 'carteras' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 capitalize">
                                    {(item as Cartera).nombre ? (item as Cartera).nombre.replace('_', ' ') : 'Sin nombre'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Cartera de servicios
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Users className="h-4 w-4 mr-1 text-green-500" />
                                {(item as Cartera).total_clientes} clientes
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Settings className="h-4 w-4 mr-1 text-blue-500" />
                                {(item as Cartera).total_nodos} nodos
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date((item as Cartera).fecha_creacion).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewItem(item);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditItem(item);
                                  }}
                                  className="text-yellow-600 hover:text-yellow-900 p-2 rounded-full hover:bg-yellow-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item);
                                  }}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : activeTab === 'clientes' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 capitalize">
                                    {(item as Cliente).nombre ? (item as Cliente).nombre.replace('_', ' ') : 'Sin nombre'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Cliente
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                Cartera ID: {(item as Cliente).cartera_id}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Settings className="h-4 w-4 mr-1 text-blue-500" />
                                {(item as Cliente).total_nodos} nodos
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date((item as Cliente).created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewItem(item);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditItem(item);
                                  }}
                                  className="text-yellow-600 hover:text-yellow-900 p-2 rounded-full hover:bg-yellow-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item);
                                  }}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <MapPin className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 capitalize">
                                    {(item as Nodo).nombre ? (item as Nodo).nombre.replace('_', ' ') : 'Sin nombre'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Nodo
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                Cliente ID: {(item as Nodo).cliente_id}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                Cartera ID: {(item as Nodo).cartera_id}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date((item as Nodo).created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewItem(item);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditItem(item);
                                  }}
                                  className="text-yellow-600 hover:text-yellow-900 p-2 rounded-full hover:bg-yellow-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item);
                                  }}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, total)} de {total} resultados
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === page
                          ? 'text-blue-600 bg-blue-50 border border-blue-300'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Detalles del {activeTab.slice(0, -1)}</h3>
            <div className="space-y-2">
              <p><strong>ID:</strong> {selectedItem.id}</p>
              <p><strong>Nombre:</strong> {(selectedItem as any).nombre}</p>
              {activeTab === 'carteras' && (
                <>
                  <p><strong>Clientes:</strong> {(selectedItem as Cartera).total_clientes}</p>
                  <p><strong>Nodos:</strong> {(selectedItem as Cartera).total_nodos}</p>
                </>
              )}
              {activeTab === 'clientes' && (
                <>
                  <p><strong>Cartera ID:</strong> {(selectedItem as Cliente).cartera_id}</p>
                  <p><strong>Nodos:</strong> {(selectedItem as Cliente).total_nodos}</p>
                </>
              )}
              {activeTab === 'nodos' && (
                <>
                  <p><strong>Cliente ID:</strong> {(selectedItem as Nodo).cliente_id}</p>
                  <p><strong>Cartera ID:</strong> {(selectedItem as Nodo).cartera_id}</p>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar este {activeTab.slice(0, -1)}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};