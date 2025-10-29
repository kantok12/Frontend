import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProgramacionOptimizada } from '../hooks/useProgramacionOptimizada';
import { useCarteras } from '../hooks/useCarteras';
import { useClientes, useNodos } from '../hooks/useServicios';
import { usePersonalList } from '../hooks/usePersonal';
import { ProgramacionCalendarioModal } from '../components/programacion/ProgramacionCalendarioModal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Plus, RefreshCw } from 'lucide-react';

const CalendarioPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Estados básicos
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCartera, setSelectedCartera] = useState<number>(6); // Cartera por defecto
  const [showModal, setShowModal] = useState(false);
  const [fechaInicioSemana, setFechaInicioSemana] = useState<Date>(new Date());
  
  // Hooks de datos
  const { data: carterasData } = useCarteras();
  const { data: clientesData } = useClientes({ cartera_id: selectedCartera });
  const { data: nodosData } = useNodos({ cartera_id: selectedCartera });
  const { data: personalData } = usePersonalList(1, 1000);
  
  // Hook de programación semanal simplificada
  const { 
    data: programacionData, 
    isLoading: isLoadingProgramacion, 
    error: errorProgramacion
  } = useQuery({
    queryKey: ['programacion-compatibilidad', selectedCartera, fechaInicioSemana.toISOString().split('T')[0]],
    queryFn: async () => {
      const { apiService } = await import('../services/api');
      return await apiService.getProgramacionCompatibilidad({
        cartera_id: selectedCartera,
        semana: fechaInicioSemana.toISOString().split('T')[0]
      });
    },
    enabled: selectedCartera > 0,
    staleTime: 5 * 60 * 1000,
  });
  
  // Calcular fechas de la semana
  const getFechaInicioSemana = (fecha: Date): Date => {
    const inicio = new Date(fecha);
    const dia = inicio.getDay();
    const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1); // Lunes
    inicio.setDate(diff);
    return inicio;
  };
  
  // Inicializar fecha de inicio de semana
  useEffect(() => {
    const hoy = new Date();
    setFechaInicioSemana(getFechaInicioSemana(hoy));
  }, []);
  
  // Procesar datos de programación - FORMATO COMPATIBILIDAD
  const programacion = programacionData?.data?.programacion || [];

  console.log('🔍 Datos de programaciónData:', programacionData);
  console.log('🔍 Datos de programación procesados:', programacion);
  console.log('🔍 Timestamp de datos:', new Date().toISOString());

  // Los datos ya vienen en formato de días booleanos - NO necesitamos procesamiento adicional
  const tablaProgramacion = programacion;
  
  // Filtrar datos
  const datosFiltrados = tablaProgramacion.filter((item: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.nombre_persona?.toLowerCase().includes(searchLower) ||
      item.nombre_cartera?.toLowerCase().includes(searchLower) ||
      item.nombre_cliente?.toLowerCase().includes(searchLower) ||
      item.nombre_nodo?.toLowerCase().includes(searchLower) ||
      item.rut?.toLowerCase().includes(searchLower)
    );
  });
  
  // Manejar asignación de día - USANDO SELECCIÓN MÚLTIPLE
  const handleAsignarDia = async (trabajador: any, dia: string) => {
    try {
      console.log(`🔄 Asignando ${trabajador.nombre_persona} al ${dia}`);
      
      // Crear objeto con días booleanos - mantener días existentes + agregar nuevo día
      const diasBooleanos = {
        lunes: trabajador.lunes || (dia === 'lunes'),
        martes: trabajador.martes || (dia === 'martes'),
        miercoles: trabajador.miercoles || (dia === 'miercoles'),
        jueves: trabajador.jueves || (dia === 'jueves'),
        viernes: trabajador.viernes || (dia === 'viernes'),
        sabado: trabajador.sabado || (dia === 'sabado'),
        domingo: trabajador.domingo || (dia === 'domingo')
      };
      
      console.log('📤 Datos enviados al backend:', {
              rut: trabajador.rut,
              cartera_id: trabajador.cartera_id,
              cliente_id: trabajador.cliente_id,
              nodo_id: trabajador.nodo_id,
        semana_inicio: fechaInicioSemana.toISOString().split('T')[0],
        ...diasBooleanos,
        horas_estimadas: 8,
        observaciones: '',
        estado: 'activo'
      });
      
      const { apiService } = await import('../services/api');
      const result = await apiService.crearProgramacionCompatibilidad({
        rut: trabajador.rut,
        cartera_id: trabajador.cartera_id,
        cliente_id: trabajador.cliente_id,
        nodo_id: trabajador.nodo_id,
        semana_inicio: fechaInicioSemana.toISOString().split('T')[0],
        ...diasBooleanos,
        horas_estimadas: 8,
        observaciones: '',
        estado: 'activo'
      });
      
      console.log('✅ Resultado de asignación:', result);
      console.log('📊 Respuesta completa del backend:', JSON.stringify(result, null, 2));
      
      // Refrescar datos
      console.log('🔄 Refrescando datos...');
      await queryClient.invalidateQueries({ queryKey: ['programacion-compatibilidad'] });
      await queryClient.refetchQueries({ queryKey: ['programacion-compatibilidad'] });
      console.log('✅ Datos actualizados');
    } catch (error: any) {
      console.error('Error al asignar el día:', error);
      
      // Manejo específico de errores HTTP
      let mensajeError = 'Error desconocido';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            mensajeError = `Error 400 - Solicitud inválida: ${data?.message || 'Datos incompletos o inválidos. Verifica que todos los campos estén correctos.'}`;
            break;
          case 404:
            mensajeError = `Error 404 - No encontrado: ${data?.message || 'No se encontró el trabajador o la cartera especificada.'}`;
            break;
          case 409:
            mensajeError = `Error 409 - Conflicto: ${data?.message || 'El trabajador ya está asignado a este día.'}`;
            break;
          case 500:
            mensajeError = `Error 500 - Error del servidor: ${data?.message || 'Error interno del servidor. Intenta nuevamente.'}`;
            break;
          default:
            mensajeError = `Error ${status}: ${data?.message || 'Error del servidor'}`;
        }
      } else if (error.request) {
        mensajeError = 'Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        mensajeError = `Error: ${error.message || 'Error desconocido'}`;
      }
      
      alert(`❌ Error al asignar el día:\n\n${mensajeError}\n\nSugerencias:\n• Verifica que el trabajador esté disponible\n• Intenta refrescar la página\n• Contacta al administrador si el problema persiste`);
    }
  };
  
  // Manejar desasignación de día - USANDO SELECCIÓN MÚLTIPLE
  const handleDesasignarDia = async (trabajador: any, dia: string) => {
    try {
      console.log(`🔄 Desasignando ${trabajador.nombre_persona} del ${dia}`);
      
      // Crear objeto con días booleanos - mantener días existentes - quitar día específico
      const diasBooleanos = {
        lunes: trabajador.lunes && (dia !== 'lunes'),
        martes: trabajador.martes && (dia !== 'martes'),
        miercoles: trabajador.miercoles && (dia !== 'miercoles'),
        jueves: trabajador.jueves && (dia !== 'jueves'),
        viernes: trabajador.viernes && (dia !== 'viernes'),
        sabado: trabajador.sabado && (dia !== 'sabado'),
        domingo: trabajador.domingo && (dia !== 'domingo')
      };
      
      // Verificar si quedaría sin ningún día asignado
      const diasAsignados = Object.values(diasBooleanos).filter(Boolean).length;
      console.log(`📊 Días asignados después de desasignar: ${diasAsignados}`);
      
      if (diasAsignados === 0) {
        const confirmacion = window.confirm(
          `⚠️ Advertencia: Al desasignar el ${dia}, ${trabajador.nombre_persona} no tendrá ningún día asignado esta semana.\n\n` +
          `¿Estás seguro de que quieres continuar? Esto podría causar problemas en la programación.`
        );
        
        if (!confirmacion) {
          console.log('❌ Desasignación cancelada por el usuario');
          return;
        }
      }
      
      console.log('📤 Datos enviados al backend:', {
        rut: trabajador.rut,
        cartera_id: trabajador.cartera_id,
        cliente_id: trabajador.cliente_id,
        nodo_id: trabajador.nodo_id,
        semana_inicio: fechaInicioSemana.toISOString().split('T')[0],
        ...diasBooleanos,
        horas_estimadas: 8,
        observaciones: '',
        estado: 'activo'
      });
      
      const { apiService } = await import('../services/api');
      const result = await apiService.crearProgramacionCompatibilidad({
        rut: trabajador.rut,
        cartera_id: trabajador.cartera_id,
        cliente_id: trabajador.cliente_id,
        nodo_id: trabajador.nodo_id,
        semana_inicio: fechaInicioSemana.toISOString().split('T')[0],
        ...diasBooleanos,
        horas_estimadas: 8,
        observaciones: '',
        estado: 'activo'
      });
      
      console.log('✅ Resultado de desasignación:', result);
      
      // Refrescar datos
      console.log('🔄 Refrescando datos...');
      await queryClient.invalidateQueries({ queryKey: ['programacion-compatibilidad'] });
      await queryClient.refetchQueries({ queryKey: ['programacion-compatibilidad'] });
      console.log('✅ Datos actualizados');
    } catch (error: any) {
      console.error('Error al desasignar el día:', error);
      
      // Manejo específico de errores HTTP
      let mensajeError = 'Error desconocido';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            mensajeError = `Error 400 - Solicitud inválida: ${data?.message || 'El servidor no puede procesar la solicitud. Posiblemente no se puede desasignar todos los días de un trabajador.'}`;
            break;
          case 404:
            mensajeError = `Error 404 - No encontrado: ${data?.message || 'No se encontró la programación para este trabajador.'}`;
            break;
          case 409:
            mensajeError = `Error 409 - Conflicto: ${data?.message || 'Ya existe una programación para este trabajador en esta semana.'}`;
            break;
          case 500:
            mensajeError = `Error 500 - Error del servidor: ${data?.message || 'Error interno del servidor. Intenta nuevamente.'}`;
            break;
          default:
            mensajeError = `Error ${status}: ${data?.message || 'Error del servidor'}`;
        }
      } else if (error.request) {
        mensajeError = 'Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        mensajeError = `Error: ${error.message || 'Error desconocido'}`;
      }
      
      alert(`❌ Error al desasignar el día:\n\n${mensajeError}\n\nSugerencias:\n• Verifica que el trabajador tenga al menos un día asignado\n• Intenta refrescar la página\n• Contacta al administrador si el problema persiste`);
    }
  };
  
  // Renderizar botón de día - VERSIÓN SIMPLIFICADA CON UPSERT
  const renderDiaButton = (trabajador: any, dia: string) => {
    const isAsignado = trabajador[dia];
    
    // Debug: Log del estado del botón
    console.log(`🔍 Botón ${dia} para ${trabajador.nombre_persona}:`, {
      isAsignado,
      rut: trabajador.rut,
      lunes: trabajador.lunes,
      martes: trabajador.martes,
      miercoles: trabajador.miercoles,
      jueves: trabajador.jueves,
      viernes: trabajador.viernes,
      sabado: trabajador.sabado,
      domingo: trabajador.domingo
    });

  return (
               <button
        key={dia}
        onClick={() => isAsignado ? handleDesasignarDia(trabajador, dia) : handleAsignarDia(trabajador, dia)}
        className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
          isAsignado 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
        title={isAsignado ? `Desasignar ${dia}` : `Asignar ${dia}`}
      >
        {dia.charAt(0).toUpperCase()}
               </button>
    );
  };
  
  if (isLoadingProgramacion) {
  return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando programación...</span>
            </div>
    );
  }
  
  if (errorProgramacion) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error al cargar la programación: {errorProgramacion instanceof Error ? errorProgramacion.message : 'Error desconocido'}</p>
                   </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
            <div>
          <h1 className="text-2xl font-bold text-gray-900">Programación Semanal</h1>
          <p className="text-gray-600">Gestiona las asignaciones de personal por día</p>
              </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Asignación
        </Button>
        </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
              </label>
            <Input
                type="text"
              placeholder="Buscar por nombre, RUT, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Cartera
              </label>
              <select
              value={selectedCartera}
              onChange={(e) => setSelectedCartera(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Todas las carteras</option>
                {carterasData?.data?.map((cartera: any) => (
                  <option key={cartera.id} value={cartera.id}>
                    {cartera.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semana
              </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={fechaInicioSemana.toISOString().split('T')[0]}
                onChange={(e) => setFechaInicioSemana(new Date(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => {
                  const hoy = new Date();
                  setFechaInicioSemana(getFechaInicioSemana(hoy));
                }}
                className="px-3 py-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de programación */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente/Nodo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  M
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  X
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  J
                      </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  V
                      </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S
                      </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  D
                        </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
              {datosFiltrados.map((trabajador: any, index: number) => (
                <tr key={`${trabajador.rut}-${trabajador.cartera_id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                        {trabajador.nombre_persona || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {trabajador.rut} • {trabajador.cargo}
                              </div>
                      <div className="text-sm text-gray-500">
                        {trabajador.nombre_cartera || 'Sin cartera'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {trabajador.nombre_cliente || 'Sin cliente'}
                                </div>
                      <div className="text-sm text-gray-500">
                        {trabajador.nombre_nodo || 'Sin nodo'}
                                </div>
                              </div>
                  </td>
                  {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                    <td key={dia} className="px-6 py-4 whitespace-nowrap text-center">
                      {renderDiaButton(trabajador, dia)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
      </div>

        {datosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron asignaciones para esta semana
          </div>
        )}
              </div>
              
      {/* Modal de nueva asignación */}
      {showModal && (
      <ProgramacionCalendarioModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            // Refrescar datos después de crear asignaciones
            queryClient.invalidateQueries({ queryKey: ['programacion-semanal'] });
        }}
        carteras={carterasData?.data || []}
        clientes={clientesData?.data || []}
        nodos={nodosData?.data || []}
        personal={personalData?.data?.items || []}
          carteraId={selectedCartera}
        semanaInicio={fechaInicioSemana.toISOString().split('T')[0]}
      />
      )}
    </div>
  );
};

export default CalendarioPage;