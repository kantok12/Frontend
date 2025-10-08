import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Download, Users, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useProgramacionSemanal } from '../hooks/useProgramacion';
import { useCarteras } from '../hooks/useCarteras';
import { usePersonalList } from '../hooks/usePersonal';
import { useClientesByCartera } from '../hooks/useCarteras';


export const CalendarioPage: React.FC = () => {
  const [vistaCalendario, setVistaCalendario] = useState<'planificacion' | 'semana' | 'dia'>('planificacion');
  
  // Estados para la planificación semanal
  const [fechaInicioSemana, setFechaInicioSemana] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes de esta semana
    return lunes;
  });
  
  // Estados para la integración con la API
  const [carteraSeleccionada, setCarteraSeleccionada] = useState<number | null>(null);
  const [showNuevaProgramacionModal, setShowNuevaProgramacionModal] = useState(false);
  const [vistaTabla, setVistaTabla] = useState<'simple' | 'jerarquica'>('jerarquica');
  const [mostrarTodasCarteras, setMostrarTodasCarteras] = useState(true);
  
  // Estados para el modal de asignación
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [asignacionForm, setAsignacionForm] = useState({
    carteraId: carteraSeleccionada || 0,
    clienteId: 0,
    nodoId: 0,
    personalId: '',
    dias: {
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false
    },
    horasEstimadas: 8,
    observaciones: ''
  });
  
  // Hooks para datos
  const { data: carterasData } = useCarteras();
  const { data: clientesData } = useClientesByCartera(
    asignacionForm.carteraId && asignacionForm.carteraId > 0 ? asignacionForm.carteraId.toString() : ''
  );
  const { data: personalData } = usePersonalList();
  
  // Hook para programación semanal - usar 0 para todas las carteras cuando mostrarTodasCarteras esté activo
  const {
    programacion,
    cartera,
    isLoading: isLoadingProgramacion,
    error: errorProgramacion,
    crearProgramacion,
    alternarDia,
    calcularTotalHoras,
    getTrabajadoresUnicos,
    isUpdating,
    isCreating
  } = useProgramacionSemanal(
    mostrarTodasCarteras ? 0 : (carteraSeleccionada || 0), 
    fechaInicioSemana.toISOString().split('T')[0]
  );
  

  // Efecto para seleccionar la primera cartera por defecto
  useEffect(() => {
    if (carterasData?.data && carterasData.data.length > 0 && !carteraSeleccionada) {
      setCarteraSeleccionada(carterasData.data[0].id);
    }
  }, [carterasData, carteraSeleccionada]);

  // Funciones para la planificación semanal
  const handleCambiarSemana = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaInicioSemana);
    if (direccion === 'anterior') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    }
    setFechaInicioSemana(nuevaFecha);
  };

  const handleExportarPDF = () => {
    // Función de exportación PDF - implementar cuando sea necesario
    alert('Función de exportación PDF no implementada');
  };

  const handleAlternarDia = async (id: number, dia: string) => {
    try {
      await alternarDia(id, dia);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al alternar día:', error);
    }
  };

  // Funciones para el modal de asignación
  const handleAbrirAsignacionModal = () => {
    setAsignacionForm({
      carteraId: carteraSeleccionada || 0,
      clienteId: 0,
      nodoId: 0,
      personalId: '',
      dias: {
        lunes: false,
        martes: false,
        miercoles: false,
        jueves: false,
        viernes: false,
        sabado: false,
        domingo: false
      },
      horasEstimadas: 8,
      observaciones: ''
    });
    setShowAsignacionModal(true);
  };

  const handleCerrarAsignacionModal = () => {
    setShowAsignacionModal(false);
  };

  const handleCambiarFormulario = (campo: string, valor: any) => {
    setAsignacionForm(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleCambiarDia = (dia: string, valor: boolean) => {
    setAsignacionForm(prev => ({
      ...prev,
      dias: {
        ...prev.dias,
        [dia]: valor
      }
    }));
  };

  const handleCrearAsignacion = async () => {
    try {
      // Validar que se haya seleccionado personal
      if (!asignacionForm.personalId) {
        alert('Por favor selecciona un trabajador');
        return;
      }

      // Validar que se haya seleccionado al menos un día
      const diasSeleccionados = Object.values(asignacionForm.dias).some(dia => dia);
      if (!diasSeleccionados) {
        alert('Por favor selecciona al menos un día');
        return;
      }

      // Obtener datos del personal seleccionado
      const personalSeleccionado = personalData?.data?.items?.find((p: any) => p.rut === asignacionForm.personalId);
      if (!personalSeleccionado) {
        alert('No se encontró el personal seleccionado');
        return;
      }

      // Crear la programación
      await crearProgramacion.mutateAsync({
        rut: asignacionForm.personalId,
        cliente_id: asignacionForm.clienteId || undefined,
        nodo_id: asignacionForm.nodoId || undefined,
        ...asignacionForm.dias,
        horas_estimadas: asignacionForm.horasEstimadas,
        observaciones: asignacionForm.observaciones || undefined,
        estado: 'programado'
      });

      // Cerrar modal y limpiar formulario
      handleCerrarAsignacionModal();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al crear asignación:', error);
      alert('Error al crear la asignación. Por favor intenta nuevamente.');
    }
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
        numero: fecha.getDate(),
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' })
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
      const nombrePersona = item.nombre_persona;
      const cargo = item.cargo;
      const clienteId = item.cliente_id;
      const clienteNombre = item.nombre_cliente;
      const nodoId = item.nodo_id;
      const nodoNombre = item.nombre_nodo;

      // Inicializar cartera si no existe
      if (!datosOrganizados[carteraId]) {
        datosOrganizados[carteraId] = {
          id: carteraId,
          nombre: carteraNombre,
          personal: {}
        };
      }

      // Inicializar personal si no existe
      if (!datosOrganizados[carteraId].personal[rut]) {
        datosOrganizados[carteraId].personal[rut] = {
          rut,
          nombre: nombrePersona,
          cargo,
          nodos: {}
        };
      }

      // Inicializar nodo si no existe
      const nodoKey = nodoId ? `${clienteId}-${nodoId}` : clienteId;
      if (!datosOrganizados[carteraId].personal[rut].nodos[nodoKey]) {
        datosOrganizados[carteraId].personal[rut].nodos[nodoKey] = {
          clienteId,
          clienteNombre,
          nodoId,
          nodoNombre,
          asignaciones: {
            lunes: false,
            martes: false,
            miercoles: false,
            jueves: false,
            viernes: false,
            sabado: false,
            domingo: false
          }
        };
      }

      // Asignar días de trabajo
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      dias.forEach(dia => {
        if (item[dia]) {
          datosOrganizados[carteraId].personal[rut].nodos[nodoKey].asignaciones[dia] = true;
        }
      });
    });

    return Object.values(datosOrganizados);
  };

  // Función para obtener color de cartera
  const getColorCartera = (carteraNombre: string) => {
    const colores: { [key: string]: string } = {
      'SNACK': 'bg-orange-100 border-orange-200',
      'Carozzi': 'bg-green-100 border-green-200',
      'Quantum': 'bg-blue-100 border-blue-200',
      'Cementaras': 'bg-blue-100 border-blue-200',
      'Puertos': 'bg-blue-200 border-blue-300',
      'Los Castaños': 'bg-pink-100 border-pink-200',
      'SOPROLE': 'bg-white border-gray-200',
      'Servicios': 'bg-white border-gray-200'
    };
    return colores[carteraNombre] || 'bg-gray-100 border-gray-200';
  };



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planificación Semanal</h1>
          <p className="text-gray-600 mt-1">Gestiona las asignaciones de personal a carteras por semana</p>
          {mostrarTodasCarteras ? (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                📊 Todas las Carteras ({carterasData?.data?.length || 0})
              </span>
            </div>
          ) : cartera && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                📊 Cartera: {cartera.nombre}
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          {/* Toggle para mostrar todas las carteras */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={mostrarTodasCarteras}
                onChange={(e) => {
                  setMostrarTodasCarteras(e.target.checked);
                  if (e.target.checked) {
                    setCarteraSeleccionada(null);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Mostrar todas las carteras</span>
            </label>
          </div>
          
          {/* Selector de cartera (solo cuando no se muestran todas) */}
          {!mostrarTodasCarteras && carterasData?.data && (
            <select
              value={carteraSeleccionada || ''}
              onChange={(e) => setCarteraSeleccionada(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar Cartera</option>
              {carterasData.data.map((cartera: any) => (
                <option key={cartera.id} value={cartera.id}>
                  {cartera.nombre}
                </option>
              ))}
            </select>
          )}
          
          <button 
            onClick={() => setShowNuevaProgramacionModal(true)}
            disabled={mostrarTodasCarteras ? false : !carteraSeleccionada}
            className="btn-primary hover-grow disabled:opacity-50 disabled:cursor-not-allowed"
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
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              Planificación Semanal
            </h2>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            {['planificacion', 'semana', 'dia'].map((vista) => (
              <button
                key={vista}
                onClick={() => setVistaCalendario(vista as 'planificacion' | 'semana' | 'dia')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaCalendario === vista
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {vista === 'planificacion' ? 'Planificación Semanal' : 
                 vista === 'semana' ? 'Vista Semana' : 
                 'Vista Día'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vista de Planificación Semanal */}
      {vistaCalendario === 'planificacion' && (
        <div className="space-y-6">
          {/* Controles de navegación de semana */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleCambiarSemana('anterior')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Semana Anterior
                </button>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatearFecha(fechaInicioSemana)} - {formatearFecha(new Date(fechaInicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000))}
                  </h3>
                  <p className="text-sm text-gray-600">Semana de planificación</p>
                </div>
                <button
                  onClick={() => handleCambiarSemana('siguiente')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Semana Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Programaciones</div>
                  <div className="text-2xl font-bold text-blue-600">{programacion.length}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Personal Programado</div>
                  <div className="text-2xl font-bold text-green-600">
                    {getTrabajadoresUnicos().length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Horas</div>
                  <div className="text-2xl font-bold text-purple-600">{calcularTotalHoras()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Controles de planificación */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Programación Semanal</h2>
                  <p className="text-gray-600">Gestiona las programaciones de personal para toda la semana</p>
                </div>
              <div className="flex space-x-3">
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setVistaTabla('jerarquica')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      vistaTabla === 'jerarquica'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Vista Jerárquica
                  </button>
                  <button
                    onClick={() => setVistaTabla('simple')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      vistaTabla === 'simple'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Vista Simple
                  </button>
                </div>
                <button
                  onClick={handleExportarPDF}
                  disabled={programacion.length === 0}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </button>
                <button
                  onClick={handleAbrirAsignacionModal}
                  disabled={!carteraSeleccionada}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Personal
                </button>
              </div>
              </div>

            {/* Loading state */}
            {isLoadingProgramacion && (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Cargando programación...</span>
              </div>
            )}

            {/* Error state */}
            {errorProgramacion && (
              <div className="text-center py-12">
                <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar programación</h3>
                <p className="text-gray-600 mb-6">No se pudo cargar la programación de la semana</p>
              </div>
            )}

            {/* Programación semanal */}
            {!isLoadingProgramacion && !errorProgramacion && programacion.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{programacion.length}</div>
                    <div className="text-sm text-blue-800">Total Programaciones</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {getTrabajadoresUnicos().length}
                    </div>
                    <div className="text-sm text-green-800">Personal Programado</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{calcularTotalHoras()}</div>
                    <div className="text-sm text-purple-800">Total Horas</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {new Set(programacion.map((p: any) => p.cliente_id).filter(Boolean)).size}
                    </div>
                    <div className="text-sm text-orange-800">Clientes Únicos</div>
                  </div>
                </div>

                {/* Tabla de programación */}
                {vistaTabla === 'jerarquica' ? (
                  /* Vista Jerárquica */
                  <div className="overflow-x-auto">
                    <div className="bg-white border border-gray-200 rounded-lg">
                      {/* Header de la tabla */}
                      <div className="grid grid-cols-10 border-b border-gray-200 bg-gray-50">
                        <div className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Cartera
                        </div>
                        <div className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          IS
                        </div>
                        <div className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Nodo
                        </div>
                        {getDiasSemana().map((dia, index) => (
                          <div key={index} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                            <div>{dia.nombre}</div>
                            <div className="font-bold">{dia.numero}</div>
                            <div>{dia.mes}</div>
                          </div>
                        ))}
                      </div>

                      {/* Contenido de la tabla */}
                      <div className="divide-y divide-gray-200">
                        {organizarDatosJerarquicos().map((cartera: any) => (
                          <div key={cartera.id} className={`${getColorCartera(cartera.nombre)}`}>
                            {Object.values(cartera.personal).map((persona: any, personaIndex: number) => (
                              <div key={persona.rut}>
                                {Object.values(persona.nodos).map((nodo: any, nodoIndex: number) => (
                                  <div key={`${nodo.clienteId}-${nodo.nodoId}`} className="grid grid-cols-10 border-b border-gray-200 hover:bg-gray-50">
                                    {/* Columna Cartera */}
                                    <div className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 flex items-center">
                                      {personaIndex === 0 && nodoIndex === 0 && (
                                        <span className="font-bold">{cartera.nombre}</span>
                                      )}
                                    </div>
                                    
                                    {/* Columna IS (Personal) */}
                                    <div className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 flex items-center">
                                      {nodoIndex === 0 && (
                                        <div>
                                          <div className="font-medium">{persona.nombre}</div>
                                          <div className="text-xs text-gray-500">{persona.cargo}</div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Columna Nodo */}
                                    <div className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 flex items-center">
                                      <div>
                                        {nodo.clienteNombre && (
                                          <div className="font-medium">{nodo.clienteNombre}</div>
                                        )}
                                        {nodo.nodoNombre && (
                                          <div className="text-xs text-gray-500">{nodo.nodoNombre}</div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Columnas de días */}
                                    {getDiasSemana().map((dia, diaIndex) => {
                                      const diaKey = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][diaIndex];
                                      const estaAsignado = nodo.asignaciones[diaKey];
                                      
                                      return (
                                        <div key={diaIndex} className="px-2 py-3 text-center border-r border-gray-200 last:border-r-0">
                                          {estaAsignado ? (
                                            <div className="flex items-center justify-center">
                                              <span className="text-sm font-medium text-green-800 bg-green-100 px-2 py-1 rounded">
                                                {persona.nombre.split(' ')[0]}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="text-gray-300">-</div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Vista Simple */
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trabajador
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente/Nodo
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lun
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mar
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mié
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jue
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vie
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sáb
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dom
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Horas
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {programacion.map((item: any) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.nombre_persona}</div>
                                <div className="text-sm text-gray-500">{item.cargo}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                {item.nombre_cliente && (
                                  <div className="text-sm font-medium text-gray-900">{item.nombre_cliente}</div>
                                )}
                                {item.nombre_nodo && (
                                  <div className="text-sm text-gray-500">{item.nombre_nodo}</div>
                                )}
                              </div>
                            </td>
                            {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                              <td key={dia} className="px-4 py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleAlternarDia(item.id, dia)}
                                  disabled={isUpdating}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                    item[dia]
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {item[dia] ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                </button>
                              </td>
                            ))}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-gray-900">{item.horas_estimadas}h</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.estado === 'programado' ? 'bg-blue-100 text-blue-800' :
                                item.estado === 'confirmado' ? 'bg-green-100 text-green-800' :
                                item.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                                item.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!isLoadingProgramacion && !errorProgramacion && programacion.length === 0 && (mostrarTodasCarteras || carteraSeleccionada) && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay programación</h3>
                <p className="text-gray-600 mb-6">
                  {mostrarTodasCarteras 
                    ? 'No hay programaciones para ninguna cartera en esta semana'
                    : 'Comienza agregando programaciones para esta semana'
                  }
                </p>
                <button
                  onClick={handleAbrirAsignacionModal}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors mx-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Asignar Primer Personal
                </button>
              </div>
            )}

            {/* No cartera selected */}
            {!mostrarTodasCarteras && !carteraSeleccionada && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una cartera</h3>
                <p className="text-gray-600 mb-6">Elige una cartera para ver su programación semanal o activa "Mostrar todas las carteras"</p>
              </div>
            )}
            </>
          </div>
        </div>
      )}

      {/* Modal de Asignación de Personal */}
      {showAsignacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Asignar Personal</h3>
              <button
                onClick={handleCerrarAsignacionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información de la semana */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Semana de Programación</h4>
                <p className="text-blue-700">
                  {formatearFecha(fechaInicioSemana)} - {formatearFecha(new Date(fechaInicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000))}
                </p>
              </div>

              {/* Formulario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cartera */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cartera *
                  </label>
                  <select
                    value={asignacionForm.carteraId}
                    onChange={(e) => handleCambiarFormulario('carteraId', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Seleccionar Cartera</option>
                    {carterasData?.data?.map((cartera: any) => (
                      <option key={cartera.id} value={cartera.id}>
                        {cartera.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    value={asignacionForm.clienteId}
                    onChange={(e) => {
                      const clienteId = parseInt(e.target.value);
                      handleCambiarFormulario('clienteId', clienteId);
                      handleCambiarFormulario('nodoId', 0); // Reset nodo when cliente changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!asignacionForm.carteraId}
                  >
                    <option value={0}>Seleccionar Cliente (Opcional)</option>
                    {clientesData?.data?.map((cliente: any) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nodo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nodo
                  </label>
                  <select
                    value={asignacionForm.nodoId}
                    onChange={(e) => handleCambiarFormulario('nodoId', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!asignacionForm.clienteId}
                  >
                    <option value={0}>Seleccionar Nodo (Opcional)</option>
                    {clientesData?.data?.find((c: any) => c.id === asignacionForm.clienteId)?.nodos?.map((nodo: any) => (
                      <option key={nodo.id} value={nodo.id}>
                        {nodo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Personal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal *
                  </label>
                  <select
                    value={asignacionForm.personalId}
                    onChange={(e) => handleCambiarFormulario('personalId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar Personal</option>
                    {personalData?.data?.items?.map((persona: any) => (
                      <option key={persona.rut} value={persona.rut}>
                        {persona.nombres || `${persona.nombre || ''} ${persona.apellido || ''}`.trim()} - {persona.rut}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Horas Estimadas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas Estimadas por Día
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={asignacionForm.horasEstimadas}
                    onChange={(e) => handleCambiarFormulario('horasEstimadas', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Días de la semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Días de Trabajo *
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {getDiasSemana().map((dia, index) => {
                    const diaKey = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][index];
                    return (
                      <div key={diaKey} className="text-center">
                        <label className="block text-xs text-gray-600 mb-1">
                          {dia.nombre}
                        </label>
                        <label className="block text-xs font-medium text-gray-800 mb-2">
                          {dia.numero}
                        </label>
                        <input
                          type="checkbox"
                          checked={asignacionForm.dias[diaKey as keyof typeof asignacionForm.dias]}
                          onChange={(e) => handleCambiarDia(diaKey, e.target.checked)}
                          className="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={asignacionForm.observaciones}
                  onChange={(e) => handleCambiarFormulario('observaciones', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleCerrarAsignacionModal}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearAsignacion}
                disabled={isCreating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Creando...</span>
                  </>
                ) : (
                  'Crear Asignación'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};