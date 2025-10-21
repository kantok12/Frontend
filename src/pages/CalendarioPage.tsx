import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Download, Users, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useProgramacionSemanal } from '../hooks/useProgramacion';
import { useCarteras } from '../hooks/useCarteras';
import { usePersonalList } from '../hooks/usePersonal';
import { ProgramacionCalendarioModal } from '../components/programacion/ProgramacionCalendarioModal';
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
  const [vistaTabla, setVistaTabla] = useState<'simple' | 'jerarquica'>('jerarquica');
  
  // Hooks para datos
  const { data: carterasData } = useCarteras();
  const { data: clientesData } = useClientes({ limit: 1000 });
  const { data: nodosData } = useNodos({ limit: 1000 });
  const { data: personalData } = usePersonalList();

  // Hook para programación semanal - obtener todas las carteras
  const {
    programacion,
    isLoading: isLoadingProgramacion,
    error: errorProgramacion,
    alternarDia,
    calcularTotalHoras,
    getTrabajadoresUnicos,
    isUpdating,
    isCreating
  } = useProgramacionSemanal(
    0, // Siempre obtener todas las carteras
    fechaInicioSemana.toISOString().split('T')[0]
  );

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

  const handleAlternarDia = async (programacionId: number, dia: string) => {
    try {
      await alternarDia(programacionId, dia);
    } catch (error) {
      console.error('Error al alternar día:', error);
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
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              📊 Todas las Carteras ({carterasData?.data?.length || 0})
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{programacion.length}</div>
              <div className="text-blue-100 text-sm font-medium">Total Programaciones</div>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{getTrabajadoresUnicos().length}</div>
              <div className="text-green-100 text-sm font-medium">Personal Único</div>
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
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{calcularTotalHoras()}</div>
              <div className="text-purple-100 text-sm font-medium">Total Horas</div>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de programación */}
      <div className="card hover-lift slide-up animate-delay-300">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Programación Semanal</h3>
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
            {!isLoadingProgramacion && !errorProgramacion && programacion.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay programación</h3>
                <p className="text-gray-600 mb-6">
                  No hay programaciones para ninguna cartera en esta semana
                </p>
              </div>
            )}

            {/* Tabla de programación */}
            {!isLoadingProgramacion && !errorProgramacion && programacion.length > 0 && (
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
                    {programacion.map((prog: any, index: number) => (
                      <tr key={prog.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-sm font-semibold">
                                {prog.nombre_personal?.charAt(0) || prog.rut?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {prog.nombre_personal || 'Sin nombre'}
                              </div>
                              <div className="text-sm text-gray-500">{prog.rut}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {prog.cartera_nombre || 'Sin cartera'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prog.cliente_nombre || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prog.nodo_nombre || '-'}
                        </td>
                        {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(dia => (
                          <td key={dia} className="px-6 py-4 whitespace-nowrap text-center">
                            {prog[dia] ? (
                              <div className="flex items-center justify-center">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
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
    </div>
  );
};
