import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { 
  CreateProgramacionData,
  UpdateProgramacionData,
  ProgramacionFilters
} from '../types';

// Hook para obtener programación por cartera y semana
export const useProgramacionPorCartera = (carteraId?: number, semana?: string, fecha?: string) => {
  return useQuery({
    queryKey: ['programacion', 'cartera', carteraId, semana, fecha],
    queryFn: () => apiService.getProgramacionPorCartera(carteraId!, semana, fecha),
    enabled: !!carteraId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook para obtener programación de una persona
export const useProgramacionPersona = (rut?: string, semanas: number = 4) => {
  return useQuery({
    queryKey: ['programacion', 'persona', rut, semanas],
    queryFn: () => apiService.getProgramacionPersona(rut!, semanas),
    enabled: !!rut,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook para obtener programación de toda la semana
export const useProgramacionSemana = (fecha?: string) => {
  return useQuery({
    queryKey: ['programacion', 'semana', fecha],
    queryFn: () => apiService.getProgramacionSemana(fecha!),
    enabled: !!fecha,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook principal para gestión de programación
export const useProgramacion = (filters?: ProgramacionFilters) => {
  const queryClient = useQueryClient();

  // Query para obtener programación según filtros
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['programacion', 'list', filters],
    queryFn: async () => {
      if (filters?.cartera_id) {
        return apiService.getProgramacionPorCartera(filters.cartera_id, filters.semana, filters.fecha);
      }
      if (filters?.rut) {
        return apiService.getProgramacionPersona(filters.rut, filters.semanas);
      }
      if (filters?.fecha) {
        return apiService.getProgramacionSemana(filters.fecha);
      }
      throw new Error('Filtros insuficientes para obtener programación');
    },
    enabled: !!(filters?.cartera_id || filters?.rut || filters?.fecha),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  // Mutation para crear programación
  const crearProgramacion = useMutation({
    mutationFn: (programacion: CreateProgramacionData) => 
      apiService.crearProgramacion(programacion),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con programación
      queryClient.invalidateQueries({ queryKey: ['programacion'] });
    },
  });

  // Mutation para actualizar programación
  const actualizarProgramacion = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateProgramacionData }) => 
      apiService.actualizarProgramacion(id, updates),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con programación
      queryClient.invalidateQueries({ queryKey: ['programacion'] });
    },
  });

  // Mutation para eliminar programación
  const eliminarProgramacion = useMutation({
    mutationFn: (id: number) => apiService.eliminarProgramacion(id),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con programación
      queryClient.invalidateQueries({ queryKey: ['programacion'] });
    },
  });

  // Función para actualizar días de trabajo
  const actualizarDias = async (id: number, dia: string, valor: boolean) => {
    const updates: UpdateProgramacionData = { [dia]: valor };
    return actualizarProgramacion.mutateAsync({ id, updates });
  };

  // Función para actualizar estado
  const actualizarEstado = async (id: number, estado: string) => {
    const updates: UpdateProgramacionData = { estado };
    return actualizarProgramacion.mutateAsync({ id, updates });
  };

  // Función para actualizar horas estimadas
  const actualizarHoras = async (id: number, horas: number) => {
    const updates: UpdateProgramacionData = { horas_estimadas: horas };
    return actualizarProgramacion.mutateAsync({ id, updates });
  };

  // Función para actualizar observaciones
  const actualizarObservaciones = async (id: number, observaciones: string) => {
    const updates: UpdateProgramacionData = { observaciones };
    return actualizarProgramacion.mutateAsync({ id, updates });
  };

  // Función para actualizar asignación (cliente/nodo)
  const actualizarAsignacion = async (id: number, clienteId?: number, nodoId?: number) => {
    const updates: UpdateProgramacionData = {};
    if (clienteId !== undefined) updates.cliente_id = clienteId;
    if (nodoId !== undefined) updates.nodo_id = nodoId;
    return actualizarProgramacion.mutateAsync({ id, updates });
  };

  return {
    // Datos
    programacion: data?.data,
    isLoading,
    error,
    refetch,
    
    // Mutations
    crearProgramacion,
    actualizarProgramacion,
    eliminarProgramacion,
    
    // Funciones de conveniencia
    actualizarDias,
    actualizarEstado,
    actualizarHoras,
    actualizarObservaciones,
    actualizarAsignacion,
    
    // Estados de mutations
    isCreating: crearProgramacion.isPending,
    isUpdating: actualizarProgramacion.isPending,
    isDeleting: eliminarProgramacion.isPending,
  };
};

// Hook para gestión de programación semanal con cartera específica
export const useProgramacionSemanal = (carteraId: number, semanaInicio: string) => {
  const queryClient = useQueryClient();

  // Query para obtener programación - usar endpoint diferente según carteraId
  const { data, isLoading, error } = useQuery({
    queryKey: ['programacion', carteraId === 0 ? 'semana' : 'cartera', carteraId, semanaInicio],
    queryFn: async () => {
      console.log('🔍 useProgramacionSemanal - carteraId:', carteraId, 'semanaInicio:', semanaInicio);
      if (carteraId === 0) {
        // Obtener programación de toda la semana (todas las carteras)
        console.log('🔍 Obteniendo programación de TODAS las carteras');
        try {
          // Intentar primero con el endpoint de semana
          const result = await apiService.getProgramacionSemana(semanaInicio);
          console.log('📊 Resultado programación semanal:', result);
          return result;
        } catch (error) {
          console.warn('⚠️ Endpoint de semana no disponible, intentando con todas las carteras individualmente');
          // Si falla, obtener todas las carteras y luego sus programaciones
          const carterasResponse = await apiService.getCarteras();
          if (carterasResponse.success && carterasResponse.data) {
            const carteras = carterasResponse.data;
            console.log('📊 Carteras encontradas:', carteras.length);
            
            // Obtener programación de cada cartera
            const programacionesPromises = carteras.map(async (cartera: any) => {
              try {
                const programacion = await apiService.getProgramacionPorCartera(cartera.id, semanaInicio);
                return programacion.success ? programacion.data : null;
              } catch (error) {
                console.warn(`⚠️ Error obteniendo programación de cartera ${cartera.id}:`, error);
                return null;
              }
            });
            
            const programaciones = await Promise.all(programacionesPromises);
            const programacionesValidas = programaciones.filter(p => p !== null);
            
            console.log('📊 Programaciones obtenidas:', programacionesValidas.length);
            
            // Combinar todas las programaciones
            const todasProgramaciones = programacionesValidas.flat();
            
            return {
              success: true,
              data: {
                programacion: todasProgramaciones,
                cartera: null // No hay cartera específica cuando se obtienen todas
              }
            };
          } else {
            throw new Error('No se pudieron obtener las carteras');
          }
        }
      } else {
        // Obtener programación de una cartera específica
        console.log('🔍 Obteniendo programación de cartera específica:', carteraId);
        const result = await apiService.getProgramacionPorCartera(carteraId, semanaInicio);
        console.log('📊 Resultado programación cartera:', result);
        return result;
      }
    },
    enabled: !!semanaInicio,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  // Mutation para crear programación en la cartera
  const crearProgramacion = useMutation({
    mutationFn: (programacion: Omit<CreateProgramacionData, 'cartera_id' | 'semana_inicio'>) => 
      apiService.crearProgramacion({
        ...programacion,
        cartera_id: carteraId,
        semana_inicio: semanaInicio,
      }),
    onSuccess: () => {
      // Invalidar queries según el tipo de vista
      if (carteraId === 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['programacion', 'semana', carteraId, semanaInicio] 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ['programacion', 'cartera', carteraId, semanaInicio] 
        });
      }
    },
  });

  // Mutation para actualizar programación
  const actualizarProgramacion = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateProgramacionData }) => 
      apiService.actualizarProgramacion(id, updates),
    onSuccess: () => {
      // Invalidar queries según el tipo de vista
      if (carteraId === 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['programacion', 'semana', carteraId, semanaInicio] 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ['programacion', 'cartera', carteraId, semanaInicio] 
        });
      }
    },
  });

  // Mutation para eliminar programación
  const eliminarProgramacion = useMutation({
    mutationFn: (id: number) => apiService.eliminarProgramacion(id),
    onSuccess: () => {
      // Invalidar queries según el tipo de vista
      if (carteraId === 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['programacion', 'semana', carteraId, semanaInicio] 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ['programacion', 'cartera', carteraId, semanaInicio] 
        });
      }
    },
  });

  // Función para alternar día de trabajo
  const alternarDia = async (id: number, dia: string) => {
    const programacion = data?.data?.programacion?.find((p: any) => p.id === id);
    if (!programacion) return;
    
    const nuevoValor = !programacion[dia];
    return actualizarProgramacion.mutateAsync({ 
      id, 
      updates: { [dia]: nuevoValor } 
    });
  };

  // Función para calcular total de horas de la semana
  const calcularTotalHoras = () => {
    if (!data?.data?.programacion) return 0;
    return data.data.programacion.reduce((total: number, p: any) => {
      const diasTrabajados = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
        .filter(dia => p[dia]).length;
      return total + (diasTrabajados * p.horas_estimadas);
    }, 0);
  };

  // Función para obtener trabajadores únicos
  const getTrabajadoresUnicos = () => {
    if (!data?.data?.programacion) return [];
    const trabajadores = new Map();
    data.data.programacion.forEach((p: any) => {
      if (!trabajadores.has(p.rut)) {
        trabajadores.set(p.rut, {
          rut: p.rut,
          nombre: p.nombre_persona,
          cargo: p.cargo,
          programaciones: []
        });
      }
      trabajadores.get(p.rut).programaciones.push(p);
    });
    return Array.from(trabajadores.values());
  };

  // Logs detallados para diagnosticar
  console.log('🔍 useProgramacionSemanal - data completa:', data);
  console.log('🔍 useProgramacionSemanal - data.data:', data?.data);
  console.log('🔍 useProgramacionSemanal - data.data.programacion:', data?.data?.programacion);
  console.log('🔍 useProgramacionSemanal - programacion length:', data?.data?.programacion?.length);

  return {
    // Datos
    programacion: data?.data?.programacion || [],
    cartera: data?.data?.cartera,
    semana: data?.data?.semana,
    isLoading,
    error,
    
    // Mutations
    crearProgramacion,
    actualizarProgramacion,
    eliminarProgramacion,
    
    // Funciones de conveniencia
    alternarDia,
    calcularTotalHoras,
    getTrabajadoresUnicos,
    
    // Estados de mutations
    isCreating: crearProgramacion.isPending,
    isUpdating: actualizarProgramacion.isPending,
    isDeleting: eliminarProgramacion.isPending,
  };
};