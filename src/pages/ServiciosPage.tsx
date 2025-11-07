import React, { useEffect, useMemo, useCallback } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Search, Plus, Settings, Users, Building2, MapPin, AlertCircle, ChevronRight, Globe } from 'lucide-react';
import { useServiciosPage } from '../hooks/useServicios';
import { Tooltip } from '../components/common/Tooltip';
import { Cartera, Cliente, Nodo } from '../types';
import { AgregarClienteModal } from '../components/servicios/AgregarClienteModal';
import { AgregarNodoModal } from '../components/servicios/AgregarNodoModal';
import { usePersonalList } from '../hooks/usePersonal';
import { usePersonalAssignments } from '../hooks/usePersonalAssignments';
import { usePrerequisitos } from '../hooks/usePrerequisitos';
import { useNavigationState } from '../hooks/useNavigationState';
import { useUIState } from '../hooks/useUIState';
import { apiService } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { PrerrequisitosCliente } from '../components/servicios/PrerrequisitosCliente';
import { PrerrequisitosModal } from '../components/servicios/PrerrequisitosModal';
import { GlobalPrerrequisitosModal } from '../components/servicios/GlobalPrerrequisitosModal';

export const ServiciosPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Hooks optimizados
  const { uiState, handleTabChange, handlePageChange, handleSearchChange, handleSearchClear, handleModalToggle } = useUIState();
  const { navigationState, handleCarteraClick, handleClienteClick, handleNodoClick, handleBackToCarteras, handleBackToClientes } = useNavigationState();
  const { assignmentState, loadAssignedPersonal, handleAssign, handleUnassign, updateAssignmentState } = usePersonalAssignments();
  const { prereqState, loadPrerequisitosMatch, updatePrereqState } = usePrerequisitos();

  // Listado de personal para seleccionar (hasta 100, sin búsqueda para evitar llamadas excesivas)
  const { data: personListData, isLoading: personListLoading } = usePersonalList(1, 100, '', {});
  const personOptions = personListData?.data?.items || [];
  
  // Constantes
  const limit = 10;
  
  // Obtener datos reales del backend (sin búsqueda para evitar bloqueos)
  const { 
    estadisticas, 
    estructura, 
    carteras, 
    clientes, 
    nodos, 
    minimoPersonal: minimosPersonal,
    isLoading, 
    error 
  } = useServiciosPage('', uiState.activeTab);

  // Obtener mínimos de personal (traído desde useServiciosPage)
  // `minimosPersonal` viene ahora desde el hook `useServiciosPage` (usa /api/servicios/minimo-personal)
  

  // Funciones helper optimizadas con useMemo
  const getCarteraNombre = useCallback((carteraId: number) => {
    const cartera = carteras.find((c: Cartera) => c.id === carteraId);
    return cartera ? cartera.nombre : `Cartera ID: ${carteraId}`;
  }, [carteras]);

  // DEBUG: mostrar mínimos cargados
  console.log('🔎 minimosPersonal (desde useServiciosPage):', minimosPersonal?.length, minimosPersonal?.slice(0,3));

  const getClienteNombre = useCallback((clienteId: number) => {
    const cliente = clientes.find((c: Cliente) => c.id === clienteId);
    return cliente ? cliente.nombre : `Cliente ID: ${clienteId}`;
  }, [clientes]);

  const getNodosCliente = useCallback((clienteId: number) => {
    return nodos.filter((n: Nodo) => n.cliente_id === clienteId);
  }, [nodos]);

  const getMinimoPersonalCliente = useCallback((clienteId: number) => {
    // Comparar como strings por si vienen como number o string
    const minimo = minimosPersonal.find((mp: any) => {
      try {
        return String(mp.cliente_id) === String(clienteId);
      } catch (e) {
        return false;
      }
    });
    return minimo ? minimo.minimo_personal : null;
  }, [minimosPersonal]);

  // Obtener datos filtrados optimizado con useMemo
  const currentData = useMemo(() => {
    const searchLower = uiState.search.toLowerCase();
    
    switch (uiState.activeTab) {
      case 'carteras':
        return carteras.filter((cartera: Cartera) => 
          cartera.nombre && cartera.nombre.toLowerCase().includes(searchLower)
        );
      case 'clientes':
        let filteredClientes = clientes;
        // Si hay una cartera seleccionada, filtrar solo sus clientes
        if (navigationState.selectedCartera) {
          filteredClientes = clientes.filter((cliente: Cliente) => 
            cliente.cartera_id === navigationState.selectedCartera!.id
          );
        }
        return filteredClientes.filter((cliente: Cliente) => 
          cliente.nombre && cliente.nombre.toLowerCase().includes(searchLower)
        );
      case 'nodos':
        let filteredNodos = nodos;
        // Si hay un cliente seleccionado, filtrar solo sus nodos
        if (navigationState.selectedCliente) {
          filteredNodos = nodos.filter((nodo: Nodo) => 
            nodo.cliente_id === navigationState.selectedCliente!.id
          );
        }
        // Si hay una cartera seleccionada pero no cliente específico, filtrar por cartera
        else if (navigationState.selectedCartera) {
          filteredNodos = nodos.filter((nodo: Nodo) => 
            nodo.cartera_id === navigationState.selectedCartera!.id
          );
        }
        return filteredNodos.filter((nodo: Nodo) => 
          nodo.nombre && nodo.nombre.toLowerCase().includes(searchLower)
        );
      default:
        return [];
    }
  }, [uiState.activeTab, uiState.search, carteras, clientes, nodos, navigationState.selectedCartera, navigationState.selectedCliente]);

  // Paginación optimizada con useMemo
  const paginationData = useMemo(() => {
    const startIndex = (uiState.page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      paginatedData: currentData.slice(startIndex, endIndex),
      totalPages: Math.ceil(currentData.length / limit),
      total: currentData.length,
      startIndex,
      endIndex: Math.min(endIndex, currentData.length)
    };
  }, [currentData, uiState.page, limit]);
  
  const { paginatedData, totalPages, total, startIndex, endIndex } = paginationData;

  // Handlers optimizados
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handlePageChange(1);
  }, [handlePageChange]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
  }, [handleSearchChange]);

  React.useEffect(() => {
    handlePageChange(1);
  }, [uiState.search, handlePageChange]);

  // Sin acciones: se eliminan handlers de ver/editar/eliminar

  // Handlers de navegación optimizados
  const handleCarteraClickWithUI = useCallback((cartera: Cartera) => {
    handleCarteraClick(cartera);
    handleTabChange('clientes');
  }, [handleCarteraClick, handleTabChange]);

  const handleClienteClickWithUI = useCallback((cliente: Cliente) => {
    handleClienteClick(cliente);
    handleTabChange('nodos');
  }, [handleClienteClick, handleTabChange]);

  const handleBackToCarterasWithUI = useCallback(() => {
    handleBackToCarteras();
    handleTabChange('carteras');
  }, [handleBackToCarteras, handleTabChange]);

  const handleBackToClientesWithUI = useCallback(() => {
    handleBackToClientes();
    handleTabChange('clientes');
  }, [handleBackToClientes, handleTabChange]);

  // Cargar asignaciones cuando cambia la selección
  useEffect(() => {
    loadAssignedPersonal(
      navigationState.selectedCartera,
      navigationState.selectedCliente,
      navigationState.selectedNodo
    );
  }, [navigationState.selectedCartera, navigationState.selectedCliente, navigationState.selectedNodo, loadAssignedPersonal]);

  // Enriquecer con nombres optimizado
  const hydrateNames = useCallback(async () => {
    if (!assignmentState.assignedPersonal || assignmentState.assignedPersonal.length === 0) return;
    const needLookup = assignmentState.assignedPersonal.filter(p => !p.nombre);
    if (needLookup.length === 0) return;
    
    try {
      const updated = await Promise.all(
        assignmentState.assignedPersonal.map(async (p) => {
          if (p.nombre) return p;
          // Intentar encontrar en la lista ya cargada
          const found = personOptions.find((x: any) => x.rut === p.rut);
          if (found) {
            return { ...p, nombre: `${found.nombre} ${found.apellido}`.trim() };
          }
          // Consultar al backend por RUT
          try {
            const res: any = await apiService.getPersonalByRut(p.rut);
            const data: any = res.data || {};
            const full = data.nombres || data.nombre || data.nombre_completo || '';
            const nombreCompuesto = full ? full : undefined;
            return { ...p, nombre: nombreCompuesto };
          } catch {
            return p;
          }
        })
      );
      updateAssignmentState({ assignedPersonal: updated });
    } catch (error) {
      console.warn('Error al hidratar nombres:', error);
    }
  }, [assignmentState.assignedPersonal, personOptions, updateAssignmentState]);

  useEffect(() => {
    hydrateNames();
  }, [hydrateNames]);

  const handleAssignWithUI = useCallback(async () => {
    try {
      const result = await handleAssign(
        navigationState.selectedCartera,
        navigationState.selectedCliente,
        navigationState.selectedNodo,
        () => loadAssignedPersonal(
          navigationState.selectedCartera,
          navigationState.selectedCliente,
          navigationState.selectedNodo
        )
      );
      
      if (result?.hasPrereqIssues) {
        handleModalToggle('showPrereqPanel', true);
        updatePrereqState({
          selectedRutForMatch: assignmentState.selectedRutToAssign,
          prereqData: result.prereqData
        });
      }
    } catch (e: any) {
      alert(e?.message || 'Error al asignar');
    }
  }, [handleAssign, navigationState.selectedCartera, navigationState.selectedCliente, navigationState.selectedNodo, loadAssignedPersonal, handleModalToggle, updatePrereqState, assignmentState.selectedRutToAssign]);

  const handleUnassignWithUI = useCallback(async (rut: string) => {
    try {
      await handleUnassign(
        rut,
        navigationState.selectedCartera,
        navigationState.selectedCliente,
        navigationState.selectedNodo,
        () => loadAssignedPersonal(
          navigationState.selectedCartera,
          navigationState.selectedCliente,
          navigationState.selectedNodo
        )
      );
    } catch (e: any) {
      alert(e?.message || 'Error al desasignar');
    }
  }, [handleUnassign, navigationState.selectedCartera, navigationState.selectedCliente, navigationState.selectedNodo, loadAssignedPersonal]);

  const handlePrerequisitosMatch = useCallback(async (rut?: string) => {
    await loadPrerequisitosMatch(navigationState.selectedCliente, rut);
  }, [loadPrerequisitosMatch, navigationState.selectedCliente]);

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
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Servicios</h1>
            <p className="text-gray-600 mt-1">Administra carteras, clientes y nodos de servicios</p>
          </div>
          
          {/* Botones de acción según pestaña activa */}
          <div className="flex gap-3">
            {/* Mostrar el botón de Prerrequisitos Globales sólo en la pestaña "clientes" */}
            {uiState.activeTab === 'clientes' && (
              <button
                onClick={() => handleModalToggle('showGlobalPrerrequisitosModal', true)}
                className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Globe className="h-5 w-5 mr-2" />
                Prerrequisitos Globales
              </button>
            )}
            {navigationState.selectedCliente && (
              <button
                onClick={() => handleModalToggle('showPrerrequisitosModal', true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Gestionar Prerrequisitos
              </button>
            )}
            {uiState.activeTab === 'clientes' && (
            <button
              onClick={() => handleModalToggle('showAgregarClienteModal', true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Cliente
              </button>
            )}
            
            {uiState.activeTab === 'nodos' && (
            <button
              onClick={() => handleModalToggle('showAgregarNodoModal', true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Nodo
              </button>
            )}
          </div>
        </div>
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
      {(navigationState.selectedCartera || navigationState.selectedCliente) && (
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={handleBackToCarterasWithUI}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Settings className="h-4 w-4 mr-1" />
              Carteras
            </button>
            
            {navigationState.selectedCartera && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button
                  onClick={handleBackToClientesWithUI}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {navigationState.selectedCartera.nombre}
                </button>
              </>
            )}
            
            {navigationState.selectedCliente && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {navigationState.selectedCliente.nombre}
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
              onClick={() => handleTabChange('carteras')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                uiState.activeTab === 'carteras'
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
              onClick={() => handleTabChange('clientes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                uiState.activeTab === 'clientes'
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
              onClick={() => handleTabChange('nodos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                uiState.activeTab === 'nodos'
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
                uiState.activeTab === 'carteras' ? 'Buscar carteras por nombre...' :
                uiState.activeTab === 'clientes' ? 'Buscar clientes por nombre...' :
                uiState.activeTab === 'nodos' ? 'Buscar nodos por nombre...' :
                'Buscar...'
              }
              value={uiState.search}
              onChange={handleSearchInputChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Buscar
          </button>
          {uiState.search && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Resumen sutil extendido según pestaña activa */}
      <div className="mb-6 slide-up animate-delay-300">
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-6">
            {/* Información principal de la pestaña */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                {uiState.activeTab === 'carteras' ? <Building2 className="h-4 w-4 text-gray-600" /> :
                 uiState.activeTab === 'clientes' ? <Users className="h-4 w-4 text-gray-600" /> :
                 uiState.activeTab === 'nodos' ? <MapPin className="h-4 w-4 text-gray-600" /> :
                 <AlertCircle className="h-4 w-4 text-gray-600" />}
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  {uiState.activeTab === 'carteras' ? 'Carteras' : 
                   uiState.activeTab === 'clientes' ? 'Clientes' : 
                   uiState.activeTab === 'nodos' ? 'Nodos' : 'Prerrequisitos'}
                </span>
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {isLoading ? '...' : currentData.length}
                </span>
              </div>
            </div>
            
            {/* Separador sutil */}
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            
            {/* Estadísticas de paginación */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <span className="text-sm text-gray-500">Mostrando</span>
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {isLoading ? '...' : paginatedData.length}
                </span>
              </div>
            </div>
            
            {/* Separador sutil */}
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            
            {/* Información de página */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <MapPin className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <span className="text-sm text-gray-500">Página</span>
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {isLoading ? '...' : `${uiState.page} de ${totalPages}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Tabla dinámica según pestaña activa */}
      <div className="slide-up animate-delay-300">
        {/* Panel de personal asignado según la selección */}
        {(navigationState.selectedCartera || navigationState.selectedCliente || navigationState.selectedNodo) && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Personal asignado a {navigationState.selectedNodo ? 'Nodo' : navigationState.selectedCliente ? 'Cliente' : 'Cartera'}
              </h3>
            </div>
            {/* Formulario de asignación: seleccionar personal de una lista */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar personal por nombre o RUT..."
                  value={assignmentState.personSearch}
                  onChange={(e) => updateAssignmentState({ personSearch: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                  value={assignmentState.selectedRutToAssign}
                  onChange={(e) => updateAssignmentState({ selectedRutToAssign: e.target.value })}
                  className="w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={personListLoading}
                >
                  <option value="">{personListLoading ? 'Cargando personal...' : 'Seleccionar personal'}</option>
                  {personOptions.map((p: any) => (
                    <option key={p.rut} value={p.rut}>
                      {p.nombre} {p.apellido} ({p.rut})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssignWithUI}
                disabled={assignmentState.assigning || !assignmentState.selectedRutToAssign.trim()}
                className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {assignmentState.assigning ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
            {assignmentState.assignedLoading ? (
              <div className="flex items-center text-gray-600 text-sm">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Cargando personal asignado...</span>
              </div>
            ) : assignmentState.assignedError ? (
              <div className="text-sm text-red-600">{assignmentState.assignedError}</div>
            ) : !assignmentState.assignedPersonal || assignmentState.assignedPersonal.length === 0 ? (
              <div className="text-sm text-gray-500">No hay personal asignado.</div>
            ) : (
              <ul className="text-sm text-gray-800 space-y-2">
                {assignmentState.assignedPersonal.map((p) => (
                  <li key={p.rut} className="flex items-center justify-between">
                    <span>
                      {(() => {
                        if (p.nombre) return `${p.nombre} (${p.rut})`;
                        const found: any | undefined = personOptions.find((x: any) => x?.rut === p.rut);
                        if (found && (found.nombre || found.apellido)) {
                          const nom = `${found.nombre || ''} ${found.apellido || ''}`.trim();
                          return nom ? `${nom} (${p.rut})` : p.rut;
                        }
                        return p.rut;
                      })()}
                    </span>
                    <button
                      onClick={() => handleUnassignWithUI(p.rut)}
                      disabled={assignmentState.unassigningRut === p.rut}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      {assignmentState.unassigningRut === p.rut ? 'Quitando...' : 'Quitar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {uiState.activeTab === 'carteras' ? 'Carteras' : 
             uiState.activeTab === 'clientes' ? 'Clientes' : 
             uiState.activeTab === 'nodos' ? 'Nodos' : 'Prerrequisitos'} ({total} registros)
          </h2>
        </div>

        {!!error ? (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar datos</h3>
              <p className="text-sm text-red-600 mb-4">
                No se pudieron cargar los datos de {uiState.activeTab}. Los endpoints del backend pueden no estar disponibles.
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
                <span className="ml-2">Cargando {uiState.activeTab}...</span>
              </div>
            ) : uiState.search ? (
              `No se encontraron ${uiState.activeTab} con los criterios de búsqueda`
            ) : (
              `No hay ${uiState.activeTab} registrados`
            )}
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {uiState.activeTab === 'carteras' ? (
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
                          {/* Sin acciones */}
                        </>
                      ) : uiState.activeTab === 'clientes' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cartera
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Personal Mínimo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nodos
                          </th>
                          
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha Creación
                          </th>
                          {/* Sin acciones */}
                        </>
                      ) : uiState.activeTab === 'nodos' ? (
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
                          {/* Sin acciones */}
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item: Cartera | Cliente | Nodo, index: number) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-gray-50 transition-colors duration-200 stagger-item animate-delay-${(index + 1) * 100} ${
                          (uiState.activeTab === 'carteras' || uiState.activeTab === 'clientes') ? 'cursor-pointer' : ''
                        }`}
                        onClick={
                          uiState.activeTab === 'carteras' ? () => handleCarteraClickWithUI(item as Cartera) :
                          uiState.activeTab === 'clientes' ? () => handleClienteClickWithUI(item as Cliente) :
                          uiState.activeTab === 'nodos' ? () => handleNodoClick(item as Nodo) :
                          undefined
                        }
                      >
                        {uiState.activeTab === 'carteras' ? (
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
                            {/* Sin acciones */}
                          </>
                        ) : uiState.activeTab === 'clientes' ? (
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
                                {(item as Cliente).cartera_nombre || `Cartera ID: ${(item as Cliente).cartera_id}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Users className="h-4 w-4 mr-1 text-orange-500" />
                                {(item as Cliente).minimo_personal || 0} personas
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Tooltip
                                content={
                                  <div className="max-w-xs">
                                    <div className="font-semibold text-white mb-2">
                                      Nodos del Cliente
                                    </div>
                                    {(() => {
                                      const nodosCliente = getNodosCliente((item as Cliente).id);
                                      if (nodosCliente.length === 0) {
                                        return (
                                          <div className="text-gray-300 text-sm">
                                            No hay nodos asignados
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="space-y-1">
                                          {nodosCliente.map((nodo: Nodo) => (
                                            <div key={nodo.id} className="text-sm text-gray-200">
                                              • {nodo.nombre}
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                }
                                position="top"
                              >
                                <div className="flex items-center text-sm text-gray-900 cursor-help">
                                  <Settings className="h-4 w-4 mr-1 text-blue-500" />
                                  {(item as Cliente).total_nodos} nodos
                                </div>
                              </Tooltip>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date((item as Cliente).created_at).toLocaleDateString()}
                              </div>
                            </td>
                            {/* Sin acciones */}
                          </>
                        ) : uiState.activeTab === 'nodos' ? (
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
                                {(item as Nodo).cliente_nombre || `Cliente ID: ${(item as Nodo).cliente_id}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {(item as Nodo).cartera_nombre || `Cartera ID: ${(item as Nodo).cartera_id}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date((item as Nodo).created_at).toLocaleDateString()}
                              </div>
                            </td>
                            {/* Sin acciones */}
                          </>
                        ) : null}
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
                    onClick={() => handlePageChange(uiState.page - 1)}
                    disabled={uiState.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === uiState.page
                          ? 'text-blue-600 bg-blue-50 border border-blue-300'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(uiState.page + 1)}
                    disabled={uiState.page === totalPages}
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
      <AgregarClienteModal
        isOpen={uiState.showAgregarClienteModal}
        onClose={() => handleModalToggle('showAgregarClienteModal', false)}
        onSuccess={(carteraId, clientes) => {
          console.log('Clientes agregados:', { carteraId, clientes });
          // Invalidar cache para refrescar los datos
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
          queryClient.invalidateQueries({ queryKey: ['carteras'] });
          // queryClient.invalidateQueries({ queryKey: ['minimo-personal'] }); // Deshabilitado temporalmente
          queryClient.invalidateQueries({ queryKey: ['estructura'] });
          queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
          handleModalToggle('showAgregarClienteModal', false);
        }}
        carteras={carteras || []}
      />

      <AgregarNodoModal
        isOpen={uiState.showAgregarNodoModal}
        onClose={() => handleModalToggle('showAgregarNodoModal', false)}
        onSuccess={(clienteId, nodos) => {
          console.log('Nodos agregados:', { clienteId, nodos });
          // Invalidar cache para refrescar los datos
          queryClient.invalidateQueries({ queryKey: ['nodos'] });
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
          queryClient.invalidateQueries({ queryKey: ['carteras'] });
          queryClient.invalidateQueries({ queryKey: ['estructura'] });
          queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
          handleModalToggle('showAgregarNodoModal', false);
        }}
        clientes={clientes || []}
      />

      <PrerrequisitosModal
        isOpen={uiState.showPrerrequisitosModal}
        onClose={() => handleModalToggle('showPrerrequisitosModal', false)}
        clienteId={navigationState.selectedCliente?.id || null}
        clienteNombre={navigationState.selectedCliente?.nombre || ''}
      />

      <GlobalPrerrequisitosModal
        isOpen={uiState.showGlobalPrerrequisitosModal}
        onClose={() => handleModalToggle('showGlobalPrerrequisitosModal', false)}
      />
    </div>
  );
};

