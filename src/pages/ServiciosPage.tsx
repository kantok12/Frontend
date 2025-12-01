import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Search, Plus, Settings, Users, Building2, MapPin, AlertCircle, ChevronRight, Globe, Upload } from 'lucide-react';
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
import { BelrayList } from '../components/servicios/BelrayList';
import { BelrayModal } from '../components/servicios/BelrayModal';
import { MetodoSubidaDocumentos } from '../components/servicios/MetodoSubidaDocumentos';
// import { PrerrequisitosParcialesModal } from '../components/servicios/PrerrequisitosParcialesModal';

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

  // Stable filters object to prevent infinite re-renders
  const personalListFilters = useMemo(() => ({}), []);
  // Listado de personal para seleccionar (hasta 100, sin búsqueda para evitar llamadas excesivas)
  const { data: personListData, isLoading: personListLoading } = usePersonalList(1, 100, '', personalListFilters);
  const personOptions = useMemo(() => personListData?.data?.items || [], [personListData]);

  // Estado local para resultados batch de prerrequisitos (por RUT)
  const [prereqBatch, setPrereqBatch] = useState<Record<string, any> | null>(null);
  const [prereqBatchLoading, setPrereqBatchLoading] = useState(false);
  const [prereqBatchError, setPrereqBatchError] = useState<string | null>(null);
  // Lista de personas que cumplen todos los prerrequisitos (endpoint /cumplen)
  const [cumplenList, setCumplenList] = useState<any[] | null>(null);
  const [cumplenLoading, setCumplenLoading] = useState(false);
  const [cumplenError, setCumplenError] = useState<string | null>(null);
  const [rawCumplen, setRawCumplen] = useState<any | null>(null);
  // parcialesList removed
  const [cumplenFilterMode, setCumplenFilterMode] = useState<'only' | 'max1' | 'all'>('only');
  const [showCumplenDebug, setShowCumplenDebug] = useState(false);
  
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
    // If we have the cartera list available, ensure the parent cartera is selected
    try {
      const parent = carteras.find((c: any) => Number(c.id) === Number(cliente.cartera_id));
      if (parent) handleCarteraClick(parent as any);
    } catch (err) {
      // ignore if carteras not available
    }
    handleClienteClick(cliente);
    handleTabChange('nodos');
  }, [handleClienteClick, handleTabChange, carteras, handleCarteraClick]);

  const handleNodoClickWithUI = useCallback((nodo: Nodo) => {
    try {
      // Try to select parent cliente and cartera when available
      const parentCliente = clientes.find((cl: any) => Number(cl.id) === Number(nodo.cliente_id));
      if (parentCliente) {
        const parentCartera = carteras.find((c: any) => Number(c.id) === Number(parentCliente.cartera_id));
        if (parentCartera) handleCarteraClick(parentCartera as any);
        handleClienteClick(parentCliente as any);
      }
    } catch (err) {
      // ignore lookup errors
    }
    handleNodoClick(nodo);
  }, [carteras, clientes, handleCarteraClick, handleClienteClick, handleNodoClick]);

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
    // Cargar lista de personas que cumplen todos los prerrequisitos del cliente
    const cargarCumplen = async () => {
      setCumplenError(null);
      if (!navigationState.selectedCliente) {
        setCumplenList(null);
        return;
      }
      try {
        setCumplenLoading(true);
        // Construir params según modo seleccionado
        const params: any = { includeGlobal: true, limit: 100 };
        if (cumplenFilterMode === 'only') params.onlyCompletos = true;
        if (cumplenFilterMode === 'max1') params.max_missing = 1;

        const resp: any = await apiService.getClienteCumplen(navigationState.selectedCliente.id, params);

        // Normalizar la forma de la respuesta esperada.
        // El backend puede devolver varias envolturas: { success, message, data: { ... } },
        // o directamente el objeto { completos, parciales } o incluso un array plano.
        const rawResp = resp || null;
        const maybeWrapper = rawResp?.data ?? rawResp;
        const payload = (maybeWrapper && maybeWrapper.success && maybeWrapper.data) ? maybeWrapper.data : maybeWrapper;

        // Debug: loguear formas para investigar discrepancias en tiempo de ejecución
        console.debug('[cumplen] resp', { resp: rawResp, maybeWrapper, payload });

        // Reusable validator: un documento es válido si no está marcado 'vencido' o su fecha de vencimiento está en el futuro
        const now = Date.now();
        const isValidDoc = (d: any) => {
          if (!d) return false;
          if (typeof d.vencido === 'boolean') return d.vencido === false;
          if (d.fecha_vencimiento) {
            try {
              const t = new Date(d.fecha_vencimiento).getTime();
              return !isNaN(t) && t > now;
            } catch (e) {
              return true;
            }
          }
          return true;
        };

        // Si viene la forma nueva con completos/parciales
        if (payload && (Array.isArray(payload.completos) || Array.isArray(payload.parciales))) {
          setRawCumplen(payload);
          // Aplicar filtro adicional: contar sólo documentos no vencidos para decidir cumplimiento

          const completosRaw = Array.isArray(payload.completos) ? payload.completos : [];
          const parcialesRaw = Array.isArray(payload.parciales) ? payload.parciales : [];

          const completosFiltered = completosRaw.filter((item: any) => {
            // Rechazar explícitamente si hay missing_count > 0
            if (typeof item.missing_count === 'number' && item.missing_count > 0) return false;
            if (item.matchesAll === false) return false;

            const required = typeof item.required_count === 'number' ? item.required_count : (Array.isArray(item.requisitos) ? item.requisitos.length : undefined);
            // Si no tenemos required, ser conservadores y excluirlo
            if (typeof required !== 'number') return false;

            const docs = Array.isArray(item.documentos) ? item.documentos : [];
            const validCount = docs.filter(isValidDoc).length;

            // Si backend aporta provided_count, también lo respetamos pero preferimos validCount
            const provided = typeof item.provided_count === 'number' ? item.provided_count : undefined;

            // Requerimos que el conteo de documentos válidos sea >= required
            if (validCount >= required) return true;

            // Como último recurso, si provided exists and is >= required, aceptar
            if (typeof provided === 'number' && provided >= required) return true;

            return false;
          });

          console.log('📋 [CUMPLEN] Lista filtrada de personas que cumplen:', {
            total: completosFiltered.length,
            personas: completosFiltered.map((p: any) => ({
              rut: p.rut || p.persona?.rut,
              nombre: p.persona?.nombres || p.nombres,
              required: p.required_count,
              provided: p.provided_count,
              missing: p.missing_count
            }))
          });

          setCumplenList(completosFiltered);
          // setParcialesList(parcialesRaw); // Removed
        } else {
          // Fallback: si el endpoint devolvió un array plano o formato antiguo
          // Normalizar rawList con varias formas posibles
          const rawList = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : (payload?.data?.matches || payload?.data?.items || []));
          setRawCumplen(Array.isArray(rawList) ? rawList : [payload]);

          // Procesar como antes (intentar inferir quienes cumplen), pero contando sólo documentos no vencidos
          const processed = (Array.isArray(rawList) ? rawList : [rawList]).map((item: any) => {
            const payload2 = item?.data || item?.match || item || {};
            const persona = item.persona || payload2.persona || payload2;
            const faltantes: any[] = payload2?.faltantes || payload2?.missing_docs || payload2?.missing || [];
            const cumpleFlag = (payload2?.cumple === true) || (item?.cumple === true) || (payload2?.meets === true) || (payload2?.passes === true);
            const docs = Array.isArray(payload2?.documentos) ? payload2.documentos : [];
            const providedValid = docs.filter(isValidDoc).length;
            const required = typeof payload2?.required_count === 'number' ? payload2.required_count : (Array.isArray(payload2?.requisitos) ? payload2.requisitos.length : undefined);
            const inferred = (Array.isArray(faltantes) && faltantes.length === 0) || (typeof providedValid === 'number' && typeof required === 'number' ? providedValid >= required : false);
            const cumple = (typeof payload2?.missing_count === 'number' ? payload2.missing_count === 0 : (payload2.matchesAll === true || cumpleFlag === true)) && (typeof required === 'number' ? providedValid >= required || (typeof payload2?.provided_count === 'number' && payload2.provided_count >= required) : false);
            return { raw: item, persona, cumple, providedValid, required, faltantes };
          });

          const filtered = processed.filter((p: any) => p.cumple).map((p: any) => p.raw);
          setCumplenList(filtered || []);
          // setParcialesList(null); // Removed
        }
      } catch (e: any) {
        console.warn('Error cargando lista cumplen:', e);
        setCumplenError(e?.message || 'Error al obtener lista cumplen');
        setCumplenList(null);
        // setParcialesList(null); // Removed
      } finally {
        setCumplenLoading(false);
      }
    };

    // Ejecutar cargarCumplen cuando hay cliente seleccionado
    if (navigationState.selectedCliente) cargarCumplen();
    else setCumplenList(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationState.selectedCliente?.id, cumplenFilterMode]);

  // ---------------------------------------------------------------------------
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
  // parcialesClienteId removed

  // Estados para Belray
  const [showBelrayModal, setShowBelrayModal] = useState(false);
  const [selectedBelrayEmpresa, setSelectedBelrayEmpresa] = useState<any | null>(null);

  // Estados para método de subida de documentos
  const [showMetodoSubidaModal, setShowMetodoSubidaModal] = useState(false);
  const [clienteMetodoSubida, setClienteMetodoSubida] = useState<any | null>(null);

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
      
      // Only update if there are actual changes to avoid infinite loops
      const hasChanges = updated.some((p, i) => p !== assignmentState.assignedPersonal![i]);
      if (hasChanges) {
        updateAssignmentState({ assignedPersonal: updated });
      }
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
    console.log('🎯 [UI] Iniciando asignación desde UI:', {
      rutSeleccionado: assignmentState.selectedRutToAssign,
      cartera: navigationState.selectedCartera?.nombre,
      cliente: navigationState.selectedCliente?.nombre,
      nodo: navigationState.selectedNodo?.nombre
    });
    
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
        console.warn('⚠️ [UI] Persona tiene problemas con prerrequisitos');
        handleModalToggle('showPrereqPanel', true);
        updatePrereqState({
          selectedRutForMatch: assignmentState.selectedRutToAssign,
          prereqData: result.prereqData
        });
      } else {
        console.log('✅ [UI] Asignación completada exitosamente');
      }
    } catch (e: any) {
      console.error('❌ [UI] Error en asignación:', e);
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

  // Compute strict groups from rawCumplen so UI can show 'completos' separately
  const computedCumplenGroups = useMemo(() => {
    const completos: any[] = [];
    // Parciales removed to save memory/cpu as requested
    const seenRuts = new Set<string>();

    if (!rawCumplen) return { completos };

    const isDocValid = (d: any) => {
      if (!d) return false;
      const isVencido = d.vencido === true || d.vencido === 'true';
      if (isVencido) return false;
      
      if (d.fecha_vencimiento) {
        const t = new Date(d.fecha_vencimiento).getTime();
        if (!isNaN(t) && t < Date.now()) return false;
      }
      return true;
    };

    const processItem = (item: any) => {
      const rut = item.rut || item.persona?.rut || item?.persona_rut || (item?.data && item.data.rut);
      const normalized = normalizeRut(rut);
      if (!normalized || seenRuts.has(normalized)) return;
      seenRuts.add(normalized);

      const docs = Array.isArray(item.documentos) ? item.documentos : [];
      const validCount = docs.filter(isDocValid).length;
      
      const required = typeof item.required_count === 'number' ? item.required_count : (Array.isArray(item.requisitos) ? item.requisitos.length : 0);
      const missing = typeof item.missing_count === 'number' ? item.missing_count : (Array.isArray(item.faltantes) ? item.faltantes.length : 0);
      
      // Strict criteria for "completos":
      const isComplete = (required > 0) && (validCount >= required) && (missing === 0);

      if (isComplete) {
        completos.push(item);
      }
    };

    if (Array.isArray(rawCumplen)) {
      rawCumplen.forEach(processItem);
    } else {
      const rc = rawCumplen as any;
      const completosRaw = Array.isArray(rc.completos) ? rc.completos : [];
      completosRaw.forEach(processItem);
    }

    return { completos };
  }, [rawCumplen]);

  // Memoize the categorized personal list to avoid expensive re-calculations on every render
  const categorizedPersonal = useMemo(() => {
    if (!navigationState.selectedCliente || uiState.activeTab !== 'nodos') return null;

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
      }

      const match = info ? normalizeMatch(info) : null;
      const faltantes: any[] = match?.faltantes || match?.missing_docs || [];
      const meetsGlobal = match?.cumple === true;

      const providedCount: number | undefined = typeof match?.provided_count === 'number'
        ? match.provided_count
        : (Array.isArray(match?.documentos) ? (
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
        withoutPrereq.push(p);
      }
    });

    return { withoutPrereq, assignedList, withGlobal };
  }, [assignmentState.personSearch, personOptions, assignmentState.assignedPersonal, prereqBatch, navigationState.selectedCliente, uiState.activeTab]);

  return (
    <>
      {/* (breadcrumb removed — only shown above the tabs) */}

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
            <button
              onClick={() => handleTabChange('belray')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                uiState.activeTab === 'belray'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Belray
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

      {/* Breadcrumb / guía de navegación: muestra Cartera > Cliente > Nodo cuando hay selección */}
      {(navigationState.selectedCartera || navigationState.selectedCliente || navigationState.selectedNodo) && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 bg-white rounded-md p-2 border border-gray-100">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => { handleBackToCarterasWithUI(); }}
                className="text-blue-600 hover:underline text-sm"
              >
                Carteras
              </button>
              <span className="text-gray-400">›</span>
              {navigationState.selectedCartera ? (
                <>
                  <button
                    onClick={() => { handleCarteraClickWithUI(navigationState.selectedCartera as any); handleTabChange('clientes'); }}
                    className="text-gray-800 hover:underline text-sm font-medium"
                  >
                    {navigationState.selectedCartera.nombre}
                  </button>
                  {navigationState.selectedCliente && (
                    <>
                      <span className="text-gray-400">›</span>
                      <button
                        onClick={() => { handleClienteClickWithUI(navigationState.selectedCliente as any); handleTabChange('nodos'); }}
                        className="text-gray-800 hover:underline text-sm font-medium"
                      >
                        {navigationState.selectedCliente.nombre}
                      </button>
                    </>
                  )}
                  {navigationState.selectedNodo && (
                    <>
                      <span className="text-gray-400">›</span>
                      <span className="text-gray-700 text-sm font-medium">{navigationState.selectedNodo.nombre}</span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-700">Todas</span>
              )}
            </nav>
          </div>
        </div>
      )}

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
              {/* Botón para abrir método de subida de documentos (solo en vista Clientes) */}
              {uiState.activeTab === 'clientes' && navigationState.selectedCliente && (
                <div className="ml-4">
                  <button
                    onClick={() => {
                      setClienteMetodoSubida(navigationState.selectedCliente);
                      setShowMetodoSubidaModal(true);
                    }}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                    title="Método de Subida de Documentos"
                  >
                    <Upload className="inline-block mr-2 h-4 w-4" />
                    Método de Subida
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Tabla dinámica según pestaña activa */}
      <div className="slide-up animate-delay-300">
        {/* Método de subida de documentos - Solo para clientes */}
        {(uiState.activeTab === 'clientes' && navigationState.selectedCliente) && (
          <div className="mb-6">
            <MetodoSubidaDocumentos
              clienteId={navigationState.selectedCliente.id}
              clienteNombre={navigationState.selectedCliente.nombre}
              metodoActual={navigationState.selectedCliente.metodo_subida_documentos}
              configActual={navigationState.selectedCliente.config_subida_documentos}
              onUpdate={() => {
                // Recargar datos del cliente
                queryClient.invalidateQueries({ queryKey: ['clientes'] });
              }}
            />
          </div>
        )}

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
                <div className="flex items-center space-x-2 mr-2">
                  <label className="text-xs text-gray-600">Mostrar:</label>
                  <select
                    value={cumplenFilterMode}
                    onChange={(e) => setCumplenFilterMode(e.target.value as any)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-md bg-white"
                  >
                    <option value="only">Solo completos</option>
                    <option value="max1">Completos + 1 faltante</option>
                    <option value="all">Todos (fallback)</option>
                  </select>
                  {/* Parciales button removed */}
                </div>
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
                  {/* If we have the server response, show strict groups: completos then parciales */}
                  {rawCumplen ? (
                    <>
                      {computedCumplenGroups.completos.length > 0 ? (
                        <optgroup label={`Personas (cumplen) (${computedCumplenGroups.completos.length})`}>
                          {computedCumplenGroups.completos.map((m: any) => {
                            const rutVal = m.rut || m.persona?.rut || m?.persona_rut || (m?.data && m.data.rut) || '';
                            const persona = m.persona || m.persona_data || m.data || m;
                            const nombre = persona?.nombres || persona?.nombre || persona?.nombres_persona || persona?.first_name || '';
                            const apellido = persona?.apellidos || persona?.apellido || persona?.last_name || '';
                            const display = nombre ? `${nombre}${apellido ? ' ' + apellido : ''}` : (rutVal || JSON.stringify(m));
                            if (!rutVal) return null;
                            return (
                              <option key={`cumplen-${rutVal}`} value={rutVal}>
                                {display} ({rutVal})
                              </option>
                            );
                          })}
                        </optgroup>
                      ) : (
                        <option value="" disabled>No hay personas que cumplen todos los prerrequisitos</option>
                      )}

                      {/* Parciales hidden as requested */}
                    </>
                  ) : (
                    personOptions.map((p: any) => (
                      <option key={p.rut} value={p.rut}>
                        {p.nombre} {p.apellido} ({p.rut})
                      </option>
                    ))
                  )}
                </select>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    onClick={() => setShowCumplenDebug(s => !s)}
                    className="text-xs px-2 py-1 bg-gray-100 rounded border border-gray-200 hover:bg-gray-200"
                  >
                    {showCumplenDebug ? 'Ocultar debug' : 'Ver debug /cumplen'}
                  </button>
                </div>
                {cumplenError && (
                  <div className="text-sm text-red-600 mt-1">Error verificando quiénes cumplen: {String(cumplenError)}</div>
                )}
              </div>
              <button
                onClick={handleAssignWithUI}
                disabled={
                  assignmentState.assigning ||
                  !assignmentState.selectedRutToAssign.trim() ||
                  (Array.isArray(cumplenList) && cumplenList.length === 0) ||
                  Boolean(cumplenError)
                }
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
                  if (!categorizedPersonal) return null;
                  const { withoutPrereq, assignedList } = categorizedPersonal;

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

                  const withoutTotalPages = Math.max(1, Math.ceil(withoutTotal / pageSize));
                  const assignedTotalPages = Math.max(1, Math.ceil(assignedTotal / pageSize));

                  const currentWithoutPage = Math.min(pageWithout, withoutTotalPages);
                  const currentAssignedPage = Math.min(pageAssigned, assignedTotalPages);

                  const withoutStart = (currentWithoutPage - 1) * pageSize;
                  const assignedStart = (currentAssignedPage - 1) * pageSize;

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
             uiState.activeTab === 'nodos' ? 'Nodos' : 
             uiState.activeTab === 'belray' ? 'Empresas Belray' : 'Prerrequisitos'} ({uiState.activeTab === 'belray' ? '' : `${total} registros`})
          </h2>
        </div>

        {/* Render Belray content */}
        {uiState.activeTab === 'belray' ? (
          <BelrayList
            onAddClick={() => {
              setSelectedBelrayEmpresa(null);
              setShowBelrayModal(true);
            }}
            onEditClick={(empresa) => {
              setSelectedBelrayEmpresa(empresa);
              setShowBelrayModal(true);
            }}
          />
        ) : (
          <>
        {/* Original table content for carteras/clientes/nodos */}
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
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
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
                          uiState.activeTab === 'nodos' ? () => handleNodoClickWithUI(item as Nodo) :
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
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleClienteClick(item as Cliente); handleModalToggle('showPrerrequisitosModal', true); }}
                                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                >
                                  Prerrequisitos
                                </button>
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setClienteMetodoSubida(item as Cliente);
                                    setShowMetodoSubidaModal(true);
                                  }}
                                  className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                                  title="Método de Subida de Documentos"
                                >
                                  <Upload className="inline-block h-3 w-3 mr-1" />
                                  Subida
                                </button>
                              </div>
                            </td>
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
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {/* Parciales button removed */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); /* open client prereqs for the node's client */ handleClienteClick({ id: (item as Nodo).cliente_id } as any); handleModalToggle('showPrerrequisitosModal', true); }}
                                  className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                >
                                  Prerrequisitos
                                </button>
                              </div>
                            </td>
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

      {/* Modal para agregar/editar empresas Belray */}
      <BelrayModal
        isOpen={showBelrayModal}
        onClose={() => {
          setShowBelrayModal(false);
          setSelectedBelrayEmpresa(null);
        }}
        empresa={selectedBelrayEmpresa}
      />

      {/* Modal para método de subida de documentos */}
      {showMetodoSubidaModal && clienteMetodoSubida && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <MetodoSubidaDocumentos
              clienteId={clienteMetodoSubida.id}
              clienteNombre={clienteMetodoSubida.nombre}
              metodoActual={clienteMetodoSubida.metodo_subida_documentos}
              configActual={clienteMetodoSubida.config_subida_documentos}
              onUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ['clientes'] });
                setShowMetodoSubidaModal(false);
                setClienteMetodoSubida(null);
              }}
            />
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowMetodoSubidaModal(false);
                  setClienteMetodoSubida(null);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PrerrequisitosParcialesModal removed */}

      {/* Modal local para ver detalle de Personal sin navegar fuera de Servicios */}
      <PersonalDetailModal
        personal={selectedPersonalDetail}
        isOpen={showPersonalDetailModalLocal}
        onClose={() => { setShowPersonalDetailModalLocal(false); setSelectedPersonalDetail(null); }}
        onUpdate={() => loadAssignedPersonal(navigationState.selectedCartera, navigationState.selectedCliente, navigationState.selectedNodo)}
      />

      {/* Debug Window */}
      {showDebugData && <DebugWindow data={prereqBatch} />}
      {showCumplenDebug && (
        <div className="fixed bottom-4 left-4 right-4 max-h-72 overflow-auto bg-white border p-3 rounded shadow-lg z-50">
          <h4 className="font-semibold mb-2">Debug /prerrequisitos/clientes/:clienteId/cumplen</h4>
          <div className="text-xs text-gray-600 mb-2">Raw response (rawCumplen)</div>
          <pre className="text-xs bg-gray-50 p-2 rounded mb-2">{JSON.stringify(rawCumplen, null, 2)}</pre>
          <div className="text-xs text-gray-600 mb-2">Filtrados (cumplenList)</div>
          <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(cumplenList, null, 2)}</pre>
        </div>
      )}
    </>
  );
};

