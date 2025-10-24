import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Download, Users, CheckCircle, XCircle, Settings, BarChart3, Clock, MapPin, Search, Filter, X, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useProgramacionOptimizada } from '../hooks/useProgramacionOptimizada';
import { useCarteras } from '../hooks/useCarteras';
import { usePersonalList } from '../hooks/usePersonal';
import { ProgramacionCalendarioModal } from '../components/programacion/ProgramacionCalendarioModal';
import { ProgramacionOptimizadaModal } from '../components/programacion/ProgramacionOptimizadaModal';
import { RestablecerProgramacionModal } from '../components/programacion/RestablecerProgramacionModal';
import { useClientes, useNodos, useServiciosPage } from '../hooks/useServicios';
import { useQueryClient } from '@tanstack/react-query';
import { exportarPlanificacionPDF } from '../utils/pdfExporter';

export const CalendarioPage: React.FC = () => {
  const [vistaCalendario, setVistaCalendario] = useState<'planificacion' | 'semana' | 'dia' | 'semanal-completa'>('planificacion');
  const queryClient = useQueryClient();
  
  // Estados para la planificación semanal
  const [fechaInicioSemana, setFechaInicioSemana] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes de esta semana
    return lunes;
  });
  
  // Estados para la integración con la API
  const [showProgramacionCalendarioModal, setShowProgramacionCalendarioModal] = useState(false);
  const [showProgramacionOptimizadaModal, setShowProgramacionOptimizadaModal] = useState(false);
  const [showRestablecerModal, setShowRestablecerModal] = useState(false);
  const [vistaTabla, setVistaTabla] = useState<'simple' | 'jerarquica'>('jerarquica');
  
  // Estados para filtros
  const [filtroCartera, setFiltroCartera] = useState<string>('');
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  const [filtroNodo, setFiltroNodo] = useState<string>('');
  const [filtroPersonal, setFiltroPersonal] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  
  // Hooks para datos
  const { data: carterasData } = useCarteras();
  const { data: clientesData } = useClientes({ limit: 1000 });
  const { data: nodosData } = useNodos({ limit: 1000 });
  const { data: personalData } = usePersonalList();

  // Funciones auxiliares para el sistema optimizado
  const calcularTotalHoras = () => {
    return datosFiltrados.reduce((total: number, p: any) => {
      return total + (p.horas_estimadas || 0);
    }, 0);
  };

  const getTrabajadoresUnicos = () => {
    return datosFiltrados.map(p => p.rut);
  };

  // Hook para programación optimizada con fallback
  const fechaFinSemana = new Date(fechaInicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  // Usar la primera cartera disponible o 6 (BAKERY - CARNES) como fallback
  const carteraId = carterasData?.data && carterasData.data.length > 0 
    ? parseInt(carterasData.data[0].id) 
    : 6; // Fallback a BAKERY - CARNES que sabemos que funciona
    
  const { 
    data: programacionData, 
    isLoading: isLoadingProgramacion, 
    error: errorProgramacion,
    isFallback
  } = useProgramacionOptimizada(
    carteraId, // Usar cartera válida
    fechaInicioSemana.toISOString().split('T')[0], // fechaInicio
    fechaFinSemana.toISOString().split('T')[0] // fechaFin
  );

  // Datos de programación
  const programacion = programacionData?.data?.programacion || [];

  // Función para procesar datos del sistema optimizado
  const procesarDatosOptimizados = () => {
    if (!programacion || programacion.length === 0) return [];
    
    const trabajadoresMap = new Map();
    
    // Procesar cada fecha y sus trabajadores
    programacion.forEach((dia: any) => {
      if (dia.trabajadores && dia.trabajadores.length > 0) {
        dia.trabajadores.forEach((trabajador: any) => {
          const key = `${trabajador.rut}_${trabajador.cartera_id}`;
          
          if (!trabajadoresMap.has(key)) {
            trabajadoresMap.set(key, {
              id: trabajador.id,
              rut: trabajador.rut,
              nombre_persona: trabajador.nombre_persona,
              cargo: trabajador.cargo,
              cartera_id: trabajador.cartera_id,
              nombre_cartera: trabajador.nombre_cartera,
              cliente_id: trabajador.cliente_id,
              nombre_cliente: trabajador.nombre_cliente,
              nodo_id: trabajador.nodo_id,
              nombre_nodo: trabajador.nombre_nodo,
              lunes: false,
              martes: false,
              miercoles: false,
              jueves: false,
              viernes: false,
              sabado: false,
              domingo: false,
              horas_estimadas: 0,
              observaciones: trabajador.observaciones || '',
              estado: trabajador.estado
            });
          }
          
          // Marcar el día correspondiente
          const trabajadorData = trabajadoresMap.get(key);
          const diaSemana = dia.dia_semana.toLowerCase();
          
          if (diaSemana === 'lunes') trabajadorData.lunes = true;
          else if (diaSemana === 'martes') trabajadorData.martes = true;
          else if (diaSemana === 'miercoles') trabajadorData.miercoles = true;
          else if (diaSemana === 'jueves') trabajadorData.jueves = true;
          else if (diaSemana === 'viernes') trabajadorData.viernes = true;
          else if (diaSemana === 'sabado') trabajadorData.sabado = true;
          else if (diaSemana === 'domingo') trabajadorData.domingo = true;
          
          // Sumar horas estimadas
          trabajadorData.horas_estimadas += trabajador.horas_estimadas || 0;
        });
      }
    });
    
    return Array.from(trabajadoresMap.values());
  };

  // Datos procesados para la tabla
  const datosProcesados = procesarDatosOptimizados();

  // Función para filtrar datos
  const filtrarDatos = () => {
    let datosFiltrados = [...datosProcesados];

    // Filtro por cartera
    if (filtroCartera) {
      datosFiltrados = datosFiltrados.filter(d => 
        d.cartera_id === filtroCartera || d.nombre_cartera?.toLowerCase().includes(filtroCartera.toLowerCase())
      );
    }

    // Filtro por cliente
    if (filtroCliente) {
      datosFiltrados = datosFiltrados.filter(d => 
        d.cliente_id === filtroCliente || d.nombre_cliente?.toLowerCase().includes(filtroCliente.toLowerCase())
      );
    }

    // Filtro por nodo
    if (filtroNodo) {
      datosFiltrados = datosFiltrados.filter(d => 
        d.nodo_id === filtroNodo || d.nombre_nodo?.toLowerCase().includes(filtroNodo.toLowerCase())
      );
    }

    // Filtro por personal
    if (filtroPersonal) {
      datosFiltrados = datosFiltrados.filter(d => 
        d.rut === filtroPersonal || d.nombre_persona?.toLowerCase().includes(filtroPersonal.toLowerCase())
      );
    }

    // Búsqueda general
    if (busqueda) {
      const terminoBusqueda = busqueda.toLowerCase();
      datosFiltrados = datosFiltrados.filter(d => 
        d.nombre_persona?.toLowerCase().includes(terminoBusqueda) ||
        d.nombre_cartera?.toLowerCase().includes(terminoBusqueda) ||
        d.nombre_cliente?.toLowerCase().includes(terminoBusqueda) ||
        d.nombre_nodo?.toLowerCase().includes(terminoBusqueda) ||
        d.rut?.toLowerCase().includes(terminoBusqueda) ||
        d.cargo?.toLowerCase().includes(terminoBusqueda)
      );
    }

    return datosFiltrados;
  };

  // Datos filtrados para mostrar
  const datosFiltrados = filtrarDatos();

  // Función para contar filtros activos
  const contarFiltrosActivos = () => {
    let count = 0;
    if (filtroCartera) count++;
    if (filtroCliente) count++;
    if (filtroNodo) count++;
    if (filtroPersonal) count++;
    if (busqueda) count++;
    return count;
  };

  const filtrosActivos = contarFiltrosActivos();

  // Funciones para la planificación semanal
  const handleCambiarSemana = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaInicioSemana);
    if (direccion === 'anterior') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    }
    setFechaInicioSemana(nuevaFecha);
    
    // Limpiar filtros al cambiar de semana para mostrar todos los datos
    setFiltroCartera('');
    setFiltroCliente('');
    setFiltroNodo('');
    setFiltroPersonal('');
    setBusqueda('');
  };

  // Función para alternar día (sistema optimizado)
  const handleAlternarDia = async (programacionId: number, dia: string) => {
    console.log('Alternar día:', programacionId, dia);
    // TODO: Implementar lógica para sistema optimizado
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Función para obtener los días de la semana
  const getDiasSemana = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicioSemana);
      fecha.setDate(fechaInicioSemana.getDate() + i);
      dias.push({
        fecha,
        nombre: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
        nombreCompleto: fecha.toLocaleDateString('es-ES', { weekday: 'long' })
      });
    }
    return dias;
  };

  // Función para organizar datos jerárquicamente
  const organizarDatosJerarquicos = () => {
    if (!programacion || programacion.length === 0) return [];

    const datosOrganizados: any = {};

    programacion.forEach((item: any) => {
      const carteraId = item.cartera_id;
      const carteraNombre = item.nombre_cartera;
      const rut = item.rut;
      const nombrePersonal = item.nombre_personal;

      if (!datosOrganizados[carteraId]) {
        datosOrganizados[carteraId] = {
          id: carteraId,
          nombre: carteraNombre,
          personal: {}
        };
      }

      if (!datosOrganizados[carteraId].personal[rut]) {
        datosOrganizados[carteraId].personal[rut] = {
          rut,
          nombre: nombrePersonal,
          nodos: {}
        };
      }

      const clienteId = item.cliente_id;
      const nodoId = item.nodo_id;
      const clienteNombre = item.cliente_nombre;
      const nodoNombre = item.nodo_nombre;

      if (clienteId && nodoId) {
        const nodoKey = `${clienteId}-${nodoId}`;
        if (!datosOrganizados[carteraId].personal[rut].nodos[nodoKey]) {
          datosOrganizados[carteraId].personal[rut].nodos[nodoKey] = {
            clienteId,
            clienteNombre,
            nodoId,
            nodoNombre,
            dias: {
              lunes: item.lunes || false,
              martes: item.martes || false,
              miercoles: item.miercoles || false,
              jueves: item.jueves || false,
              viernes: item.viernes || false,
              sabado: item.sabado || false,
              domingo: item.domingo || false
            }
          };
        }
      }
    });

    return Object.values(datosOrganizados);
  };

  const diasSemana = getDiasSemana();
  const datosJerarquicos = organizarDatosJerarquicos();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planificación Semanal</h1>
          <p className="text-gray-600 mt-1">Gestiona las asignaciones de personal a carteras por semana</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              📊 Todas las Carteras ({carterasData?.data?.length || 0})
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              👥 Personal ({personalData?.data?.total || 0})
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              🏢 Clientes ({clientesData?.data?.length || 0})
            </span>
          </div>
        </div>
             <div className="flex space-x-3">
               <button
                 onClick={() => {
                   console.log('🔄 Refrescando datos...');
                   queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
                   queryClient.invalidateQueries({ queryKey: ['carteras'] });
                   queryClient.invalidateQueries({ queryKey: ['personal'] });
                   queryClient.invalidateQueries({ queryKey: ['clientes'] });
                 }}
                 className="btn-secondary hover-grow"
               >
                 <Settings className="h-4 w-4" />
                 Refresh
               </button>
               <button
                 onClick={() => setShowProgramacionCalendarioModal(true)}
                 className="btn-primary hover-grow"
               >
                 <Plus className="h-4 w-4" />
                 Agregar Programación
               </button>
             </div>
      </div>

      {/* Controles del calendario */}
      <div className="card hover-lift slide-up animate-delay-200 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleCambiarSemana('anterior')}
              className="btn-secondary hover-grow"
            >
              <ChevronLeft className="h-4 w-4" />
              Semana Anterior
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {formatearFecha(fechaInicioSemana)} - {formatearFecha(new Date(fechaInicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000))}
              </h2>
              <p className="text-sm text-gray-600">Semana de planificación</p>
            </div>
            <button
              onClick={() => handleCambiarSemana('siguiente')}
              className="btn-secondary hover-grow"
            >
              Semana Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                console.log('🔄 Refrescando datos de programación...');
                queryClient.invalidateQueries({ queryKey: ['programacion'] });
                queryClient.invalidateQueries({ queryKey: ['programacion', 'semana', 0, fechaInicioSemana.toISOString().split('T')[0]] });
                queryClient.invalidateQueries({ queryKey: ['carteras'] });
                queryClient.invalidateQueries({ queryKey: ['personal'] });
              }}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

           {/* Estadísticas */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
               <div className="flex items-center justify-between">
                 <div>
                   <div className="text-3xl font-bold">
                     {datosFiltrados.length}
                   </div>
                     <div className="text-blue-100 text-sm font-medium">Total Programaciones</div>
                     <div className="text-blue-200 text-xs mt-1">
                       Sistema Optimizado
                     </div>
                 </div>
                 <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                   <Calendar className="h-6 w-6" />
                 </div>
               </div>
             </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {getTrabajadoresUnicos().length}
              </div>
                     <div className="text-green-100 text-sm font-medium">Personal Asignado</div>
                     <div className="text-green-200 text-xs mt-1">
                       Únicos en rango
                     </div>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{carterasData?.data?.length || 0}</div>
              <div className="text-orange-100 text-sm font-medium">Carteras Activas</div>
              <div className="text-orange-200 text-xs mt-1">Disponibles</div>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {calcularTotalHoras()}
              </div>
                     <div className="text-purple-100 text-sm font-medium">Total Horas</div>
                     <div className="text-purple-200 text-xs mt-1">
                       En rango de fechas
                     </div>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Información del Sistema */}
      {programacionData?.data && (
        <div className="card hover-lift slide-up animate-delay-300 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
                   <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                     <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                     Sistema de Programación Optimizada
                   </h3>
                   <p className="text-sm text-gray-600 mt-1">
                     Datos del {formatearFecha(fechaInicioSemana)} al {formatearFecha(fechaFinSemana)}
                     {programacionData?.data?.cartera && (
                       <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         📊 {programacionData.data.cartera.nombre}
                       </span>
                     )}
                   </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                     <div className="text-2xl font-bold text-blue-900">
                       {datosFiltrados.length}
                     </div>
                <div className="text-sm text-blue-600">Registros de Programación</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">
                  {datosFiltrados.length > 0
                    ? new Set(datosFiltrados.map((p: any) => p.cartera_id)).size
                    : 0}
                </div>
                <div className="text-sm text-green-600">Carteras con Programación</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-900">
                  {calcularTotalHoras()}
                </div>
                <div className="text-sm text-purple-600">Horas Totales</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="card hover-lift slide-up animate-delay-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Filtros y Búsqueda
            {filtrosActivos > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filtrosActivos} activo{filtrosActivos > 1 ? 's' : ''}
              </span>
            )}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Búsqueda general */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Búsqueda General
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, RUT, cartera..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por Cartera */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cartera
              </label>
              <select
                value={filtroCartera}
                onChange={(e) => setFiltroCartera(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las carteras</option>
                {carterasData?.data?.map((cartera: any) => (
                  <option key={cartera.id} value={cartera.id}>
                    {cartera.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los clientes</option>
                {clientesData?.data?.map((cliente: any) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Nodo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nodo
              </label>
              <select
                value={filtroNodo}
                onChange={(e) => setFiltroNodo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los nodos</option>
                {nodosData?.data?.map((nodo: any) => (
                  <option key={nodo.id} value={nodo.id}>
                    {nodo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex items-end space-x-2">
              <button
                onClick={() => setShowProgramacionOptimizadaModal(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva Programación
              </button>
              {datosFiltrados.length > 0 && (
                <button
                  onClick={() => setShowRestablecerModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Restablecer
                </button>
              )}
              <button
                onClick={() => {
                  setFiltroCartera('');
                  setFiltroCliente('');
                  setFiltroNodo('');
                  setFiltroPersonal('');
                  setBusqueda('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de programación */}
      <div className="card hover-lift slide-up animate-delay-300">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
                   <h3 className="text-lg font-semibold text-gray-900">
                     Programación Optimizada
                     {datosFiltrados.length !== datosProcesados.length && (
                       <span className="ml-2 text-sm text-blue-600">
                         ({datosFiltrados.length} de {datosProcesados.length})
                       </span>
                     )}
                   </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setVistaTabla('jerarquica')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  vistaTabla === 'jerarquica'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Vista Jerárquica
              </button>
              <button
                onClick={() => setVistaTabla('simple')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  vistaTabla === 'simple'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Vista Simple
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <>
            {/* Loading state */}
            {isLoadingProgramacion && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
                <span className="ml-3 text-gray-600">Cargando programación...</span>
              </div>
            )}

            {/* Error state */}
            {errorProgramacion && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <Calendar className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar programación</h3>
                  <p className="text-gray-600 mb-6">
                    {errorProgramacion instanceof Error ? errorProgramacion.message : 'Error desconocido'}
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoadingProgramacion && !errorProgramacion && datosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay programación</h3>
                <p className="text-gray-600 mb-6">
                  No hay programaciones para ninguna cartera en esta semana
                </p>
              </div>
            )}

            {/* Tabla de programación */}
            {!isLoadingProgramacion && !errorProgramacion && datosFiltrados.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cartera
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nodo
                      </th>
                      {diasSemana.map((dia) => (
                        <th key={dia.nombre} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {dia.nombre}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosFiltrados.map((prog: any, index: number) => (
                      <tr key={prog.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-sm font-semibold">
                                {prog.nombre_persona?.charAt(0) || prog.rut?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {prog.nombre_persona || 'Sin nombre'}
                              </div>
                              <div className="text-sm text-gray-500">{prog.rut}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {prog.nombre_cartera || 'Sin cartera'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prog.nombre_cliente || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prog.nombre_nodo || '-'}
                        </td>
                        {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(dia => (
                          <td key={dia} className="px-6 py-4 whitespace-nowrap text-center">
                            {prog[dia] ? (
                              <div className="flex items-center justify-center">
                                <div 
                                  className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors"
                                  title={`${dia.charAt(0).toUpperCase() + dia.slice(1)}: Asignado`}
                                >
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <div 
                                  className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
                                  title={`${dia.charAt(0).toUpperCase() + dia.slice(1)}: No asignado`}
                                >
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        </div>
      </div>

            {/* Resumen de la Semana */}
            {!isLoadingProgramacion && !errorProgramacion && datosFiltrados.length > 0 && (
        <div className="card hover-lift slide-up animate-delay-400 mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Resumen de la Semana
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">
                      {getTrabajadoresUnicos().length}
                    </div>
                    <div className="text-sm text-blue-600">Personal Único</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                           <div className="text-2xl font-bold text-green-900">
                             {datosFiltrados.length > 0
                               ? new Set(datosFiltrados.map((p: any) => p.cartera_id)).size
                               : 0}
                           </div>
                    <div className="text-sm text-green-600">Carteras con Personal</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-full p-2 mr-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-900">
                      {calcularTotalHoras()}
                    </div>
                    <div className="text-sm text-purple-600">Horas Totales</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Programación con Calendario */}
      <ProgramacionCalendarioModal
        isOpen={showProgramacionCalendarioModal}
        onClose={() => setShowProgramacionCalendarioModal(false)}
        onSuccess={(asignaciones) => {
          console.log('Programación guardada:', asignaciones);
          // Refrescar los datos de la tabla
          queryClient.invalidateQueries({ queryKey: ['programacion'] });
          queryClient.invalidateQueries({ queryKey: ['programacion', 'semana', 0, fechaInicioSemana.toISOString().split('T')[0]] });
          // Cerrar el modal
          setShowProgramacionCalendarioModal(false);
        }}
        carteras={carterasData?.data || []}
        clientes={clientesData?.data || []}
        nodos={nodosData?.data || []}
        personal={personalData?.data?.items || []}
        carteraId={0}
        semanaInicio={fechaInicioSemana.toISOString().split('T')[0]}
      />

      {/* Modal de Programación Optimizada */}
      <ProgramacionOptimizadaModal
        isOpen={showProgramacionOptimizadaModal}
        onClose={() => setShowProgramacionOptimizadaModal(false)}
        onSuccess={() => {
          // Refrescar datos después de crear programación
          queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
        }}
        fechaInicioSemana={fechaInicioSemana}
        carteraId={carteraId}
      />

      {/* Modal de Restablecer Programación */}
      <RestablecerProgramacionModal
        isOpen={showRestablecerModal}
        onClose={() => setShowRestablecerModal(false)}
        onSuccess={() => {
          // Refrescar datos después de restablecer programación
          queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
        }}
        programacionData={programacion}
        fechaInicio={fechaInicioSemana.toISOString().split('T')[0]}
        fechaFin={fechaFinSemana.toISOString().split('T')[0]}
      />

    </div>
  );
};
