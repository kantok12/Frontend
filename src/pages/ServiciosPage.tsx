import React, { useEffect, useMemo, useCallback, useState } from 'react';
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
import apiService from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { PrerrequisitosCliente } from '../components/servicios/PrerrequisitosCliente';
import { PrerrequisitosModal } from '../components/servicios/PrerrequisitosModal';
import { PersonalDetailModal } from '../components/personal/PersonalDetailModal';
import { GlobalPrerrequisitosModal } from '../components/servicios/GlobalPrerrequisitosModal';

// Helper: normalize RUT to a canonical form (no dots, no dash, uppercase)
const normalizeRut = (r: any) => {
  if (!r && r !== 0) return '';
  try {
    return String(r).replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
  } catch (e) {
    return String(r || '').trim();
  }
};
// Normalizar respuesta de match a un objeto consistente
const normalizeMatch = (m: any) => {
  if (!m) return null;
  return m.data || m || null;
};
export const ServiciosPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Hooks optimizados
  const { uiState, handleTabChange, handlePageChange, handleSearchChange, handleSearchClear, handleModalToggle } = useUIState();
  const { navigationState, handleCarteraClick, handleClienteClick, handleNodoClick, handleBackToCarteras, handleBackToClientes } = useNavigationState();
  const { assignmentState, loadAssignedPersonal, handleAssign, handleUnassign, updateAssignmentState } = usePersonalAssignments();
  const { prereqState, loadPrerequisitosMatch, updatePrereqState } = usePrerequisitos();

  // Listado de personal para seleccionar (hasta 100, sin búsqueda para evitar llamadas excesivas)
  const { data: personListData, isLoading: personListLoading } = usePersonalList(1, 100, '', {});
  const personOptions = useMemo(() => personListData?.data?.items || [], [personListData]);

  // Estado local para resultados batch de prerrequisitos (por RUT)
  const [prereqBatch, setPrereqBatch] = useState<Record<string, any> | null>(null);
  const [prereqBatchLoading, setPrereqBatchLoading] = useState(false);
  const [prereqBatchError, setPrereqBatchError] = useState<string | null>(null);
  
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

  // Precalcular un mapa de mínimos por cliente para evitar búsquedas repetidas
  const minimosMap = useMemo(() => {
    const map: Record<number, number> = {};
    (minimosPersonal || []).forEach((mp: any) => {
      try {
        const clienteId = Number(mp.cliente_id);
        if (!isNaN(clienteId)) {
          map[clienteId] = mp.minimo_base || mp.minimo_personal || 0;
        }
      } catch (e) {
        // skip invalid entry
      }
    });
    return map;
  }, [minimosPersonal]);

  const getMinimoPersonalCliente = useCallback((clienteId: number) => {
    return minimosMap[clienteId] ?? null;
  }, [minimosMap]);

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

  // Paginación optimizada with useMemo
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

  // Cuando se selecciona un cliente (en nodos), obtener match batch de prerrequisitos
  // OPTIMIZACIÓN: evitar re-cargar innecesariamente
  useEffect(() => {
    const cargarBatch = async () => {
      setPrereqBatchError(null);
      if (!navigationState.selectedCliente) {
        setPrereqBatch(null);
        return;
      }
      // Usar ruts de personOptions (y de assignedPersonal por si faltan)
      const rutsSet = new Set<string>();
      personOptions.forEach((p: any) => p.rut && rutsSet.add(p.rut));
      (assignmentState.assignedPersonal || []).forEach((p: any) => p.rut && rutsSet.add(p.rut));
      const ruts = Array.from(rutsSet).slice(0, 250); // limitar por seguridad
      if (ruts.length === 0) {
        setPrereqBatch(null);
        return;
      }
      try {
        setPrereqBatchLoading(true);
        const resp: any = await apiService.matchPrerequisitosClienteBatch(navigationState.selectedCliente.id, ruts, { includeGlobal: true });
        // Normalizar respuesta a map rut -> data
        const map: Record<string, any> = {};
        const dataArray = resp?.data || resp?.data?.data || resp;
        // Si viene como array de resultados por rut
        if (Array.isArray(dataArray)) {
          dataArray.forEach((item: any) => {
            const key = item.rut || item?.data?.rut || item?.data?.payload?.rut;
            const value = item.data || item;
            if (key) {
              map[key] = value;
              const n = normalizeRut(key);
              if (n) map[n] = value;
            }
          });
        } else if (typeof dataArray === 'object') {
          // Si el servidor devolvió objeto con claves por rut
          Object.keys(dataArray).forEach((k) => {
            map[k] = dataArray[k];
            const n = normalizeRut(k);
            if (n) map[n] = dataArray[k];
          });
        }

        setPrereqBatch(map);
      } catch (e: any) {
        console.warn('Error cargando batch prerrequisitos:', e);
        setPrereqBatchError(e?.message || 'Error al cargar prerrequisitos batch');
      } finally {
        setPrereqBatchLoading(false);
      }
    };

    // Ejecutar cuando estamos en la pestaña de nodos o clientes (mostrar match)
    if ((uiState.activeTab === 'nodos' || uiState.activeTab === 'clientes') && navigationState.selectedCliente) {
      cargarBatch();
    } else {
      setPrereqBatch(null);
    }
  }, [navigationState.selectedCliente?.id, uiState.activeTab]);

  // Estados para abrir modal de Personal dentro de la vista Servicios (sin navegar)
  const [selectedPersonalDetail, setSelectedPersonalDetail] = useState<any | null>(null);
  const [showPersonalDetailModalLocal, setShowPersonalDetailModalLocal] = useState(false);

  // Paginación interna para cada sección
  const [pageWithout, setPageWithout] = useState(1);
  const [pageAssigned, setPageAssigned] = useState(1);
  const [pageGlobal, setPageGlobal] = useState(1);
  const PAGE_SIZE = 5;

  // Resetear páginas cuando cambia el cliente o la pestaña
  useEffect(() => {
    setPageWithout(1);
    setPageAssigned(1);
    setPageGlobal(1);
  }, [navigationState.selectedCliente, uiState.activeTab]);

  const openPersonalDetailModalLocal = useCallback(async (rut: string) => {
    if (!rut) return;
    // Intentar encontrar en personOptions primero
    const found = personOptions.find((p: any) => p.rut === rut || p.rut === String(rut));
    if (found) {
      setSelectedPersonalDetail(found);
      setShowPersonalDetailModalLocal(true);
      return;
    }
    try {
      const res: any = await apiService.getPersonalByRut(rut);
      const data = res?.data || res;
      setSelectedPersonalDetail(data);
      setShowPersonalDetailModalLocal(true);
    } catch (e) {
      alert('No se pudo cargar la información del personal.');
    }
  }, [personOptions]);

  // Enriquecer con nombres optimizado - solo si realmente faltan nombres
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
          // Solo consultar backend si realmente es necesario
          return p;
        })
      );
      updateAssignmentState({ assignedPersonal: updated });
    } catch (error) {
      console.warn('Error al hidratar nombres:', error);
    }
  }, [assignmentState.assignedPersonal, personOptions, updateAssignmentState]);

  useEffect(() => {
    if (assignmentState.assignedPersonal?.some(p => !p.nombre)) {
      hydrateNames();
    }
  }, [assignmentState.assignedPersonal, hydrateNames]);

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
  // NOTE: prerrequisitos parciales and name-fetching removed — using match endpoint exclusively
  // Add a type definition for the DebugWindow component
  const DebugWindow: React.FC<{ data: any }> = ({ data }) => {
    return (
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: '400px', height: '300px', overflow: 'auto', backgroundColor: '#f9f9f9', border: '1px solid #ccc', padding: '10px', zIndex: 1000 }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>Debug Data</h4>
        <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{JSON.stringify(data, null, 2)}</pre>
        <h4 style={{ margin: '10px 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>Nombres de Personal</h4>
        <ul>
          {data && Object.values(data).map((persona: any, index: number) => (
            <li key={index}>{persona.nombres || 'Nombre no disponible'}</li>
          ))}
        </ul>
      </div>
    );
  };

  

  // Debug flag (disabled by default in production)
  const showDebugData = false;

  return (
    <>
      {/* Pestañas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={handleBackToCarterasWithUI}
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
              onClick={handleBackToClientesWithUI}
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
        {((uiState.activeTab === 'nodos' || uiState.activeTab === 'clientes') && (navigationState.selectedCliente || navigationState.selectedNodo)) && (
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
                    {/* Mostrar primero personas provenientes del match (si están disponibles) */}
                    {prereqBatch && Object.keys(prereqBatch).length > 0 && (
                      <optgroup label="Personas (match)">
                        {Object.keys(prereqBatch).map((rutKey) => {
                          const entry: any = prereqBatch[rutKey] || {};
                          const match = normalizeMatch(entry);
                          // Mostrar solo personas que cumplen todos los prerrequisitos
                          if (!match || match.cumple !== true) return null;
                          const rutVal = rutKey;
                          const nombre = match?.nombres || match?.nombre || match?.nombres_persona || '';
                          const apellido = match?.apellidos || match?.apellido || '';
                          const display = nombre ? `${nombre}${apellido ? ' ' + apellido : ''}` : rutVal;
                          return (
                            <option key={`match-${rutVal}`} value={rutVal}>
                              {display} ({rutVal})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}

                    {/* Luego el listado general de personal */}
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
            {/* Nuevo: listado en tres secciones (solo en nodos) */}
            {uiState.activeTab === 'nodos' && navigationState.selectedCliente && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Resultados prerrequisitos {prereqBatchLoading ? '(cargando...)' : prereqBatchError ? '(error)' : ''}</div>
                {/* Filtrar pool de personas según búsqueda en assignmentState.personSearch */}
                {(() => {
                  const search = (assignmentState.personSearch || '').toLowerCase().trim();
                  // Pool: combinar personOptions + assigned
                  const poolMap: Record<string, any> = {};
                  personOptions.forEach((p: any) => { if (p?.rut) poolMap[p.rut] = p; });
                  (assignmentState.assignedPersonal || []).forEach((p: any) => { if (p?.rut && !poolMap[p.rut]) poolMap[p.rut] = p; });
                  const pool = Object.values(poolMap);

                  const assignedRuts = new Set((assignmentState.assignedPersonal || []).map((p: any) => p.rut));

                  const filtered = pool.filter((p: any) => {
                    if (!search) return true;
                    const name = ((p.nombre || p.nombres) + ' ' + (p.apellido || p.apellidos || '')).toLowerCase();
                    const rut = (p.rut || '').toLowerCase();
                    return name.includes(search) || rut.includes(search);
                  });

                  const withoutPrereq: any[] = [];
                  const withGlobal: any[] = [];
                  const assignedList: any[] = [];

                  filtered.forEach((p: any) => {
                    let info: any = null;
                    if (prereqBatch) {
                      const rawKey = p?.rut || String(p?.rut || '');
                      const nKey = normalizeRut(rawKey);
                      info = prereqBatch[rawKey] || (nKey ? prereqBatch[nKey] : null) || null;
                      // eslint-disable-next-line no-console
                      try { console.debug && console.debug('prereq lookup', { personRut: rawKey, normalizedRut: nKey, found: !!info }); } catch (e) {}
                    }

                    const match = info ? normalizeMatch(info) : null;
                    const faltantes: any[] = match?.faltantes || match?.missing_docs || [];
                    const meetsGlobal = match?.cumple === true;

                    // Determine if the person has provided any of the required documents
                    const providedCount: number | undefined = typeof match?.provided_count === 'number'
                      ? match.provided_count
                      : (Array.isArray(match?.documentos) ? (
                        // if the server returned documentos and requisitos, try to infer
                        (() => {
                          const reqTypes: string[] = (Array.isArray(match?.requisitos) ? match.requisitos : (match?.required_types || [])).map((r: any) => String(r).toLowerCase());
                          if (reqTypes.length === 0) return undefined;
                          const present = (match.documentos || []).map((d: any) => String(d.tipo_documento || d.tipo || '').toLowerCase());
                          return present.filter((t: string) => reqTypes.includes(t)).length;
                        })()
                      ) : undefined);

                    const requiredCount: number | undefined = typeof match?.required_count === 'number'
                      ? match.required_count
                      : (Array.isArray(match?.requisitos) ? match.requisitos.length : undefined);

                    const hasNone = (typeof providedCount === 'number' && providedCount === 0)
                      || (Array.isArray(faltantes) && typeof requiredCount === 'number' && faltantes.length === requiredCount);

                    if (assignedRuts.has(p.rut)) assignedList.push(p);
                    else if (meetsGlobal) withGlobal.push(p);
                    else if (hasNone) {
                      // Person does not have any document that matches client's prerequisites
                      withoutPrereq.push(p);
                    } else {
                      // Partial matches (some but not all) are intentionally not shown in selectable pools
                      // (keep them hidden to avoid partial-prereq flow)
                    }
                  });

                  const renderPersonItem = (p: any) => {
                    const display = p.nombre || p.nombres || p.rut;
                    const apellido = p.apellido || p.apellidos || '';
                    const label = `${display}${apellido ? ' ' + apellido : ''}`; // mostrar sólo nombre
                    return (
                      <li key={p.rut} className="flex items-center px-3 py-2 hover:bg-gray-50">
                          <div className="flex-1 pr-3">
                            <button
                              onClick={() => openPersonalDetailModalLocal(p.rut)}
                              className="text-left text-sm text-blue-600 hover:underline"
                              title={p.rut}
                            >
                              {label}
                            </button>
                          </div>
                          <div className="w-48 pl-3 border-l border-gray-300 text-xs text-gray-500 truncate">{(p.cargo || p.cargo_nombre) || ''}</div>
                        </li>
                    );
                  };

                  // Paginación interna
                  const pageSize = PAGE_SIZE;
                  const withoutTotal = withoutPrereq.length;
                  const assignedTotal = assignedList.length;
                  const globalTotal = withGlobal.length;

                  const withoutTotalPages = Math.max(1, Math.ceil(withoutTotal / pageSize));
                  const assignedTotalPages = Math.max(1, Math.ceil(assignedTotal / pageSize));
                  const globalTotalPages = Math.max(1, Math.ceil(globalTotal / pageSize));

                  const currentWithoutPage = Math.min(pageWithout, withoutTotalPages);
                  const currentAssignedPage = Math.min(pageAssigned, assignedTotalPages);
                  const currentGlobalPage = Math.min(pageGlobal, globalTotalPages);

                  const withoutStart = (currentWithoutPage - 1) * pageSize;
                  const assignedStart = (currentAssignedPage - 1) * pageSize;
                  const globalStart = (currentGlobalPage - 1) * pageSize;

                  const withoutPageItems = withoutPrereq.slice(withoutStart, withoutStart + pageSize);
                  const assignedPageItems = assignedList.slice(assignedStart, assignedStart + pageSize);
                  

                  const renderPagination = (current: number, totalPages: number, setPage: (n: number) => void, totalItems: number, startIndex: number) => {
                    if (totalPages <= 1) return null;
                    const maxButtons = 5; // show only 5 page buttons per group

                    // Determine current group based on current page
                    const groupIndex = Math.floor((current - 1) / maxButtons);
                    const groupStart = groupIndex * maxButtons + 1;
                    const groupEnd = Math.min(groupStart + maxButtons - 1, totalPages);

                    const pages: number[] = [];
                    for (let i = groupStart; i <= groupEnd; i++) pages.push(i);

                    return (
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-gray-500">Mostrando {Math.min(startIndex + 1, totalItems)} - {Math.min(startIndex + pageSize, totalItems)} de {totalItems}</div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setPage(Math.max(1, current - 1))}
                            disabled={current === 1}
                            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded disabled:opacity-50"
                          >Anterior</button>

                          {pages.map((num) => (
                            <button
                              key={num}
                              onClick={() => setPage(num)}
                              className={`px-2 py-1 text-xs rounded border ${num === current ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}
                            >{num}</button>
                          ))}

                          <button
                            onClick={() => setPage(Math.min(totalPages, current + 1))}
                            disabled={current === totalPages}
                            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded disabled:opacity-50"
                          >Siguiente</button>
                        </div>
                      </div>
                    );
                  };

                    return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-300 rounded-l-md shadow-sm overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-300 text-sm font-semibold">Personal sin Prerrequisitos</div>
                        {withoutPageItems.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No hay personas en esta categoría</div>
                        ) : (
                          <ul className="text-sm text-gray-800 divide-y divide-gray-200">{withoutPageItems.map(renderPersonItem)}</ul>
                        )}
                        <div className="px-3 py-2">{renderPagination(currentWithoutPage, withoutTotalPages, (n: number) => setPageWithout(n), withoutTotal, withoutStart)}</div>
                      </div>

                      <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-300 text-sm font-semibold">Personal Asignado</div>
                        {assignedPageItems.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No hay personal asignado.</div>
                        ) : (
                          <ul className="text-sm text-gray-800 divide-y divide-gray-200">{assignedPageItems.map(renderPersonItem)}</ul>
                        )}
                        <div className="px-3 py-2">{renderPagination(currentAssignedPage, assignedTotalPages, (n: number) => setPageAssigned(n), assignedTotal, assignedStart)}</div>
                      </div>
                      
                    </div>
                  );
                })()}
              </div>
            )}

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
                                  {(
                                    (getMinimoPersonalCliente((item as Cliente).id) !== null && typeof getMinimoPersonalCliente((item as Cliente).id) !== 'undefined')
                                    ? getMinimoPersonalCliente((item as Cliente).id)
                                    : ((item as Cliente).minimo_personal || 0)
                                  )} personas
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

      {/* Modal local para ver detalle de Personal sin navegar fuera de Servicios */}
      <PersonalDetailModal
        personal={selectedPersonalDetail}
        isOpen={showPersonalDetailModalLocal}
        onClose={() => { setShowPersonalDetailModalLocal(false); setSelectedPersonalDetail(null); }}
        onUpdate={() => loadAssignedPersonal(navigationState.selectedCartera, navigationState.selectedCliente, navigationState.selectedNodo)}
      />

      {/* Debug Window */}
      {showDebugData && <DebugWindow data={prereqBatch} />}
    </>
  );
};

