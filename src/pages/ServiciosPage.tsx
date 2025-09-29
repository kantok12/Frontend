import React, { useState } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Tooltip } from '../components/common/Tooltip';
import { Search, Plus, Edit, Trash2, BarChart3, Users, DollarSign, TrendingUp, Building, Network, ArrowUpDown } from 'lucide-react';
import { useCarteras, useCreateCartera, useUpdateCartera, useDeleteCartera, useCarteraEstadisticas } from '../hooks/useCarteras';
import { useClientes, useDeleteCliente } from '../hooks/useClientes';
import { useNodos, useDeleteNodo } from '../hooks/useNodos';
import { Cartera, Cliente, Nodo } from '../types';

// Modal para crear/editar cartera
interface CarteraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cartera?: Cartera | null;
}

const CarteraModal: React.FC<CarteraModalProps> = ({ isOpen, onClose, onSuccess, cartera }) => {
  const [formData, setFormData] = useState({
    nombre: cartera?.nombre || '',
    descripcion: cartera?.descripcion || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateCartera();
  const updateMutation = useUpdateCartera();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (cartera) {
        await updateMutation.mutateAsync({ id: cartera.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      setErrors({ general: 'Error al guardar la cartera' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {cartera ? 'Editar Cartera' : 'Nueva Cartera'}
        </h2>
        
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nombre de la cartera"
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción de la cartera"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para ver estadísticas de cartera
interface EstadisticasModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartera: Cartera | null;
}

const EstadisticasModal: React.FC<EstadisticasModalProps> = ({ isOpen, onClose, cartera }) => {
  const { data: estadisticasData, isLoading } = useCarteraEstadisticas(cartera?.id || 0);

  if (!isOpen || !cartera) return null;

  const estadisticas = estadisticasData?.data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Estadísticas - {cartera.nombre}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : estadisticas ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600">Total Clientes</p>
                  <p className="text-2xl font-bold text-blue-900">{estadisticas.total_clientes}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-green-900">{estadisticas.clientes_activos}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600">Servicios Activos</p>
                  <p className="text-2xl font-bold text-purple-900">{estadisticas.servicios_activos}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-yellow-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    ${estadisticas.ingresos_totales.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No se pudieron cargar las estadísticas
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ServiciosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'carteras' | 'clientes' | 'nodos'>('carteras');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [selectedCartera, setSelectedCartera] = useState<Cartera | null>(null);
  const [editingCartera, setEditingCartera] = useState<Cartera | null>(null);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarteraFilter, setSelectedCarteraFilter] = useState<number | null>(null);
  const [selectedClienteFilter, setSelectedClienteFilter] = useState<number | null>(null);

  const { data: carterasData, isLoading: carterasLoading, error: carterasError } = useCarteras();
  const { data: clientesData, isLoading: clientesLoading, error: clientesError } = useClientes();
  const { data: nodosData, isLoading: nodosLoading, error: nodosError } = useNodos();
  
  const deleteCarteraMutation = useDeleteCartera();
  const deleteClienteMutation = useDeleteCliente();
  const deleteNodoMutation = useDeleteNodo();

  const carteras = carterasData?.data || [];
  const clientes = clientesData?.data || [];
  const nodos = nodosData?.data || [];

  // Filtrar datos por búsqueda
  const filteredCarteras = carteras.filter(cartera =>
    cartera.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (cartera.descripcion && cartera.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (cliente.email && cliente.email.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCarteraFilter = selectedCarteraFilter === null || cliente.cartera_id === selectedCarteraFilter;
    
    return matchesSearch && matchesCarteraFilter;
  });

  const filteredNodos = nodos.filter(nodo => {
    const matchesSearch = nodo.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (nodo.ubicacion && nodo.ubicacion.toLowerCase().includes(search.toLowerCase()));
    
    const matchesClienteFilter = selectedClienteFilter === null || nodo.cliente_id === selectedClienteFilter;
    
    return matchesSearch && matchesClienteFilter;
  });

  // Función de ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para ordenar datos
  const sortData = <T extends Record<string, any>>(data: T[], field: string, direction: 'asc' | 'desc'): T[] => {
    if (!field) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Aplicar ordenamiento a los datos filtrados
  const sortedCarteras = sortData(filteredCarteras, sortField, sortDirection);
  const sortedClientes = sortData(filteredClientes, sortField, sortDirection);
  const sortedNodos = sortData(filteredNodos, sortField, sortDirection);

  // Función helper para mostrar indicador de ordenamiento
  const getSortIndicator = (field: string) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? '↑' : '↓';
    }
    return <ArrowUpDown className="h-3 w-3" />;
  };

  // Función para limpiar filtros al cambiar de pestaña
  const handleTabChange = (newTab: 'carteras' | 'clientes' | 'nodos') => {
    setActiveTab(newTab);
    setSelectedCarteraFilter(null);
    setSelectedClienteFilter(null);
    setSearch('');
  };

  // Función para manejar filtro de cartera
  const handleCarteraFilterChange = (carteraId: number | null) => {
    setSelectedCarteraFilter(carteraId);
    setSelectedClienteFilter(null); // Limpiar filtro de cliente cuando cambia cartera
  };

  // Función para manejar filtro de cliente
  const handleClienteFilterChange = (clienteId: number | null) => {
    setSelectedClienteFilter(clienteId);
  };

  const handleDeleteCartera = async (cartera: Cartera) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la cartera "${cartera.nombre}"?`)) {
      try {
        await deleteCarteraMutation.mutateAsync(cartera.id);
      } catch (error) {
        alert('Error al eliminar la cartera');
      }
    }
  };

  const handleDeleteCliente = async (cliente: Cliente) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el cliente "${cliente.nombre}"?`)) {
      try {
        await deleteClienteMutation.mutateAsync(cliente.id);
      } catch (error) {
        alert('Error al eliminar el cliente');
      }
    }
  };

  const handleDeleteNodo = async (nodo: Nodo) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el nodo "${nodo.nombre}"?`)) {
      try {
        await deleteNodoMutation.mutateAsync(nodo.id);
      } catch (error) {
        alert('Error al eliminar el nodo');
      }
    }
  };

  const handleViewEstadisticas = (cartera: Cartera) => {
    setSelectedCartera(cartera);
    setShowEstadisticasModal(true);
  };

  const handleEdit = (item: Cartera | Cliente | Nodo) => {
    if ('fecha_creacion' in item) {
      // Es una Cartera
      setEditingCartera(item as Cartera);
      setShowCreateModal(true);
    } else if ('email' in item) {
      // Es un Cliente
      // TODO: Implementar modal de edición de cliente
      alert('Funcionalidad de edición de cliente en desarrollo');
    } else if ('estado' in item) {
      // Es un Nodo
      // TODO: Implementar modal de edición de nodo
      alert('Funcionalidad de edición de nodo en desarrollo');
    }
  };

  const handleModalSuccess = () => {
    setEditingCartera(null);
  };

  const isLoading = carterasLoading || clientesLoading || nodosLoading;
  const hasError = carterasError || clientesError || nodosError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar los datos</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Servicios</h1>
        <p className="text-gray-600">Administra carteras, clientes y nodos</p>
        
        {/* Pestañas */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('carteras')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'carteras'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Carteras ({carteras.length})
            </button>
            <button
              onClick={() => handleTabChange('clientes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clientes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building className="h-4 w-4 inline mr-2" />
              Clientes ({clientes.length})
            </button>
        <button 
              onClick={() => handleTabChange('nodos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'nodos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Network className="h-4 w-4 inline mr-2" />
              Nodos ({nodos.length})
        </button>
          </nav>
      </div>
          </div>
          
      {/* Barra de búsqueda, filtros y acciones */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Fila superior: Búsqueda y botón crear */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={
                activeTab === 'carteras' ? 'Buscar carteras...' :
                activeTab === 'clientes' ? 'Buscar clientes...' :
                'Buscar nodos...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            {activeTab === 'carteras' ? 'Nueva Cartera' :
             activeTab === 'clientes' ? 'Nuevo Cliente' :
             'Nuevo Nodo'}
          </button>
        </div>

        {/* Indicadores de filtros activos */}
        {(selectedCarteraFilter || selectedClienteFilter) && (
          <div className="flex flex-wrap gap-2">
            {selectedCarteraFilter && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Cartera: {carteras.find(c => c.id === selectedCarteraFilter)?.nombre}
                <button
                  onClick={() => handleCarteraFilterChange(null)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
          </button>
              </span>
            )}
            {selectedClienteFilter && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Cliente: {clientes.find(c => c.id === selectedClienteFilter)?.nombre}
            <button
                  onClick={() => handleClienteFilterChange(null)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
            </button>
              </span>
          )}
      </div>
        )}

        {/* Fila inferior: Filtros jerárquicos */}
        {activeTab === 'clientes' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Cartera
              </label>
              <select
                value={selectedCarteraFilter || ''}
                onChange={(e) => handleCarteraFilterChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las carteras</option>
                {carteras.map((cartera) => (
                  <option key={cartera.id} value={cartera.id}>
                    {cartera.nombre}
                  </option>
                ))}
              </select>
            </div>
            {selectedCarteraFilter && (
              <div className="flex items-end">
                <button
                  onClick={() => handleCarteraFilterChange(null)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Limpiar filtro
                </button>
          </div>
            )}
            </div>
        )}

        {activeTab === 'nodos' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Cliente
              </label>
              <select
                value={selectedClienteFilter || ''}
                onChange={(e) => handleClienteFilterChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los clientes</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>
            {selectedClienteFilter && (
              <div className="flex items-end">
                <button
                  onClick={() => handleClienteFilterChange(null)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Limpiar filtro
                </button>
            </div>
            )}
          </div>
        )}
        </div>

      {/* Tabla estilo Excel */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Encabezados de tabla */}
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'carteras' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        {getSortIndicator('id')}
            </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nombre')}>
                      <div className="flex items-center space-x-1">
                        <span>Nombre</span>
                        {getSortIndicator('nombre')}
          </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('descripcion')}>
                      <div className="flex items-center space-x-1">
                        <span>Descripción</span>
                        {getSortIndicator('descripcion')}
            </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_clientes')}>
                      <div className="flex items-center space-x-1">
                        <span>Total Clientes</span>
                        {getSortIndicator('total_clientes')}
            </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('fecha_creacion')}>
                      <div className="flex items-center space-x-1">
                        <span>Fecha Creación</span>
                        {getSortIndicator('fecha_creacion')}
            </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </>
                )}
                {activeTab === 'clientes' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        {getSortIndicator('id')}
            </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nombre')}>
                      <div className="flex items-center space-x-1">
                        <span>Nombre</span>
                        {getSortIndicator('nombre')}
            </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('email')}>
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        {getSortIndicator('email')}
          </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('telefono')}>
                      <div className="flex items-center space-x-1">
                        <span>Teléfono</span>
                        {getSortIndicator('telefono')}
        </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('cartera_id')}>
                      <div className="flex items-center space-x-1">
                        <span>Cartera</span>
                        {getSortIndicator('cartera_id')}
      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center space-x-1">
                        <span>Fecha Creación</span>
                        {getSortIndicator('created_at')}
          </div>
                      </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                      </th>
                  </>
                )}
                {activeTab === 'nodos' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        {getSortIndicator('id')}
                      </div>
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nombre')}>
                      <div className="flex items-center space-x-1">
                        <span>Nombre</span>
                        {getSortIndicator('nombre')}
                      </div>
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ubicacion')}>
                      <div className="flex items-center space-x-1">
                        <span>Ubicación</span>
                        {getSortIndicator('ubicacion')}
                      </div>
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('estado')}>
                      <div className="flex items-center space-x-1">
                        <span>Estado</span>
                        {getSortIndicator('estado')}
                      </div>
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('cliente_id')}>
                      <div className="flex items-center space-x-1">
                        <span>Cliente</span>
                        {getSortIndicator('cliente_id')}
                      </div>
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center space-x-1">
                        <span>Fecha Creación</span>
                        {getSortIndicator('created_at')}
                      </div>
                      </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                  </>
                )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
              {/* Filas de Carteras */}
              {activeTab === 'carteras' && sortedCarteras.map((cartera, index) => (
                <tr key={cartera.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cartera.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cartera.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cartera.descripcion || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cartera.total_clientes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cartera.fecha_creacion).toLocaleDateString()}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <Tooltip content="Ver estadísticas">
                        <button
                          onClick={() => handleViewEstadisticas(cartera)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Editar">
                        <button
                          onClick={() => handleEdit(cartera)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Eliminar">
                        <button
                          onClick={() => handleDeleteCartera(cartera)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                          </div>
                        </td>
                </tr>
              ))}
              
              {/* Filas de Clientes */}
              {activeTab === 'clientes' && sortedClientes.map((cliente, index) => (
                <tr key={cliente.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cliente.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.telefono || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {carteras.find(c => c.id === cliente.cartera_id)?.nombre || `ID: ${cliente.cartera_id}`}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cliente.created_at).toLocaleDateString()}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <Tooltip content="Editar">
                        <button
                          onClick={() => handleEdit(cliente)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Eliminar">
                        <button
                          onClick={() => handleDeleteCliente(cliente)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                          </div>
                        </td>
                </tr>
              ))}
              
              {/* Filas de Nodos */}
              {activeTab === 'nodos' && sortedNodos.map((nodo, index) => (
                <tr key={nodo.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{nodo.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{nodo.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nodo.ubicacion || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      nodo.estado === 'activo' ? 'bg-green-100 text-green-800' :
                      nodo.estado === 'inactivo' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {nodo.estado}
                          </span>
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {clientes.find(c => c.id === nodo.cliente_id)?.nombre || `ID: ${nodo.cliente_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(nodo.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <Tooltip content="Editar">
                            <button 
                          onClick={() => handleEdit(nodo)}
                          className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                      </Tooltip>
                      <Tooltip content="Eliminar">
                            <button 
                          onClick={() => handleDeleteNodo(nodo)}
                          className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                      </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

      {/* Mensaje cuando no hay datos */}
      {((activeTab === 'carteras' && sortedCarteras.length === 0) ||
        (activeTab === 'clientes' && sortedClientes.length === 0) ||
        (activeTab === 'nodos' && sortedNodos.length === 0)) && (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              {activeTab === 'carteras' && <BarChart3 className="h-12 w-12 mx-auto" />}
              {activeTab === 'clientes' && <Building className="h-12 w-12 mx-auto" />}
              {activeTab === 'nodos' && <Network className="h-12 w-12 mx-auto" />}
                </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'carteras' ? 'No hay carteras' :
               activeTab === 'clientes' ? 'No hay clientes' :
               'No hay nodos'}
            </h3>
            <p className="text-gray-600 mb-4">
              {search ? `No se encontraron ${activeTab} con ese criterio de búsqueda.` : 
               `Comienza creando tu primer${activeTab === 'carteras' ? 'a cartera' : activeTab === 'clientes' ? ' cliente' : ' nodo'}.`}
            </p>
            {!search && (
                      <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                <Plus className="h-5 w-5 mr-2" />
                {activeTab === 'carteras' ? 'Crear Primera Cartera' :
                 activeTab === 'clientes' ? 'Crear Primer Cliente' :
                 'Crear Primer Nodo'}
                      </button>
            )}
                </div>
              </div>
            )}

      {/* Modales */}
      <CarteraModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCartera(null);
        }}
        onSuccess={handleModalSuccess}
        cartera={editingCartera}
      />

      <EstadisticasModal
        isOpen={showEstadisticasModal}
        onClose={() => {
          setShowEstadisticasModal(false);
          setSelectedCartera(null);
        }}
        cartera={selectedCartera}
      />
    </div>
  );
};
