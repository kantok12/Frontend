import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useProgramacionSemanal } from './useProgramacion';

// Hook para obtener programación optimizada por cartera y rango de fechas
export const useProgramacionOptimizada = (
  carteraId: number = 0,
  fechaInicio?: string,
  fechaFin?: string
) => {

  // Usar SOLO el sistema optimizado
  const optimizedQuery = useQuery({
    queryKey: ['programacion-optimizada', carteraId, fechaInicio, fechaFin],
    queryFn: async () => {
      return await apiService.getProgramacionOptimizada({
        cartera_id: carteraId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
    },
    enabled: carteraId >= 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 0, // Sin reintentos - mostrar error inmediatamente
    retryOnMount: false,
  });


  // Retornar directamente el sistema optimizado
  return {
    data: optimizedQuery.data,
    isLoading: optimizedQuery.isLoading,
    error: optimizedQuery.error,
    isFallback: false // Siempre sistema optimizado
  };
};

// Hook para obtener programación de una persona específica
export const useProgramacionPersonaOptimizada = (rut: string, dias: number = 30) => {
  return useQuery({
    queryKey: ['programacion-optimizada', 'persona', rut, dias],
    queryFn: () => apiService.getProgramacionPersona(rut, dias),
    enabled: !!rut,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

// Hook para vista de calendario mensual
export const useCalendarioOptimizado = (carteraId: number, año: number, mes: number) => {
  return useQuery({
    queryKey: ['programacion-optimizada', 'calendario', carteraId, año, mes],
    queryFn: () => apiService.getCalendarioOptimizado({
      cartera_id: carteraId,
      mes: mes,
      año: año
    }),
    enabled: carteraId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

// Hook para crear programación optimizada
export const useCrearProgramacionOptimizada = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiService.crearProgramacionOptimizada(data),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con programación optimizada
      queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
      queryClient.invalidateQueries({ queryKey: ['programacion'] });
    },
  });
};

// Hook para crear programación de semana completa
export const useCrearProgramacionSemanaOptimizada = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiService.crearProgramacionSemanaOptimizada(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
      queryClient.invalidateQueries({ queryKey: ['programacion'] });
    },
  });
};

// Hook para actualizar programación optimizada
export const useActualizarProgramacionOptimizada = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiService.actualizarProgramacionOptimizada(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
      queryClient.invalidateQueries({ queryKey: ['programacion'] });
    },
  });
};

// Hook para eliminar programación optimizada
export const useEliminarProgramacionOptimizada = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.eliminarProgramacionOptimizada(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
      queryClient.invalidateQueries({ queryKey: ['programacion'] });
    },
  });
};
