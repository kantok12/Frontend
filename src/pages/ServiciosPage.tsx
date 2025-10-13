import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Search, Plus, Settings, Users, Building2, MapPin, AlertCircle, ChevronRight } from 'lucide-react';
import { useServiciosPage } from '../hooks/useServicios';
import { Tooltip } from '../components/common/Tooltip';
import { Cartera, Cliente, Nodo } from '../types';
import { AgregarClienteModal } from '../components/servicios/AgregarClienteModal';
import { AgregarNodoModal } from '../components/servicios/AgregarNodoModal';
import { usePersonalList } from '../hooks/usePersonal';
import { apiService } from '../services/api';

export const ServiciosPage: React.FC = () => {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<'carteras' | 'clientes' | 'nodos'>('carteras');
  
  // Estados para los modales
  const [showAgregarClienteModal, setShowAgregarClienteModal] = useState(false);
  const [showAgregarNodoModal, setShowAgregarNodoModal] = useState(false);
  
  // Estado para navegación jerárquica
  const [selectedCartera, setSelectedCartera] = useState<Cartera | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null);
  const [assignedPersonal, setAssignedPersonal] = useState<{ rut: string; nombre?: string }[] | null>(null);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [selectedRutToAssign, setSelectedRutToAssign] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [unassigningRut, setUnassigningRut] = useState<string | null>(null);
  const [showPrereqPanel, setShowPrereqPanel] = useState(false);
  const [selectedRutForMatch, setSelectedRutForMatch] = useState('');
  const [prereqLoading, setPrereqLoading] = useState(false);
  const [prereqError, setPrereqError] = useState<string | null>(null);
  const [prereqData, setPrereqData] = useState<any | null>(null);

  // Listado de personal para seleccionar (hasta 100, con búsqueda)
  const { data: personListData, isLoading: personListLoading } = usePersonalList(1, 100, personSearch);
  const personOptions = personListData?.data?.items || [];
  
  // Estados comunes
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  
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
  

  // Funciones helper para obtener nombres por ID
  const getCarteraNombre = (carteraId: number) => {
    const cartera = carteras.find((c: Cartera) => c.id === carteraId);
    return cartera ? cartera.nombre : `Cartera ID: ${carteraId}`;
  };

  const getClienteNombre = (clienteId: number) => {
    const cliente = clientes.find((c: Cliente) => c.id === clienteId);
    return cliente ? cliente.nombre : `Cliente ID: ${clienteId}`;
  };

  const getNodosCliente = (clienteId: number) => {
    return nodos.filter((n: Nodo) => n.cliente_id === clienteId);
  };

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

  // Sin acciones: se eliminan handlers de ver/editar/eliminar

  // Funciones para navegación jerárquica
  const handleCarteraClick = (cartera: Cartera) => {
    setSelectedCartera(cartera);
    setSelectedCliente(null);
    setSelectedNodo(null);
    setActiveTab('clientes');
    setPage(1);
    setSearch('');
  };

  const handleClienteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setSelectedNodo(null);
    setActiveTab('nodos');
    setPage(1);
    setSearch('');
  };

  const handleBackToCarteras = () => {
    setSelectedCartera(null);
    setSelectedCliente(null);
    setSelectedNodo(null);
    setActiveTab('carteras');
    setPage(1);
    setSearch('');
  };

  const handleBackToClientes = () => {
    setSelectedCliente(null);
    setSelectedNodo(null);
    setActiveTab('clientes');
    setPage(1);
    setSearch('');
  };

  // Cargar asignaciones según selección actual
  useEffect(() => {
    const load = async () => {
      setAssignedError(null);
      setAssignedPersonal(null);
      if (!selectedCartera && !selectedCliente && !selectedNodo) return;
      setAssignedLoading(true);
      try {
        if (selectedNodo) {
          const res = await apiService.getPersonalByNodo(selectedNodo.id);
          setAssignedPersonal(res.data as any);
        } else if (selectedCliente) {
          const res = await apiService.getPersonalByCliente(selectedCliente.id);
          setAssignedPersonal(res.data as any);
        } else if (selectedCartera) {
          const res = await apiService.getPersonalByCartera(selectedCartera.id);
          setAssignedPersonal(res.data as any);
        }
        setShowPrereqPanel(false);
        setPrereqData(null);
      } catch (e: any) {
        setAssignedError(e?.message || 'Error al cargar asignaciones');
      } finally {
        setAssignedLoading(false);
      }
    };
    load();
  }, [selectedCartera, selectedCliente, selectedNodo]);

  // Enriquecer con nombres si llegan solo RUTs
  useEffect(() => {
    const hydrateNames = async () => {
      if (!assignedPersonal || assignedPersonal.length === 0) return;
      const needLookup = assignedPersonal.filter(p => !p.nombre);
      if (needLookup.length === 0) return;
      try {
        const updated = await Promise.all(
          assignedPersonal.map(async (p) => {
            if (p.nombre) return p;
            // Intentar encontrar en la lista ya cargada
            const found = personOptions.find((x: any) => x.rut === p.rut);
            if (found) {
              return { ...p, nombre: `${found.nombre} ${found.apellido}`.trim() };
            }
            // Consultar al backend por RUT
            try {
              const res = await apiService.getPersonalByRut(p.rut);
              const data: any = res.data || {};
              const full = data.nombres || data.nombre || data.nombre_completo || '';
              const nombreCompuesto = full ? full : undefined;
              return { ...p, nombre: nombreCompuesto };
            } catch {
              return p;
            }
          })
        );
        setAssignedPersonal(updated);
      } catch {
        // Ignorar
      }
    };
    hydrateNames();
  }, [assignedPersonal, personOptions]);

  const handleAssign = async () => {
    if (!selectedRutToAssign.trim()) return;
    setAssigning(true);
    try {
      if (selectedNodo) {
        await apiService.assignNodoToPersona(selectedRutToAssign.trim(), selectedNodo.id);
      } else if (selectedCliente) {
        // 1) Verificar requisitos ANTES de asignar
        const match = await apiService.matchPrerequisitosCliente(selectedCliente.id, selectedRutToAssign.trim());
        const validacion = (match as any)?.data || match;
        const faltantes = validacion?.faltantes || [];
        if (faltantes.length > 0) {
          // Bloquear y mostrar faltantes
          setShowPrereqPanel(true);
          setSelectedRutForMatch(selectedRutToAssign.trim());
          setPrereqData(validacion);
          setAssigning(false);
          return;
        }
        // 2) Si no hay faltantes, proceder a asignar
        await apiService.assignClienteToPersona(selectedRutToAssign.trim(), selectedCliente.id);
      } else if (selectedCartera) {
        await apiService.assignCarteraToPersona(selectedRutToAssign.trim(), selectedCartera.id);
      }
      setSelectedRutToAssign('');
      // Refrescar asignados
      if (selectedNodo) {
        const res = await apiService.getPersonalByNodo(selectedNodo.id);
        setAssignedPersonal(res.data as any);
      } else if (selectedCliente) {
        const res = await apiService.getPersonalByCliente(selectedCliente.id);
        setAssignedPersonal(res.data as any);
      } else if (selectedCartera) {
        const res = await apiService.getPersonalByCartera(selectedCartera.id);
        setAssignedPersonal(res.data as any);
      }
    } catch (e: any) {
      alert(e?.message || 'Error al asignar');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (rut: string) => {
    if (!rut) return;
    setUnassigningRut(rut);
    try {
      if (selectedNodo) {
        await apiService.unassignNodoFromPersona(rut, selectedNodo.id);
      } else if (selectedCliente) {
        await apiService.unassignClienteFromPersona(rut, selectedCliente.id);
      } else if (selectedCartera) {
        await apiService.unassignCarteraFromPersona(rut, selectedCartera.id);
      }
      // Refrescar asignados
      if (selectedNodo) {
        const res = await apiService.getPersonalByNodo(selectedNodo.id);
        setAssignedPersonal(res.data as any);
      } else if (selectedCliente) {
        const res = await apiService.getPersonalByCliente(selectedCliente.id);
        setAssignedPersonal(res.data as any);
      } else if (selectedCartera) {
        const res = await apiService.getPersonalByCartera(selectedCartera.id);
        setAssignedPersonal(res.data as any);
      }
    } catch (e: any) {
      alert(e?.message || 'Error al desasignar');
    } finally {
      setUnassigningRut(null);
    }
  };

  const loadPrerequisitosMatch = async (rut?: string) => {
    const rutToUse = rut || selectedRutForMatch;
    if (!selectedCliente || !rutToUse) return;
    setPrereqLoading(true);
    setPrereqError(null);
    try {
      const res = await apiService.matchPrerequisitosCliente(selectedCliente.id, rutToUse);
      setPrereqData(res.data);
      setSelectedRutForMatch(rutToUse);
    } catch (e: any) {
      setPrereqError(e?.message || 'Error al cargar prerrequisitos');
    } finally {
      setPrereqLoading(false);
    }
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
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Servicios</h1>
            <p className="text-gray-600 mt-1">Administra carteras, clientes y nodos de servicios</p>
          </div>
          
          {/* Botones de acción según pestaña activa */}
          <div className="flex gap-3">
            {activeTab === 'clientes' && (
              <button
                onClick={() => setShowAgregarClienteModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Cliente
              </button>
            )}
            
            {activeTab === 'nodos' && (
              <button
                onClick={() => setShowAgregarNodoModal(true)}
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

      {/* Resumen sutil extendido según pestaña activa */}
      <div className="mb-6 slide-up animate-delay-300">
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-6">
            {/* Información principal de la pestaña */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                {activeTab === 'carteras' ? <Building2 className="h-4 w-4 text-gray-600" /> :
                 activeTab === 'clientes' ? <Users className="h-4 w-4 text-gray-600" /> :
                 <MapPin className="h-4 w-4 text-gray-600" />}
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  {activeTab === 'carteras' ? 'Carteras' : 
                   activeTab === 'clientes' ? 'Clientes' : 'Nodos'}
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
                  {isLoading ? '...' : `${page} de ${totalPages}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Tabla dinámica según pestaña activa */}
      <div className="slide-up animate-delay-300">
        {/* Panel de personal asignado según la selección */}
        {(selectedCartera || selectedCliente || selectedNodo) && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Personal asignado a {selectedNodo ? 'Nodo' : selectedCliente ? 'Cliente' : 'Cartera'}
              </h3>
              {selectedCliente && (
                <button
                  onClick={() => setShowPrereqPanel((v) => !v)}
                  className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50"
                  title="Ver prerrequisitos del cliente"
                >
                  {showPrereqPanel ? 'Ocultar Prerrequisitos' : 'Ver Prerrequisitos'}
                </button>
              )}
            </div>
            {/* Formulario de asignación: seleccionar personal de una lista */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar personal por nombre o RUT..."
                  value={personSearch}
                  onChange={(e) => setPersonSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                  value={selectedRutToAssign}
                  onChange={(e) => setSelectedRutToAssign(e.target.value)}
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
                onClick={handleAssign}
                disabled={assigning || !selectedRutToAssign.trim()}
                className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {assigning ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
            {assignedLoading ? (
              <div className="flex items-center text-gray-600 text-sm">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Cargando personal asignado...</span>
              </div>
            ) : assignedError ? (
              <div className="text-sm text-red-600">{assignedError}</div>
            ) : !assignedPersonal || assignedPersonal.length === 0 ? (
              <div className="text-sm text-gray-500">No hay personal asignado.</div>
            ) : (
              <ul className="text-sm text-gray-800 space-y-2">
                {assignedPersonal.map((p) => (
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
                      onClick={() => handleUnassign(p.rut)}
                      disabled={unassigningRut === p.rut}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      {unassigningRut === p.rut ? 'Quitando...' : 'Quitar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Panel de Prerrequisitos por Cliente (match con RUT) */}
        {showPrereqPanel && selectedCliente && (
          <div className="mb-6 bg-white rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerrequisitos del Cliente</h3>
            <div className="flex items-center gap-2 mb-4">
              <select
                value={selectedRutForMatch}
                onChange={(e) => setSelectedRutForMatch(e.target.value)}
                className="w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Seleccionar trabajador asignado</option>
                {(assignedPersonal || []).map((p) => (
                  <option key={p.rut} value={p.rut}>{p.nombre ? `${p.nombre} (${p.rut})` : p.rut}</option>
                ))}
              </select>
              <button
                onClick={() => loadPrerequisitosMatch()}
                disabled={!selectedRutForMatch || prereqLoading}
                className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {prereqLoading ? 'Cargando...' : 'Ver estado'}
              </button>
            </div>
            {prereqError && <div className="text-sm text-red-600 mb-2">{prereqError}</div>}
            {prereqLoading ? (
              <div className="flex items-center text-gray-600 text-sm"><LoadingSpinner size="sm" /><span className="ml-2">Cargando...</span></div>
            ) : prereqData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Requisitos para trabajar a este cliente</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {(prereqData.requisitos || []).map((r: any, idx: number) => (
                      <li key={idx}>{r.tipo_documento}{r.obligatorio ? ' (Obligatorio)' : ''}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Cumplidos por el trabajador</h4>
                  <ul className="list-disc pl-5 space-y-1 text-green-700">
                    {(prereqData.cumplidos || []).map((r: any, idx: number) => (
                      <li key={idx}>{r.tipo_documento}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Faltantes para habilitar al trabajador</h4>
                  <ul className="list-disc pl-5 space-y-1 text-red-700">
                    {(prereqData.faltantes || []).map((r: any, idx: number) => (
                      <li key={idx}>{r.tipo_documento}{r.obligatorio ? ' (Obligatorio)' : ''}</li>
                    ))}
                  </ul>
                  {(prereqData.por_vencer || []).length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-medium text-yellow-700 mb-1">Documentos por vencer</h5>
                      <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                        {(prereqData.por_vencer || []).map((r: any, idx: number) => (
                          <li key={idx}>{r.tipo_documento}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Selecciona un trabajador asignado y pulsa "Ver estado" para ver si cumple con los prerrequisitos del cliente.</p>
            )}
          </div>
        )}
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
                          {/* Sin acciones */}
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
                          {/* Sin acciones */}
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
                          {/* Sin acciones */}
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
                          () => setSelectedNodo(item as Nodo)
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
                            {/* Sin acciones */}
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
                                {getCarteraNombre((item as Cliente).cartera_id)}
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
                                {getClienteNombre((item as Nodo).cliente_id)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getCarteraNombre((item as Nodo).cartera_id || 0)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date((item as Nodo).created_at).toLocaleDateString()}
                              </div>
                            </td>
                            {/* Sin acciones */}
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
      <AgregarClienteModal
        isOpen={showAgregarClienteModal}
        onClose={() => setShowAgregarClienteModal(false)}
        onSuccess={(carteraId, clientes) => {
          console.log('Clientes agregados:', { carteraId, clientes });
          // Aquí podrías refrescar los datos o mostrar un mensaje de éxito
          setShowAgregarClienteModal(false);
        }}
        carteras={carteras || []}
      />

      <AgregarNodoModal
        isOpen={showAgregarNodoModal}
        onClose={() => setShowAgregarNodoModal(false)}
        onSuccess={(clienteId, nodos) => {
          console.log('Nodos agregados:', { clienteId, nodos });
          // Aquí podrías refrescar los datos o mostrar un mensaje de éxito
          setShowAgregarNodoModal(false);
        }}
        clientes={clientes || []}
      />
    </div>
  );
};

