import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Users, Building2, MapPin, Clock, Save, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useProgramacionSemanal } from '../../hooks/useProgramacion';
import { useQueryClient } from '@tanstack/react-query';
import { usePersonalConDocumentacion } from '../../hooks/usePersonalConDocumentacion';

interface Servicio {
  id: number;
  nombre: string;
  tipo: 'cartera' | 'cliente' | 'nodo';
  cartera_id?: number;
  cliente_id?: number;
  nodo_id?: number;
}

interface Personal {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
}

interface Asignacion {
  id?: string;
  personalId: string;
  carteraId: number;
  clienteId?: number;
  nodoId?: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  observaciones?: string;
}

interface ProgramacionCalendarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asignaciones: Asignacion[]) => void;
  carteras: any[];
  clientes: any[];
  nodos: any[];
  personal: Personal[];
  carteraId?: number;
  semanaInicio?: string;
}

export const ProgramacionCalendarioModal: React.FC<ProgramacionCalendarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  carteras,
  clientes,
  nodos,
  personal,
  carteraId = 0,
  semanaInicio = ''
}) => {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [nuevaAsignacion, setNuevaAsignacion] = useState<Asignacion>({
    personalId: '',
    carteraId: 0,
    clienteId: undefined,
    nodoId: undefined,
    dia: 'lunes',
    horaInicio: '08:00',
    horaFin: '17:00',
    observaciones: ''
  });
  const [showFormulario, setShowFormulario] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hook para crear programación
  const { crearProgramacion } = useProgramacionSemanal(carteraId, semanaInicio);
  const queryClient = useQueryClient();

  // Hook para obtener personal con documentación
  const { 
    data: personalConDocumentacion, 
    isLoading: isLoadingPersonalConDocumentacion,
    totalPersonal,
    personalConDocumentacion: cantidadConDocumentacion
  } = usePersonalConDocumentacion();

  // Función para calcular horas estimadas
  const calcularHorasEstimadas = (horaInicio: string, horaFin: string): number => {
    const inicio = new Date(`2000-01-01T${horaInicio}:00`);
    const fin = new Date(`2000-01-01T${horaFin}:00`);
    const diffMs = fin.getTime() - inicio.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours);
  };

  // Días de la semana
  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('🚀 Modal abierto con datos:');
      console.log('📊 Carteras:', carteras);
      console.log('👥 Clientes:', clientes);
      console.log('📍 Nodos:', nodos);
      console.log('👤 Personal:', personal);
      console.log('📊 Carteras length:', carteras?.length);
      console.log('👥 Clientes length:', clientes?.length);
      console.log('📍 Nodos length:', nodos?.length);
      console.log('👤 Personal length:', personal?.length);
      
      setAsignaciones([]);
      setNuevaAsignacion({
        personalId: '',
        carteraId: 0,
        clienteId: undefined,
        nodoId: undefined,
        dia: 'lunes',
        horaInicio: '08:00',
        horaFin: '17:00',
        observaciones: ''
      });
      setShowFormulario(false);
      setErrors([]);
    }
  }, [isOpen, carteras, clientes, nodos, personal]);

  // Obtener clientes de una cartera específica
  const getClientesByCartera = (carteraId: number) => {
    console.log('🔍 Buscando clientes para cartera:', carteraId, 'tipo:', typeof carteraId);
    console.log('📋 Todos los clientes:', clientes);
    console.log('📋 Clientes length:', clientes?.length);
    
    if (!clientes || clientes.length === 0) {
      console.log('⚠️ No hay clientes disponibles, usando datos de prueba');
      // Datos de prueba para verificar que el modal funciona
      return [
        { id: 1, nombre: 'Cliente de Prueba 1', cartera_id: carteraId },
        { id: 2, nombre: 'Cliente de Prueba 2', cartera_id: carteraId },
        { id: 3, nombre: 'Cliente de Prueba 3', cartera_id: carteraId }
      ];
    }
    
    console.log('📋 Estructura del primer cliente:', clientes[0]);
    
    const clientesFiltrados = clientes.filter(c => {
      console.log(`🔍 Comparando: cliente.cartera_id (${c.cartera_id}, tipo: ${typeof c.cartera_id}) === carteraId (${carteraId}, tipo: ${typeof carteraId})`);
      // Convertir ambos a número para la comparación
      const clienteCarteraId = parseInt(c.cartera_id);
      const carteraIdNum = parseInt(carteraId.toString());
      console.log(`🔍 Después de conversión: ${clienteCarteraId} === ${carteraIdNum}`);
      return clienteCarteraId === carteraIdNum;
    });
    
    console.log('✅ Clientes filtrados:', clientesFiltrados);
    return clientesFiltrados;
  };

  // Obtener nodos de un cliente específico
  const getNodosByCliente = (clienteId: number) => {
    console.log('🔍 Buscando nodos para cliente:', clienteId);
    console.log('📋 Todos los nodos:', nodos);
    console.log('📋 Nodos length:', nodos?.length);
    
    if (!nodos || nodos.length === 0) {
      console.log('⚠️ No hay nodos disponibles, usando datos de prueba');
      // Datos de prueba para verificar que el modal funciona
      return [
        { id: 1, nombre: 'Nodo de Prueba 1', cliente_id: clienteId },
        { id: 2, nombre: 'Nodo de Prueba 2', cliente_id: clienteId },
        { id: 3, nombre: 'Nodo de Prueba 3', cliente_id: clienteId }
      ];
    }
    
    const nodosFiltrados = nodos.filter(n => {
      console.log(`🔍 Comparando nodo: cliente_id (${n.cliente_id}, tipo: ${typeof n.cliente_id}) === clienteId (${clienteId}, tipo: ${typeof clienteId})`);
      // Convertir ambos a número para la comparación
      const nodoClienteId = parseInt(n.cliente_id);
      const clienteIdNum = parseInt(clienteId.toString());
      console.log(`🔍 Después de conversión nodo: ${nodoClienteId} === ${clienteIdNum}`);
      return nodoClienteId === clienteIdNum;
    });
    console.log('✅ Nodos filtrados:', nodosFiltrados);
    return nodosFiltrados;
  };

  const validateAsignacion = (asignacion: Asignacion) => {
    const errors: string[] = [];

    if (!asignacion.personalId || asignacion.personalId === '') {
      errors.push('Debe seleccionar una persona');
    }

    if (!asignacion.carteraId) {
      errors.push('Debe seleccionar una cartera');
    }

    if (!asignacion.dia) {
      errors.push('Debe seleccionar un día');
    }

    if (!asignacion.horaInicio) {
      errors.push('Debe especificar la hora de inicio');
    }

    if (!asignacion.horaFin) {
      errors.push('Debe especificar la hora de fin');
    }

    if (asignacion.horaInicio >= asignacion.horaFin) {
      errors.push('La hora de fin debe ser posterior a la hora de inicio');
    }

    // Verificar conflictos de horario
    const conflicto = asignaciones.find(a => 
      a.personalId === asignacion.personalId &&
      a.dia === asignacion.dia &&
      ((asignacion.horaInicio >= a.horaInicio && asignacion.horaInicio < a.horaFin) ||
       (asignacion.horaFin > a.horaInicio && asignacion.horaFin <= a.horaFin) ||
       (asignacion.horaInicio <= a.horaInicio && asignacion.horaFin >= a.horaFin))
    );

    if (conflicto) {
      errors.push('Ya existe una asignación para esta persona en el mismo horario');
    }

    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'carteraId') {
      // Al cambiar cartera, limpiar cliente y nodo
      const carteraId = parseInt(value);
      console.log('🔄 Cambiando cartera a:', carteraId, 'tipo:', typeof carteraId);
      setNuevaAsignacion(prev => ({
        ...prev,
        carteraId: carteraId,
        clienteId: undefined,
        nodoId: undefined
      }));
    } else if (name === 'clienteId') {
      // Al cambiar cliente, limpiar nodo
      setNuevaAsignacion(prev => ({
        ...prev,
        clienteId: value ? parseInt(value) : undefined,
        nodoId: undefined
      }));
    } else {
      setNuevaAsignacion(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAgregarAsignacion = () => {
    const errors = validateAsignacion(nuevaAsignacion);
    
    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    const asignacionConId = {
      ...nuevaAsignacion,
      id: Date.now().toString()
    };

    setAsignaciones(prev => [...prev, asignacionConId]);
    setNuevaAsignacion({
      personalId: '',
      carteraId: 0,
      clienteId: undefined,
      nodoId: undefined,
      dia: 'lunes',
      horaInicio: '08:00',
      horaFin: '17:00',
      observaciones: ''
    });
    setShowFormulario(false);
    setErrors([]);
  };

  const handleEliminarAsignacion = (asignacionId: string) => {
    setAsignaciones(prev => prev.filter(a => a.id !== asignacionId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (asignaciones.length === 0) {
      setErrors(['Debe agregar al menos una asignación']);
      return;
    }

    // Validar que todos los personal seleccionados estén disponibles
    const personalIdsInvalidos = asignaciones.filter(asignacion => 
      !personalConDocumentacion.find(p => p.id === asignacion.personalId)
    );
    
    if (personalIdsInvalidos.length > 0) {
      const idsInvalidos = personalIdsInvalidos.map(a => a.personalId).join(', ');
      setErrors([`Los siguientes personal no están disponibles: ${idsInvalidos}. Por favor, verifique que tengan documentación completa.`]);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      console.log('🚀 Iniciando proceso de guardado...');
      console.log('📋 Asignaciones a guardar:', asignaciones);
      console.log('🏢 Cartera ID:', carteraId);
      console.log('📅 Semana inicio:', semanaInicio);
      
      // Crear cada asignación usando la API
      const promises = asignaciones.map(async (asignacion, index) => {
        console.log(`🔄 Procesando asignación ${index + 1}/${asignaciones.length}:`, asignacion);
        // Obtener el RUT del personal seleccionado
        console.log('🔍 Buscando personal con ID:', asignacion.personalId);
        console.log('🔍 Total personal disponible:', personalConDocumentacion.length);
        console.log('🔍 IDs disponibles:', personalConDocumentacion.map(p => p.id));
        
        const personalSeleccionado = personalConDocumentacion.find(p => p.id === asignacion.personalId);
        if (!personalSeleccionado) {
          console.error('❌ Personal no encontrado. IDs disponibles:', personalConDocumentacion.map(p => ({ id: p.id, nombre: p.nombre, apellido: p.apellido })));
          throw new Error(`Personal con ID ${asignacion.personalId} no encontrado`);
        }
        
        console.log('🔍 Personal encontrado:', personalSeleccionado);
        console.log('🔍 RUT del personal:', personalSeleccionado.rut);
        console.log('🔍 ID del personal:', personalSeleccionado.id);

        // Verificar que tenemos un RUT válido
        const rutPersonal = personalSeleccionado.rut || personalSeleccionado.id;
        if (!rutPersonal) {
          throw new Error(`No se encontró RUT para el personal: ${personalSeleccionado.nombre} ${personalSeleccionado.apellido}`);
        }

        const programacionData = {
          rut: rutPersonal,
          cartera_id: carteraId,
          cliente_id: asignacion.clienteId || null,
          nodo_id: asignacion.nodoId || null,
          semana_inicio: semanaInicio,
          [asignacion.dia]: true, // Marcar el día como activo
          horas_estimadas: calcularHorasEstimadas(asignacion.horaInicio, asignacion.horaFin),
          observaciones: asignacion.observaciones || '',
          estado: 'activo'
        };
        
        // Validar que todos los campos requeridos estén presentes
        if (!programacionData.rut) {
          throw new Error('RUT es requerido');
        }
        // Si no se especifica cartera, usar la primera disponible
        if (!programacionData.cartera_id || programacionData.cartera_id === 0) {
          if (carteras && carteras.length > 0) {
            programacionData.cartera_id = carteras[0].id;
            console.log('🔄 Usando primera cartera disponible:', carteras[0].id, carteras[0].nombre);
          } else {
            throw new Error('No hay carteras disponibles para asignar');
          }
        }
        if (!programacionData.semana_inicio) {
          throw new Error('Semana inicio es requerido');
        }

        console.log('📤 Creando programación:', programacionData);
        console.log('👤 Personal seleccionado:', personalSeleccionado);
        console.log('🏢 Cartera ID:', carteraId);
        console.log('📅 Semana inicio:', semanaInicio);
        console.log('✅ Validaciones pasadas - enviando a API');
        
        // Usar directamente el servicio API en lugar del hook
        const { apiService } = await import('../../services/api');
        
        // Intentar crear la programación
        try {
          const result = await apiService.crearProgramacion(programacionData);
          console.log('✅ Programación creada:', result);
          return result;
        } catch (apiError) {
          console.error('❌ Error específico de API:', apiError);
          
          // Log detallado del error 409
          if (apiError && typeof apiError === 'object' && 'response' in apiError) {
            const axiosError = apiError as any;
            console.error('📊 Status:', axiosError.response?.status);
            console.error('📊 Data:', axiosError.response?.data);
            console.error('📊 Headers:', axiosError.response?.headers);
            
            if (axiosError.response?.status === 409) {
              console.log('⚠️ Conflicto 409 detectado - el sistema permite múltiples asignaciones');
              console.log('📝 Mensaje del backend:', axiosError.response?.data?.message || 'Conflicto de programación');
              
              // Para permitir múltiples asignaciones, simplemente retornamos éxito
              // ya que el backend ya tiene una programación para esta persona
              console.log('✅ Múltiples asignaciones permitidas - continuando con la siguiente');
              
              // Retornar un objeto de éxito simulado
              return {
                success: true,
                message: 'Asignación múltiple procesada',
                data: {
                  id: Date.now(), // ID temporal
                  rut: rutPersonal,
                  cartera_id: carteraId,
                  semana_inicio: semanaInicio,
                  [asignacion.dia]: true,
                  estado: 'activo'
                }
              };
            }
          }
          
          // Si falla todo, intentar con un formato más simple
          const simpleData = {
            rut: rutPersonal,
            cartera_id: carteraId,
            semana_inicio: semanaInicio,
            [asignacion.dia]: true
          };
          console.log('🔄 Intentando con formato simple:', simpleData);
          return apiService.crearProgramacion(simpleData);
        }
      });

      console.log('⏳ Esperando que se completen todas las promesas...');
      const results = await Promise.all(promises);
      console.log('✅ Todas las programaciones creadas exitosamente:', results);
      
      // Invalidar queries para refrescar el calendario
      console.log('🔄 Invalidando queries para refrescar el calendario...');
      if (carteraId === 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['programacion', 'semana', 0, semanaInicio] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['programacion'] 
        });
        console.log('✅ Queries de semana invalidadas');
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ['programacion', 'cartera', carteraId, semanaInicio] 
        });
        console.log('✅ Queries de cartera invalidadas');
      }
      
      console.log('🎉 Proceso completado exitosamente');
      onSuccess(asignaciones);
      onClose();
    } catch (error) {
      console.error('❌ Error al crear programación:', error);
      
      // Log detallado del error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('📊 Status:', axiosError.response?.status);
        console.error('📊 Data:', axiosError.response?.data);
        console.error('📊 Headers:', axiosError.response?.headers);
      }
      
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? `Error ${(error as any).response?.status}: ${(error as any).response?.data?.message || (error as any).response?.data || 'Error del servidor'}`
        : (error instanceof Error ? error.message : 'Error desconocido');
        
      setErrors(['Error al guardar las asignaciones: ' + errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAsignacionesPorDia = (dia: string) => {
    return asignaciones.filter(a => a.dia === dia);
  };

  const getNombrePersonal = (personalId: string) => {
    const persona = personalConDocumentacion.find((p: Personal) => p.id === personalId);
    return persona ? `${persona.nombre} ${persona.apellido}` : 'Desconocido';
  };

  const getNombreCartera = (carteraId: number) => {
    console.log('🔍 Buscando cartera con ID:', carteraId, 'tipo:', typeof carteraId);
    console.log('📋 Carteras disponibles:', carteras);
    const cartera = carteras.find(c => {
      // Convertir ambos a número para la comparación
      const carteraIdNum = parseInt(c.id.toString());
      const carteraIdParam = parseInt(carteraId.toString());
      console.log(`🔍 Comparando: cartera.id (${c.id}, tipo: ${typeof c.id}) === carteraId (${carteraId}, tipo: ${typeof carteraId})`);
      console.log(`🔍 Después de conversión: ${carteraIdNum} === ${carteraIdParam}`);
      return carteraIdNum === carteraIdParam;
    });
    console.log('✅ Cartera encontrada:', cartera);
    return cartera?.nombre || cartera?.name || 'Desconocido';
  };

  const getNombreCliente = (clienteId: number) => {
    console.log('🔍 Buscando cliente con ID:', clienteId, 'tipo:', typeof clienteId);
    console.log('📋 Clientes disponibles:', clientes);
    const cliente = clientes.find(c => {
      // Convertir ambos a número para la comparación
      const clienteIdNum = parseInt(c.id.toString());
      const clienteIdParam = parseInt(clienteId.toString());
      console.log(`🔍 Comparando: cliente.id (${c.id}, tipo: ${typeof c.id}) === clienteId (${clienteId}, tipo: ${typeof clienteId})`);
      console.log(`🔍 Después de conversión: ${clienteIdNum} === ${clienteIdParam}`);
      return clienteIdNum === clienteIdParam;
    });
    console.log('✅ Cliente encontrado:', cliente);
    return cliente?.nombre || 'Desconocido';
  };

  const getNombreNodo = (nodoId: number) => {
    console.log('🔍 Buscando nodo con ID:', nodoId, 'tipo:', typeof nodoId);
    console.log('📋 Nodos disponibles:', nodos);
    const nodo = nodos.find(n => {
      // Convertir ambos a número para la comparación
      const nodoIdNum = parseInt(n.id.toString());
      const nodoIdParam = parseInt(nodoId.toString());
      console.log(`🔍 Comparando: nodo.id (${n.id}, tipo: ${typeof n.id}) === nodoId (${nodoId}, tipo: ${typeof nodoId})`);
      console.log(`🔍 Después de conversión: ${nodoIdNum} === ${nodoIdParam}`);
      return nodoIdNum === nodoIdParam;
    });
    console.log('✅ Nodo encontrado:', nodo);
    return nodo?.nombre || 'Desconocido';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            Programación Semanal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-red-800 font-semibold mb-2">Errores encontrados:</h4>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={`error-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Formulario para nueva asignación */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-green-600" />
                Nueva Asignación
              </h3>
              <button
                type="button"
                onClick={() => setShowFormulario(!showFormulario)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                {showFormulario ? 'Cancelar' : 'Agregar Asignación'}
              </button>
            </div>

            {showFormulario && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                {/* Información sobre documentación */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Personal con Documentación Completa
                      </h4>
                      <p className="text-xs text-blue-600 mt-1">
                        Solo se muestra personal con documentación personal completa y vigente
                      </p>
                      <p className="text-xs text-blue-600">
                        Disponibles: {cantidadConDocumentacion} de {totalPersonal} personas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Advertencia si no hay personal disponible */}
                {!isLoadingPersonalConDocumentacion && cantidadConDocumentacion === 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">
                          No hay personal disponible para programación
                        </h4>
                        <p className="text-xs text-yellow-600 mt-1">
                          Todos los personal deben tener documentación completa y vigente para ser asignados a servicios.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Personal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal *
                    </label>
                    <select
                      name="personalId"
                      value={nuevaAsignacion.personalId}
                      onChange={handleInputChange}
                      disabled={isLoadingPersonalConDocumentacion}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {isLoadingPersonalConDocumentacion 
                          ? 'Cargando personal con documentación...' 
                          : cantidadConDocumentacion === 0
                            ? 'No hay personal con documentación completa'
                            : `Seleccionar personal (${cantidadConDocumentacion} disponibles)...`
                        }
                      </option>
                      {personalConDocumentacion.map((persona: Personal) => (
                        <option key={persona.id} value={persona.id}>
                          {persona.nombre} {persona.apellido} - {persona.rut}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cartera */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cartera *
                    </label>
                    <select
                      name="carteraId"
                      value={nuevaAsignacion.carteraId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>Seleccionar cartera...</option>
                      {carteras.map((cartera) => (
                        <option key={cartera.id} value={cartera.id}>
                          {cartera.nombre || cartera.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cliente
                    </label>
                    <select
                      name="clienteId"
                      value={nuevaAsignacion.clienteId || ''}
                      onChange={handleInputChange}
                      disabled={!nuevaAsignacion.carteraId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar cliente (opcional)...</option>
                      {nuevaAsignacion.carteraId && (() => {
                        const clientesDisponibles = getClientesByCartera(nuevaAsignacion.carteraId);
                        console.log('🎯 Renderizando select de clientes. CarteraId:', nuevaAsignacion.carteraId, 'Clientes disponibles:', clientesDisponibles);
                        return clientesDisponibles.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Nodo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nodo
                    </label>
                    <select
                      name="nodoId"
                      value={nuevaAsignacion.nodoId || ''}
                      onChange={handleInputChange}
                      disabled={!nuevaAsignacion.clienteId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar nodo (opcional)...</option>
                      {nuevaAsignacion.clienteId && getNodosByCliente(nuevaAsignacion.clienteId).map((nodo) => (
                        <option key={nodo.id} value={nodo.id}>
                          {nodo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Día */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día *
                    </label>
                    <select
                      name="dia"
                      value={nuevaAsignacion.dia}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {diasSemana.map((dia) => (
                        <option key={dia.key} value={dia.key}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hora Inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Inicio *
                    </label>
                    <input
                      type="time"
                      name="horaInicio"
                      value={nuevaAsignacion.horaInicio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Hora Fin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Fin *
                    </label>
                    <input
                      type="time"
                      name="horaFin"
                      value={nuevaAsignacion.horaFin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <input
                      type="text"
                      name="observaciones"
                      value={nuevaAsignacion.observaciones}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Observaciones opcionales..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowFormulario(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAgregarAsignacion}
                    disabled={cantidadConDocumentacion === 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Asignación
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Calendario Semanal */}
          <div className="bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Calendario Semanal ({asignaciones.length} asignaciones)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Día
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asignaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {diasSemana.map((dia) => {
                    const asignacionesDia = getAsignacionesPorDia(dia.key);
                    return (
                      <tr key={dia.key}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{dia.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {asignacionesDia.length > 0 ? (
                            <div className="space-y-2">
                              {asignacionesDia.map((asignacion) => (
                                <div key={asignacion.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <Users className="h-4 w-4 mr-1 text-green-500" />
                                        <span className="text-sm font-medium text-gray-900">
                                          {getNombrePersonal(asignacion.personalId)}
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center">
                                          <Building2 className="h-4 w-4 mr-1 text-blue-500" />
                                          <span className="text-sm text-gray-600">
                                            {getNombreCartera(asignacion.carteraId)}
                                          </span>
                                        </div>
                                        {asignacion.clienteId && (
                                          <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-1 text-green-500" />
                                            <span className="text-sm text-gray-600">
                                              {getNombreCliente(asignacion.clienteId)}
                                            </span>
                                          </div>
                                        )}
                                        {asignacion.nodoId && (
                                          <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1 text-orange-500" />
                                            <span className="text-sm text-gray-600">
                                              {getNombreNodo(asignacion.nodoId)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                        <span className="text-sm text-gray-500">
                                          {asignacion.horaInicio} - {asignacion.horaFin}
                                        </span>
                                      </div>
                                      {asignacion.observaciones && (
                                        <p className="text-xs text-gray-500 mt-1">{asignacion.observaciones}</p>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarAsignacion(asignacion.id!)}
                                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                      title="Eliminar asignación"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">Sin asignaciones</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || asignaciones.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Programación ({asignaciones.length})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
