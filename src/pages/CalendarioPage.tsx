import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProgramacionOptimizada } from '../hooks/useProgramacionOptimizada';
import { useCarteras } from '../hooks/useCarteras';
import { useClientes, useNodos } from '../hooks/useServicios';
import { usePersonalList } from '../hooks/usePersonal';
import { ProgramacionCalendarioModal } from '../components/programacion/ProgramacionCalendarioModal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Plus, RefreshCw, Calendar, ChevronLeft, ChevronRight, Users, Building2, MapPin } from 'lucide-react';

const CalendarioPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Estados básicos
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCartera, setSelectedCartera] = useState<number>(6); // Cartera por defecto
  const [showModal, setShowModal] = useState(false);
  const [fechaInicioSemana, setFechaInicioSemana] = useState<Date>(new Date());
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'calendario'>('calendario');
  
  // Hooks de datos - Obtener TODAS las carteras y datos
  const { data: carterasData } = useCarteras();
  const { data: clientesData } = useClientes(); // Sin filtros para obtener todos los clientes
  const { data: nodosData } = useNodos(); // Sin filtros para obtener todos los nodos
  const { data: personalData } = usePersonalList(1, 1000);
  
  // Hook de programación semanal - Obtener TODAS las carteras
  const { 
    data: programacionData, 
    isLoading: isLoadingProgramacion, 
    error: errorProgramacion
  } = useQuery({
    queryKey: ['programacion-semana', fechaInicioSemana.toISOString().split('T')[0]], // Fecha de inicio de semana
    queryFn: async () => {
      const { apiService } = await import('../services/api');
      // Usar el endpoint que funciona
      return await apiService.getProgramacionSemana(fechaInicioSemana.toISOString().split('T')[0]);
    },
    enabled: true, // Siempre habilitado para obtener todas las carteras
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

  // Obtener fechas de la semana
  const fechasSemana = useMemo(() => {
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicioSemana);
      fecha.setDate(fechaInicioSemana.getDate() + i);
      fechas.push(fecha);
    }
    return fechas;
  }, [fechaInicioSemana]);

  // Obtener colores para carteras
  const getColorCartera = (carteraNombre: string) => {
    const colores: { [key: string]: string } = {
      'Snack': 'bg-orange-500',
      'Carozzi': 'bg-green-600',
      'Cementaras': 'bg-blue-500',
      'Puertos': 'bg-teal-500',
      'Los Castaños': 'bg-red-500'
    };
    return colores[carteraNombre] || 'bg-gray-500';
  };

  const getColorCarteraLight = (carteraNombre: string) => {
    const colores: { [key: string]: string } = {
      'Snack': 'bg-orange-100',
      'Carozzi': 'bg-green-100',
      'Cementaras': 'bg-blue-100',
      'Puertos': 'bg-teal-100',
      'Los Castaños': 'bg-red-100'
    };
    return colores[carteraNombre] || 'bg-gray-100';
  };
  
  // Inicializar fecha de inicio de semana
  useEffect(() => {
    const hoy = new Date();
    setFechaInicioSemana(getFechaInicioSemana(hoy));
  }, []);
  
  // Procesar datos de programación - FORMATO SEMANAL
  const programacion = useMemo(() => {
    if (!programacionData) return [];
    
    // Manejar diferentes estructuras de respuesta
    if (Array.isArray(programacionData)) {
      return programacionData;
    }
    
    if (programacionData.data) {
      if (Array.isArray(programacionData.data)) {
        return programacionData.data;
      }
      if (programacionData.data.programacion && Array.isArray(programacionData.data.programacion)) {
        return programacionData.data.programacion;
      }
      if (programacionData.data.items && Array.isArray(programacionData.data.items)) {
        return programacionData.data.items;
      }
    }
    
    return [];
  }, [programacionData]);

  console.log('🔍 Datos de programacionData:', programacionData);
  console.log('🔍 Datos de programación procesados:', programacion);
  console.log('🔍 Tipo de programacion:', typeof programacion, Array.isArray(programacion));
  console.log('🔍 Estructura completa de programacionData:', JSON.stringify(programacionData, null, 2));
  console.log('🔍 Datos de carteras:', carterasData);
  console.log('🔍 Datos de clientes:', clientesData);
  console.log('🔍 Datos de nodos:', nodosData);
  console.log('🔍 Error de programación:', errorProgramacion);
  console.log('🔍 Timestamp de datos:', new Date().toISOString());
  
  // Verificar si hay programación para BAKERY - CARNES
  if (Array.isArray(programacion)) {
    const carterasConProgramacion = Array.from(new Set(programacion.map((item: any) => item.nombre_cartera)));
    console.log('🔍 Carteras con programación:', carterasConProgramacion);
    
    const bakeryCarnes = programacion.filter((item: any) => 
      item.nombre_cartera?.toLowerCase().includes('bakery') && 
      item.nombre_cartera?.toLowerCase().includes('carnes')
    );
    console.log('🔍 Programación BAKERY - CARNES:', bakeryCarnes);
  }

  // Los datos vienen en formato de programación semanal
  const tablaProgramacion = programacion;

  // Procesar datos para vista de tabla con carteras agrupadas
  const datosTabla = useMemo(() => {
    const filas: any[] = [];
    
    // PRIMERO: Crear filas para TODAS las carteras
    if (carterasData?.data && Array.isArray(carterasData.data)) {
      carterasData.data.forEach((cartera: any) => {
        // Obtener todos los clientes de esta cartera
        const clientesDeCartera = clientesData?.data?.filter((cliente: any) => cliente.cartera_id === cartera.id) || [];
        const clientesNombres = clientesDeCartera.map((cliente: any) => cliente.nombre).join(', ');
        
        // Crear fila de cartera con todos sus clientes
        filas.push({
          tipo: 'cartera',
          cartera_id: cartera.id,
          cartera_nombre: cartera.nombre,
          personal_nombre: '',
          personal_rut: '',
          personal_telefono: '',
          personal_cargo: '',
          cliente_nombre: clientesNombres || 'Sin clientes',
          nodo_nombre: '',
          lunes: false,
          martes: false,
          miercoles: false,
          jueves: false,
          viernes: false,
          sabado: false,
          domingo: false
        });
        
        // SEGUNDO: Agregar filas de personal para esta cartera
        if (Array.isArray(programacion)) {
          const personalDeCartera = programacion.filter((item: any) => item.cartera_id === cartera.id);
          
          personalDeCartera.forEach((item: any) => {
            const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            const diasAsignados = dias.filter(dia => {
              return item[dia] === true || item[dia] === 1 || item[dia] === '1' || 
                     (item.fecha_trabajo && item.fecha_trabajo.includes(dia)) ||
                     (item.dias_trabajo && item.dias_trabajo.includes(dia));
            });
            
            // Solo crear fila si tiene al menos un día asignado
            if (diasAsignados.length > 0) {
              filas.push({
                tipo: 'personal',
                cartera_id: item.cartera_id,
                cartera_nombre: item.nombre_cartera || 'Sin Cartera',
                personal_nombre: item.nombre_persona || 'Sin Nombre',
                personal_rut: item.rut,
                personal_telefono: item.telefono || '',
                personal_cargo: item.cargo || '',
                cliente_nombre: item.nombre_cliente || 'Sin Cliente',
                nodo_nombre: item.nombre_nodo || 'Sin Nodo',
                lunes: item.lunes === true || item.lunes === 1 || item.lunes === '1' || 
                       (item.fecha_trabajo && item.fecha_trabajo.includes('lunes')) ||
                       (item.dias_trabajo && item.dias_trabajo.includes('lunes')),
                martes: item.martes === true || item.martes === 1 || item.martes === '1' || 
                        (item.fecha_trabajo && item.fecha_trabajo.includes('martes')) ||
                        (item.dias_trabajo && item.dias_trabajo.includes('martes')),
                miercoles: item.miercoles === true || item.miercoles === 1 || item.miercoles === '1' || 
                           (item.fecha_trabajo && item.fecha_trabajo.includes('miercoles')) ||
                           (item.dias_trabajo && item.dias_trabajo.includes('miercoles')),
                jueves: item.jueves === true || item.jueves === 1 || item.jueves === '1' || 
                        (item.fecha_trabajo && item.fecha_trabajo.includes('jueves')) ||
                        (item.dias_trabajo && item.dias_trabajo.includes('jueves')),
                viernes: item.viernes === true || item.viernes === 1 || item.viernes === '1' || 
                         (item.fecha_trabajo && item.fecha_trabajo.includes('viernes')) ||
                         (item.dias_trabajo && item.dias_trabajo.includes('viernes')),
                sabado: item.sabado === true || item.sabado === 1 || item.sabado === '1' || 
                        (item.fecha_trabajo && item.fecha_trabajo.includes('sabado')) ||
                        (item.dias_trabajo && item.dias_trabajo.includes('sabado')),
                domingo: item.domingo === true || item.domingo === 1 || item.domingo === '1' || 
                         (item.fecha_trabajo && item.fecha_trabajo.includes('domingo')) ||
                         (item.dias_trabajo && item.dias_trabajo.includes('domingo'))
              });
            }
          });
        }
      });
    }
    
    console.log('🔍 Datos de tabla procesados con carteras y clientes:', filas);
    return filas;
  }, [programacion, carterasData, clientesData]);
  
  // Filtrar datos
  const datosFiltrados = useMemo(() => {
    if (!Array.isArray(datosTabla)) {
      return [];
    }
    
    return datosTabla.filter((item: any) => {
      // Siempre mostrar filas de cartera
      if (item.tipo === 'cartera') {
        return true;
      }
      
      // Filtrar filas de personal
      if (item.tipo === 'personal') {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.personal_nombre?.toLowerCase().includes(searchLower) ||
          item.cartera_nombre?.toLowerCase().includes(searchLower) ||
          item.cliente_nombre?.toLowerCase().includes(searchLower) ||
          item.nodo_nombre?.toLowerCase().includes(searchLower) ||
          item.personal_rut?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [datosTabla, searchTerm]);
  
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
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar la programación</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{errorProgramacion instanceof Error ? errorProgramacion.message : 'Error desconocido'}</p>
              <p className="mt-1">Verifica que el backend esté funcionando y que el endpoint esté disponible.</p>
            </div>
          </div>
        </div>
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
        <div className="flex items-center space-x-3">
          {/* Botones de vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVistaActiva('calendario')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                vistaActiva === 'calendario'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Vista Calendario
            </button>
            <button
              onClick={() => setVistaActiva('tabla')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                vistaActiva === 'tabla'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2 inline" />
              Vista Tabla
            </button>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Asignación
          </Button>
        </div>
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
              value={vistaActiva === 'calendario' ? 0 : selectedCartera}
              onChange={(e) => setSelectedCartera(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={vistaActiva === 'calendario'}
            >
              <option value={0}>Todas las carteras</option>
                {carterasData?.data?.map((cartera: any) => (
                  <option key={cartera.id} value={cartera.id}>
                    {cartera.nombre}
                  </option>
                ))}
              </select>
              {vistaActiva === 'calendario' && (
                <p className="text-xs text-gray-500 mt-1">La vista calendario muestra todas las carteras</p>
              )}
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semana
              </label>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  const nuevaFecha = new Date(fechaInicioSemana);
                  nuevaFecha.setDate(nuevaFecha.getDate() - 7);
                  setFechaInicioSemana(nuevaFecha);
                }}
                className="px-3 py-2"
                variant="outline"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <input
                type="date"
                value={fechaInicioSemana.toISOString().split('T')[0]}
                onChange={(e) => setFechaInicioSemana(new Date(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => {
                  const nuevaFecha = new Date(fechaInicioSemana);
                  nuevaFecha.setDate(nuevaFecha.getDate() + 7);
                  setFechaInicioSemana(nuevaFecha);
                }}
                className="px-3 py-2"
                variant="outline"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  const hoy = new Date();
                  setFechaInicioSemana(getFechaInicioSemana(hoy));
                }}
                className="px-3 py-2"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vista de Calendario Jerárquico */}
      {vistaActiva === 'calendario' ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Tabla completa con header y contenido */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 border-r border-gray-300">
                    Cartera
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64 border-r border-gray-300">
                    Cliente/Nodo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 border-r border-gray-300">
                    Personal
                  </th>
                  {fechasSemana.map((fecha, index) => (
                    <th key={index} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16 border-r border-gray-300 last:border-r-0">
                      <div className="text-xs">
                        {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][fecha.getDay()]}
                      </div>
                      <div className="text-xs font-bold">
                        {fecha.getDate()}
                      </div>
                      <div className="text-xs">
                        {fecha.toLocaleDateString('es-ES', { month: 'short' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datosFiltrados.map((fila: any, index: number) => (
                  <tr 
                    key={`${fila.tipo}-${fila.cartera_id}-${fila.personal_rut || ''}-${index}`} 
                    className={`${fila.tipo === 'cartera' ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}
                  >
                    {/* Columna Cartera */}
                    <td className="px-4 py-3 whitespace-nowrap w-32 border-r border-gray-300">
                      {fila.tipo === 'cartera' ? (
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-2 text-gray-600" />
                          <div className="text-sm font-semibold text-gray-900">{fila.cartera_nombre}</div>
                        </div>
                      ) : (
                        <div className="pl-4">
                          {/* Espacio vacío para alinear con filas de personal */}
                        </div>
                      )}
                    </td>
                    
                    {/* Columna Cliente/Nodo */}
                    <td className="px-4 py-3 w-64 border-r border-gray-300">
                      {fila.tipo === 'personal' ? (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{fila.nodo_nombre}</div>
                            <div className="text-xs text-gray-500">{fila.cliente_nombre}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Clientes:</div>
                            <div className="text-xs text-gray-600 mt-1 max-h-20 overflow-y-auto">
                              {fila.cliente_nombre || 'Sin clientes asignados'}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    
                    {/* Columna Personal */}
                    <td className="px-4 py-3 whitespace-nowrap w-48 border-r border-gray-300">
                      {fila.tipo === 'personal' ? (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{fila.personal_nombre}</div>
                            <div className="text-xs text-gray-500">{fila.personal_rut}</div>
                            {fila.personal_telefono && (
                              <div className="text-xs text-gray-500">{fila.personal_telefono}</div>
                            )}
                            {fila.personal_cargo && (
                              <div className="text-xs text-gray-500">{fila.personal_cargo}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          {fila.tipo === 'cartera' ? 'Personal asignado:' : ''}
                        </div>
                      )}
                    </td>
                    
                    {/* Columnas de días */}
                    {fechasSemana.map((fecha, diaIndex) => {
                      const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                      const dia = dias[fecha.getDay()];
                      const estaAsignado = fila[dia];
                      
                      return (
                        <td key={diaIndex} className="px-2 py-3 text-center w-16 border-r border-gray-300 last:border-r-0">
                          {fila.tipo === 'cartera' ? (
                            <div className="text-xs text-gray-500 font-medium">
                              {['D', 'L', 'M', 'X', 'J', 'V', 'S'][fecha.getDay()]}
                            </div>
                          ) : estaAsignado ? (
                            <div className="w-6 h-6 mx-auto bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          ) : (
                            <div className="w-6 h-6 mx-auto bg-gray-200 rounded-full"></div>
                          )}
                        </td>
                      );
                    })}
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
      ) : (
        /* Vista de Tabla Original */
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
      )}
              
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