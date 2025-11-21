import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { 
  MinimoPersonal, 
  CreateMinimoPersonalData, 
  UpdateMinimoPersonalData, 
  MinimoPersonalCalculo 
} from '../types';

// ==================== HOOKS PARA MÍNIMO PERSONAL ====================

export const useMinimoPersonal = (params?: { 
  limit?: number; 
  offset?: number; 
  search?: string;
  servicio_id?: number;
  cartera_id?: number;
  cliente_id?: number;
  nodo_id?: number;
}) => {
  return useQuery({
    queryKey: ['minimo-personal', params],
    queryFn: () => apiService.getMinimoPersonal(params),
    select: (data) => data,
    onSuccess: (data) => {
      try {
        // Mostrar resultado bruto en consola para diagnóstico
        // eslint-disable-next-line no-console
        console.log('useMinimoPersonal - onSuccess:', Array.isArray(data?.data) ? data.data.length : 'no-data', data?.data?.slice?.(0,3));
      } catch (e) {
        // ignore
      }
    },
    onError: (err: any) => {
      // eslint-disable-next-line no-console
      console.error('useMinimoPersonal - onError:', err?.response?.status || err?.message || err);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

export const useMinimoPersonalById = (id: number) => {
  return useQuery({
    queryKey: ['minimo-personal', id],
    queryFn: () => apiService.getMinimoPersonalById(id),
    select: (data) => data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateMinimoPersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMinimoPersonalData) => apiService.createMinimoPersonal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minimo-personal'] });
    },
  });
};

export const useUpdateMinimoPersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMinimoPersonalData }) => 
      apiService.updateMinimoPersonal(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['minimo-personal'] });
      queryClient.invalidateQueries({ queryKey: ['minimo-personal', id] });
    },
  });
};

export const useDeleteMinimoPersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteMinimoPersonal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minimo-personal'] });
    },
  });
};

export const useCalcularMinimoPersonal = (id: number) => {
  return useQuery({
    queryKey: ['minimo-personal-calculo', id],
    queryFn: () => apiService.calcularMinimoPersonal(id),
    select: (data) => data,
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos (cálculos pueden cambiar más frecuentemente)
  });
};

// Hook para recalcular mínimo personal (mutation)
export const useRecalcularMinimoPersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.calcularMinimoPersonal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['minimo-personal-calculo', id] });
    },
  });
};

// Hook combinado para dashboard de mínimo personal
export const useMinimoPersonalDashboard = (filters?: {
  cartera_id?: number;
  cliente_id?: number;
  nodo_id?: number;
}) => {
  // Deshabilitado temporalmente por error 500
  // const { data: minimoPersonal, isLoading: minimoPersonalLoading } = useMinimoPersonal({
  //   limit: 100,
  //   ...filters
  // });
  const minimoPersonal: any = null;
  const minimoPersonalLoading = false;

  return {
    minimoPersonal: minimoPersonal?.data || [],
    isLoading: minimoPersonalLoading,
    error: minimoPersonal?.success === false
  };
};
