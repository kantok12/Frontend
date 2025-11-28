import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePersonalList, useDeletePersonal } from '../hooks/usePersonal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PersonalForm } from '../components/personal/PersonalForm';
import { PersonalDetailModal } from '../components/personal/PersonalDetailModal';
import { ProfileImage } from '../components/common/ProfileImage';
import { Search, Plus, Trash2, Eye, User, Mail, CheckCircle, XCircle, Activity, FileText, Upload } from 'lucide-react';
import { Personal } from '../types';
import { formatRUT } from '../utils/formatters';

// Estados de actividad (para UI, no relacionados con backend)
const estadosActividad = [
  { id: 'activo', label: 'Activo', color: 'green', icon: CheckCircle },
  { id: 'inactivo', label: 'Inactivo', color: 'red', icon: XCircle }
];

// Función para obtener estado visual según estado_nombre del backend
const getEstadoVisual = (estadoNombre?: string) => {
  const nombre = (estadoNombre || '').toLowerCase();
  if (nombre.includes('asignado')) return { label: 'Asignado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
  if (nombre.includes('vacacion')) return { label: 'Vacaciones', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Activity };
  if (nombre.includes('capacit')) return { label: 'Capacitación', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Activity };
  if (nombre.includes('examen')) return { label: 'Exámenes', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Activity };
  if (nombre.includes('desvinc')) return { label: 'Desvinculado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle };
  if (nombre.includes('licencia')) return { label: 'Licencia médica', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Activity };
  // Fallback: usar campo activo clásico
  return (estadoNombre?.toLowerCase() === 'activo')
    ? { label: 'Activo', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle }
    : { label: estadoNombre || 'Sin estado', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Activity };
};

// Función para formatear fecha (comentada porque no se usa actualmente)
// const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('es-CL', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   });
// };

// Función para formatear fecha de actualización (sin hora)
const formatUpdateTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minutos`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    // Para fechas de más de un día, mostrar solo la fecha sin hora
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
};

export const PersonalPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

    // Nuevos filtros: por cargo, estado y licencia (reemplazan filtro por tipo de documento)
    const [filterCargo, setFilterCargo] = useState<string>('todos');
    const [filterEstadoPersonal, setFilterEstadoPersonal] = useState<string>('todos');
    const [filterLicencia, setFilterLicencia] = useState<string>('todos');
    // Filtros adicionales solicitados: zona geográfica y empresa
    const [filterZona, setFilterZona] = useState<string>('todos');
    const [filterEmpresa, setFilterEmpresa] = useState<string>('todos');

  // Debounce search para evitar demasiadas consultas
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 Actualizando búsqueda debounced:', search);
      setDebouncedSearch(search);
      setPage(1); // Reset página cuando cambie búsqueda
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [search]);

    // Determinar si hay filtros locales activos (cargo/estado/licencia/zona/empresa)
    const hasLocalFilters = (
      filterCargo !== 'todos' || filterEstadoPersonal !== 'todos' || filterLicencia !== 'todos' ||
      filterZona !== 'todos' || filterEmpresa !== 'todos'
    );

  // Si hay filtros locales, pedimos más registros al backend para filtrar en cliente (limit grande)
  const fetchPage = hasLocalFilters ? 1 : page;
  const fetchLimit = hasLocalFilters ? 1000 : limit;

  // Usar el hook original para obtener datos del backend con búsqueda debounced
  const { data: personalData, isLoading, error, refetch } = usePersonalList(fetchPage, fetchLimit, debouncedSearch);
  // También obtener un conjunto amplio para poblar selectores (opciones globales)
  const { data: personalAllData } = usePersonalList(1, 1000, '');
  const personalForOptions = personalAllData?.data?.items || [];
  const deletePersonalMutation = useDeletePersonal();

  // Función para verificar si una persona tiene documentación completa
  const verificarDocumentacionCompleta = async (personalId: string) => {
    try {
      // Obtener documentos de la persona
      const response = await fetch(`/api/documentos/persona/${personalId}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      const documentos = data.data || [];
      
      // Documentos requeridos básicos
      const documentosRequeridos = ['contrato', 'identidad', 'medico', 'antecedentes'];
      
      // Verificar que tenga al menos los documentos básicos
      const tiposDocumentos = documentos.map((doc: any) => doc.tipo_documento);
      const tieneTodosRequeridos = documentosRequeridos.every(tipo => 
        tiposDocumentos.includes(tipo)
      );
      
      return tieneTodosRequeridos;
    } catch (error) {
      console.error('Error verificando documentación:', error);
      return false;
    }
  };

  // Filtrado simplificado por cargo/estado/licencia/zona/empresa
  const filtrarPersonalPorDocumentos = (personal: Personal[]) => {
    return personal.filter(persona => {
      const cargoNorm = (persona.cargo || '').trim().toLowerCase();
      const estadoNorm = (persona.estado_nombre || '').trim().toLowerCase();

      // Licencia: considerar campo legacy y array de licencias
      const licenciaTarget = (filterLicencia || '').toLowerCase();
      const licenciaLegacy = (persona.licencia_conducir || '').toString().toLowerCase().trim();
      const licArr = Array.isArray((persona as any).licencias) ? (persona as any).licencias : [];

      if (filterCargo !== 'todos' && cargoNorm !== filterCargo) return false;
      if (filterEstadoPersonal !== 'todos' && estadoNorm !== filterEstadoPersonal) return false;

      if (filterLicencia !== 'todos') {
        if (licenciaLegacy === licenciaTarget) {
          // matches legacy field
        } else {
          // check array entries
          let matched = false;
          for (const lic of licArr) {
            const t = (lic?.tipo || lic?.clase || lic?.numero || '').toString().toLowerCase().trim();
            if (t && t === licenciaTarget) { matched = true; break; }
          }
          if (!matched) return false;
        }
      }

      const zonaNorm = (persona.zona_geografica || '').trim().toLowerCase();
      if (filterZona !== 'todos' && zonaNorm !== filterZona) return false;

      const empresaNorm = (persona.empresa?.nombre || '').trim().toLowerCase();
      if (filterEmpresa !== 'todos' && empresaNorm !== filterEmpresa) return false;

      return true;
    });
  };

  // Función para buscar personal específico por RUT
  const buscarPersonalPorRUT = async (rut: string) => {
    try {
      console.log('🔍 Buscando personal específico por RUT:', rut);
      
      // Primero intentar con filtro de búsqueda
      setDebouncedSearch(rut);
      
      // Esperar a que se ejecute la búsqueda
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refrescar los datos
      const resultado = await refetch();
      
      console.log('🔍 Resultado de búsqueda específica:', resultado.data);
      console.log('🔍 Items encontrados:', resultado.data?.data?.items?.length);
      console.log('🔍 RUTs en resultado:', resultado.data?.data?.items?.map(p => p.rut));
      
      // Buscar en los nuevos datos
      let personalEncontrado = resultado.data?.data?.items?.find((p: Personal) => {
        console.log('🔍 Comparando RUT:', p.rut, 'con:', rut);
        if (p.rut === rut) {
          console.log('✅ RUT exacto encontrado:', p.rut);
          return true;
        }
        const rutNormalizado = p.rut?.replace(/[.-]/g, '');
        const rutBuscadoNormalizado = rut?.replace(/[.-]/g, '');
        console.log('🔍 Comparando normalizado:', rutNormalizado, 'con:', rutBuscadoNormalizado);
        if (rutNormalizado === rutBuscadoNormalizado) {
          console.log('✅ RUT normalizado encontrado:', p.rut);
          return true;
        }
        return false;
      });
      
      // Si no se encuentra con filtro, intentar sin filtro (buscar en todos los datos)
      if (!personalEncontrado) {
        console.log('🔍 No encontrado con filtro, intentando búsqueda sin filtro...');
        
        // Limpiar filtro
        setDebouncedSearch('');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Refrescar sin filtro
        const resultadoSinFiltro = await refetch();
        
        console.log('🔍 Resultado sin filtro:', resultadoSinFiltro.data);
        console.log('🔍 Items sin filtro:', resultadoSinFiltro.data?.data?.items?.length);
        console.log('🔍 RUTs sin filtro:', resultadoSinFiltro.data?.data?.items?.map(p => p.rut));
        
        // Buscar en todos los datos
        personalEncontrado = resultadoSinFiltro.data?.data?.items?.find((p: Personal) => {
          if (p.rut === rut) return true;
          const rutNormalizado = p.rut?.replace(/[.-]/g, '');
          const rutBuscadoNormalizado = rut?.replace(/[.-]/g, '');
          return rutNormalizado === rutBuscadoNormalizado;
        });
      }
      
      if (personalEncontrado) {
        console.log('✅ Personal encontrado:', personalEncontrado);
      } else {
        console.warn('⚠️ No se encontró personal para RUT:', rut);
      }
      
      return personalEncontrado;
    } catch (error) {
      console.error('❌ Error al buscar personal por RUT:', error);
      return null;
    }
  };

  // Escuchar evento personalizado para abrir modal desde notificaciones
  useEffect(() => {
    const handleOpenPersonalDetailModal = async (event: CustomEvent) => {
      const { personalId, rutPersona, source, retryCount = 0 } = event.detail;
      console.log('🔔 Evento recibido para abrir modal:', { personalId, rutPersona, source, retryCount });
      console.log('🔍 Datos de personal disponibles:', personalData?.data?.items?.length, 'personas');
      console.log('🔍 Estado de carga:', isLoading);
      
      // Si los datos aún no están cargados y venimos de navegación global, esperar un poco más
      if (isLoading && source === 'global-navigation' && retryCount < 3) {
        console.log('⏳ Datos aún cargando, reintentando en 500ms...');
        setTimeout(() => {
          const retryEvent = new CustomEvent('openPersonalDetailModal', {
            detail: { 
              personalId, 
              rutPersona, 
              source, 
              retryCount: retryCount + 1,
              timestamp: new Date().toISOString()
            }
          });
          window.dispatchEvent(retryEvent);
        }, 500);
        return;
      }
      
      // Si aún no hay datos después de varios reintentos, forzar búsqueda específica
      if (!personalData?.data?.items || personalData.data.items.length === 0) {
        console.log('🔍 No hay datos de personal, forzando búsqueda específica...');
        const rutABuscar = rutPersona || personalId;
        const personalEncontradoBusqueda = await buscarPersonalPorRUT(rutABuscar);
        
        if (personalEncontradoBusqueda) {
          console.log('👤 Personal encontrado con búsqueda forzada:', personalEncontradoBusqueda);
          setSelectedPersonal(personalEncontradoBusqueda);
          setShowDetailModal(true);
        } else {
          console.warn('⚠️ No se encontró personal con búsqueda forzada:', { personalId, rutPersona });
          alert(`No se encontró personal con RUT: ${rutPersona}. Verifique que el personal esté registrado en el sistema.`);
        }
        return;
      }
      
      // Buscar el personal por ID o RUT (el personalId puede ser el RUT)
      let personalEncontrado = personalData?.data?.items?.find((p: Personal) => {
        // Buscar por ID numérico
        if (p.id === personalId) return true;
        // Buscar por RUT (comparar con personalId o rutPersona)
        if (p.rut === personalId || p.rut === rutPersona) return true;
        // Buscar por RUT sin puntos ni guiones (normalizar)
        const rutNormalizado = p.rut?.replace(/[.-]/g, '');
        const personalIdNormalizado = personalId?.replace(/[.-]/g, '');
        const rutPersonaNormalizado = rutPersona?.replace(/[.-]/g, '');
        if (rutNormalizado === personalIdNormalizado || rutNormalizado === rutPersonaNormalizado) return true;
        return false;
      });
      
      // Si no se encuentra en los datos actuales, buscar específicamente por RUT
      if (!personalEncontrado) {
        console.log('🔍 No encontrado en datos actuales, buscando específicamente por RUT...');
        
        const rutABuscar = rutPersona || personalId;
        const personalEncontradoBusqueda = await buscarPersonalPorRUT(rutABuscar);
        personalEncontrado = personalEncontradoBusqueda || undefined;
        
        if (personalEncontrado) {
          console.log('👤 Personal encontrado después de búsqueda específica:', personalEncontrado);
          setSelectedPersonal(personalEncontrado);
          // Agregar un pequeño delay para que la transición sea más suave
          setTimeout(() => {
            setShowDetailModal(true);
          }, 100);
        } else {
          console.warn('⚠️ No se encontró personal después de búsqueda específica:', { personalId, rutPersona });
          alert(`No se encontró personal con RUT: ${rutPersona}. Verifique que el personal esté registrado en el sistema.`);
        }
      } else {
        console.log('👤 Personal encontrado en datos actuales:', personalEncontrado);
        setSelectedPersonal(personalEncontrado);
        // Agregar un pequeño delay para que la transición sea más suave
        setTimeout(() => {
          setShowDetailModal(true);
        }, 100);
      }
    };

    // Agregar listener para el evento personalizado
    window.addEventListener('openPersonalDetailModal', handleOpenPersonalDetailModal as unknown as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('openPersonalDetailModal', handleOpenPersonalDetailModal as unknown as EventListener);
    };
  }, [personalData, refetch, isLoading]);

  // Verificar si hay que reabrir un modal después de un reload (por edición de usuario)
  useEffect(() => {
    const rutToReopen = sessionStorage.getItem('reopenPersonalModal');
    console.log('🔍 Verificando sessionStorage al cargar página:', { rutToReopen, isLoading, hasData: !!personalData?.data?.items });
    
    if (rutToReopen && !isLoading && personalData?.data?.items) {
      console.log('✅ Reabriendo modal para RUT:', rutToReopen);
      // Limpiar el sessionStorage para que no se reabra cada vez
      sessionStorage.removeItem('reopenPersonalModal');
      
      // Despachar evento para abrir el modal con ese RUT
      setTimeout(() => {
        console.log('🚀 Despachando evento openPersonalDetailModal para RUT:', rutToReopen);
        const event = new CustomEvent('openPersonalDetailModal', {
          detail: { 
            personalId: rutToReopen, 
            rutPersona: rutToReopen,
            source: 'after-edit-reload',
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(event);
      }, 300); // Delay para asegurar que todo esté renderizado
    }
  }, [isLoading, personalData]);

  // Cuando cambian los filtros, volver a la primera página
  useEffect(() => {
    setPage(1);
  }, [filterCargo, filterEstadoPersonal, filterLicencia]);

  // Extraer datos de la respuesta
  const personalListOriginal = personalData?.data?.items || [];
  const serverTotal = personalData?.data?.total || 0;
  const serverTotalPages = personalData?.data?.totalPages || 1;

  // Determinar modo: si hay filtros locales, filtramos en cliente (fetchLimit fue grande)
  const clientMode = hasLocalFilters;

  // Valores calculados para renderizado (pueden venir del servidor o del cliente)
  let displayList: Personal[] = [];
  let displayTotal = 0;
  let effectiveTotalPages = 1;
  let effectiveStart = 0;
  let effectiveEnd = 0;

  if (clientMode) {
    const filtered = filtrarPersonalPorDocumentos(personalListOriginal);
    displayTotal = filtered.length;
    effectiveTotalPages = Math.max(1, Math.ceil(displayTotal / limit));

    const start = (page - 1) * limit;
    const end = Math.min(start + limit, displayTotal);
    displayList = filtered.slice(start, end);
    effectiveStart = start + 1;
    effectiveEnd = end;
  } else {
    // Usar paginación provista por el servidor
    displayList = personalListOriginal;
    displayTotal = serverTotal;
    effectiveTotalPages = serverTotalPages;
    effectiveStart = (page - 1) * limit + 1;
    effectiveEnd = (page - 1) * limit + displayList.length;
  }

  // Un solo useEffect para asegurar que la página actual esté dentro de rangos válidos.
  // No se llama condicionalmente para respetar las reglas de Hooks.
  useEffect(() => {
    if (page > effectiveTotalPages) setPage(1);
  }, [page, effectiveTotalPages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    // El refetch se ejecutará automáticamente porque cambió el queryKey con el nuevo search
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleView = (personal: Personal) => {
    setSelectedPersonal(personal);
    setShowDetailModal(true);
  };

  const handleDelete = (personal: Personal) => {
    console.log('🗑️ Intentando eliminar personal:', personal);
    setSelectedPersonal(personal);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedPersonal) {
      try {
        console.log('🗑️ Confirmando eliminación de:', selectedPersonal);
        const idToDelete = selectedPersonal.id || selectedPersonal.rut;
        console.log('🗑️ ID a eliminar:', idToDelete);
        
        await deletePersonalMutation.mutateAsync(idToDelete);
        
        console.log('✅ Personal eliminado exitosamente');
        setShowDeleteModal(false);
        setSelectedPersonal(null);
        refetch();
        
        // Mostrar mensaje de éxito
        alert(`Personal "${selectedPersonal.nombre} ${selectedPersonal.apellido}" eliminado exitosamente`);
      } catch (error) {
        console.error('❌ Error al eliminar personal:', error);
        alert(`Error al eliminar personal: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  };

  const handleFormSuccess = () => {
    refetch();
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPersonal(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar el personal</p>
          <button 
            onClick={() => refetch()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 fade-in">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
          <Link
            to="/estado-documentacion"
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Estado de Documentación
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/personal/multi-upload"
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            title="Carga múltiple"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span>Carga Múltiple</span>
          </Link>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary btn-action hover-grow"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Personal</span>
          </button>
        </div>
      </div>



      {/* Barra de búsqueda */}
      <div className="card hover-lift slide-up animate-delay-200 mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT, cargo, zona geográfica..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 text-sm"
            />
          </div>
          <button
            type="submit"
            className="btn-primary whitespace-nowrap py-2 px-4 text-sm"
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

      {/* Filtros */}
      <div className="card hover-lift slide-up animate-delay-250 mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          {/* Filtro por Cargo */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Cargo:</label>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="todos">Todos los cargos</option>
              {Array.from(new Set(personalListOriginal.map(p => (p.cargo || '').trim()).filter(Boolean))).map((c: any) => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Zona Geográfica */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Zona:</label>
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="todos">Todas</option>
              {Array.from(new Set(personalListOriginal.map(p => (p.zona_geografica || '').trim()).filter(Boolean))).map((z: any) => (
                <option key={z} value={z.toLowerCase()}>{z}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Estado:</label>
            <select
              value={filterEstadoPersonal}
              onChange={(e) => setFilterEstadoPersonal(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="todos">Todos los estados</option>
              {Array.from(new Set(personalListOriginal.map(p => (p.estado_nombre || '').trim()).filter(Boolean))).map((s: any) => (
                <option key={s} value={s.toLowerCase()}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Licencia de conducir */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Licencia:</label>
            <select
              value={filterLicencia}
              onChange={(e) => setFilterLicencia(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="todos">Todas</option>
                  {(() => {
                    const values: string[] = [];
                    // use broader list for options to show all possible licenses
                    const source = personalForOptions.length > 0 ? personalForOptions : personalListOriginal;
                    source.forEach(p => {
                      const lc = p.licencia_conducir;
                      if (lc && typeof lc === 'string' && lc.trim()) values.push(lc.trim());
                      const licArr = (p as any).licencias;
                      if (Array.isArray(licArr)) {
                        licArr.forEach((lic: any) => {
                          const t = lic?.tipo || lic?.clase || lic?.numero || '';
                          if (t && typeof t === 'string' && t.trim()) values.push(t.trim());
                        });
                      }
                    });
                    // Lista canónica de clases de licencia que siempre deben mostrarse
                    const canonical = ['A1','A2','A3','A4','A5','B','C','D','E','F'];
                    const map = new Map<string, string>();
                    // Añadir canónicos primero (mantener orden)
                    canonical.forEach(c => map.set(c.toLowerCase(), c));

                    // Añadir valores detectados dinámicamente
                    values.forEach(v => {
                      const key = v.toLowerCase();
                      if (!map.has(key)) map.set(key, v);
                    });

                    // Renderizar en el orden: canónicos primero, luego el resto detectado
                    return Array.from(map.values()).map((l: any) => (
                      <option key={l} value={l.toLowerCase()}>{l}</option>
                    ));
                  })()}
            </select>
          </div>

          {/* Filtro por Empresa */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Empresa:</label>
            <select
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="todos">Todas</option>
              {Array.from(new Set(personalListOriginal.map(p => (p.empresa?.nombre || '').trim()).filter(Boolean))).map((emp: any) => (
                <option key={emp} value={emp.toLowerCase()}>{emp}</option>
              ))}
            </select>
          </div>

          {/* Servicio / Fecha creación / Documentación filters removed */}

          {/* Botón para limpiar filtros */}
          {(filterCargo !== 'todos' || filterEstadoPersonal !== 'todos' || filterLicencia !== 'todos') && (
            <button
              onClick={() => {
                setFilterCargo('todos');
                setFilterEstadoPersonal('todos');
                setFilterLicencia('todos');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Cards de personal */}
      <div className="slide-up animate-delay-300">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Personal ({displayTotal} registros)
            {debouncedSearch && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                - Búsqueda: "{debouncedSearch}"
              </span>
            )}
            {(filterCargo !== 'todos' || filterEstadoPersonal !== 'todos' || filterLicencia !== 'todos') && (
              <span className="ml-2 text-sm font-normal text-green-600">
                - Filtros activos
              </span>
            )}
          </h2>
          {search && search !== debouncedSearch && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Buscando...
            </div>
          )}
        </div>

        {displayTotal === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {debouncedSearch ? (
              <div>
                <p className="text-lg font-medium mb-2">No se encontraron resultados</p>
                <p className="text-sm">No hay personal que coincida con "{debouncedSearch}"</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              'No hay personal registrado'
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayList.map((persona: Personal, index: number) => {
                const estado = getEstadoVisual(persona.estado_nombre);
                const IconComponent = estado.icon;

                return (
                  <div key={persona.id} className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 stagger-item animate-delay-${(index + 1) * 100}`}>
                    {/* Header con foto y info básica */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <ProfileImage 
                            rut={persona.rut}
                            nombre={persona.nombre}
                            apellido={persona.apellido}
                            size="md"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {persona.nombre} {persona.apellido}
                          </h3>
                          <p className="text-sm text-gray-600">{persona.cargo}</p>
                          <div className="flex items-center mt-1 text-sm text-blue-600">
                            <User className="h-3 w-3 mr-1" />
                            {persona.empresa?.nombre || 'No asignada'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{persona.zona_geografica || 'No asignada'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            RUT: {formatRUT(persona.rut)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
                            <div className="flex items-center text-xs text-gray-600">
                              <svg className="h-3 w-3 mr-1 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.05.36 2.07.72 3.03a2 2 0 0 1-.45 2.11L8.09 10.91c1.45 3.02 3.98 5.55 6.99 7l1.95-1.95a2 2 0 0 1 2.11-.45c.96.36 1.98.6 3.03.72A2 2 0 0 1 22 16.92z"></path></svg>
                              <span>{persona.telefono || 'No asignada'}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              <span>{persona.email || 'No asignada'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="text-primary-600 hover:text-primary-900 p-2 rounded-full hover:bg-primary-50"
                          onClick={() => handleView(persona)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button 
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                          onClick={() => handleDelete(persona)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Estado actual (desde backend) */}
                    <div className="mb-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${estado.color}`}>
                        <IconComponent className="h-4 w-4 mr-2" />
                        {estado.label}
                      </div>
                      <span className="ml-3 text-xs text-gray-500">
                        Actualizado: {formatUpdateTime(persona.updated_at || new Date().toISOString())}
                      </span>
                    </div>


                    {/* Información de Nacimiento */}
                    {/* <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</h4>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {formatDate(persona.fecha_nacimiento)}
                      </p>
                    </div> */}

                    {/* Información de Registro */}
                    {/* <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Zona Geográfica</h4>
                      <p className="text-sm text-gray-600 italic">
                        {persona.zona_geografica}
                      </p>
                    </div> */}

                    {/* Información Adicional: sexo, licencia, contacto y emergencia */}
                    <div className="border-t pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{persona.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                        </div>

                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          <span>Licencia: {persona.licencia_conducir || 'No asignada'}</span>
                        </div>

                        <div className="flex items-center">
                          <svg className="h-3 w-3 mr-1 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.05.36 2.07.72 3.03a2 2 0 0 1-.45 2.11L8.09 10.91c1.45 3.02 3.98 5.55 6.99 7l1.95-1.95a2 2 0 0 1 2.11-.45c.96.36 1.98.6 3.03.72A2 2 0 0 1 22 16.92z"></path></svg>
                          <span>{(persona.contacto?.telefono) || persona.telefono || 'Sin teléfono'}</span>
                        </div>

                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          <span>{(persona.contacto?.email) || persona.email || 'Sin email'}</span>
                        </div>

                        {/* Contacto de emergencia */}
                        <div className="col-span-1 sm:col-span-2 mt-1 text-xs text-gray-600">
                          <div className="font-medium text-gray-700">Contacto de Emergencia</div>
                          {persona.contacto_emergencia ? (
                            <div className="flex items-center space-x-3 mt-1">
                              <div className="text-xs text-gray-600">
                                <div><strong>{persona.contacto_emergencia.nombre}</strong> ({persona.contacto_emergencia.relacion})</div>
                                <div className="flex items-center text-xs text-gray-600">
                                  <svg className="h-3 w-3 mr-1 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.05.36 2.07.72 3.03a2 2 0 0 1-.45 2.11L8.09 10.91c1.45 3.02 3.98 5.55 6.99 7l1.95-1.95a2 2 0 0 1 2.11-.45c.96.36 1.98.6 3.03.72A2 2 0 0 1 22 16.92z"></path></svg>
                                  <span>{persona.contacto_emergencia.telefono}</span>
                                </div>
                                {persona.contacto_emergencia.email && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Mail className="h-3 w-3 mr-1" />
                                    <span>{persona.contacto_emergencia.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-1">Sin contacto de emergencia registrado</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {effectiveTotalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-8">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === effectiveTotalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{effectiveStart}</span> a{' '}
                        <span className="font-medium">{effectiveEnd}</span>{' '}
                        de <span className="font-medium">{displayTotal}</span> resultados
                      </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: effectiveTotalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === page
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === effectiveTotalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedPersonal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header del modal */}
            <div className="bg-red-50 border-b border-red-200 p-6 rounded-t-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-900">
                    Eliminar Personal
                  </h3>
                  <p className="text-sm text-red-700">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  ¿Estás seguro de que deseas eliminar a este personal?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedPersonal.nombre} {selectedPersonal.apellido}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedPersonal.cargo}
                      </p>
                      <p className="text-xs text-gray-500">
                        RUT: {selectedPersonal.rut}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Advertencia:</strong> Esta acción eliminará permanentemente todos los datos del personal, incluyendo cursos, documentos y asignaciones.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPersonal(null);
                  }}
                  disabled={deletePersonalMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletePersonalMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {deletePersonalMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear personal */}
      <PersonalForm
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSuccess={handleFormSuccess}
      />

      {/* Modal para ver detalles del personal */}
      <PersonalDetailModal
        personal={selectedPersonal}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onUpdate={refetch}
      />

      {/* Multi-upload ahora es una página separada (/personal/multi-upload) */}

    </div>
  );
};