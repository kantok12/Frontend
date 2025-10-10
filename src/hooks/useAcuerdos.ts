import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { 
  Acuerdo, 
  CreateAcuerdoData, 
  UpdateAcuerdoData, 
  AcuerdoVencer 
} from '../types';

// ==================== HOOKS PARA ACUERDOS ====================

export const useAcuerdos = (params?: { 
  limit?: number; 
  offset?: number; 
  search?: string;
  tipo_acuerdo?: string;
  estado?: string;
}) => {
  return useQuery({
    queryKey: ['acuerdos', params],
    queryFn: () => apiService.getAcuerdos(params),
    select: (data) => data,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

export const useAcuerdoById = (id: number) => {
  return useQuery({
    queryKey: ['acuerdo', id],
    queryFn: () => apiService.getAcuerdoById(id),
    select: (data) => data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateAcuerdo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAcuerdoData) => apiService.createAcuerdo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acuerdos'] });
      queryClient.invalidateQueries({ queryKey: ['acuerdos-vencer'] });
    },
  });
};

export const useUpdateAcuerdo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAcuerdoData }) => 
      apiService.updateAcuerdo(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['acuerdos'] });
      queryClient.invalidateQueries({ queryKey: ['acuerdo', id] });
      queryClient.invalidateQueries({ queryKey: ['acuerdos-vencer'] });
    },
  });
};

export const useDeleteAcuerdo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteAcuerdo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acuerdos'] });
      queryClient.invalidateQueries({ queryKey: ['acuerdos-vencer'] });
    },
  });
};

export const useAcuerdosVencer = () => {
  return useQuery({
    queryKey: ['acuerdos-vencer'],
    queryFn: () => apiService.getAcuerdosVencer(),
    select: (data) => data,
    staleTime: 2 * 60 * 1000, // 2 minutos (datos de vencimiento pueden cambiar frecuentemente)
    retry: 2,
  });
};

export const useActivarAcuerdo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.activarAcuerdo(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['acuerdos'] });
      queryClient.invalidateQueries({ queryKey: ['acuerdo', id] });
      queryClient.invalidateQueries({ queryKey: ['acuerdos-vencer'] });
    },
  });
};

export const useDesactivarAcuerdo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.desactivarAcuerdo(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['acuerdos'] });
      queryClient.invalidateQueries({ queryKey: ['acuerdo', id] });
      queryClient.invalidateQueries({ queryKey: ['acuerdos-vencer'] });
    },
  });
};

// Hook combinado para dashboard de acuerdos
export const useAcuerdosDashboard = (filters?: {
  tipo_acuerdo?: string;
  estado?: string;
}) => {
  const { data: acuerdos, isLoading: acuerdosLoading } = useAcuerdos({
    limit: 100,
    ...filters
  });
  
  const { data: acuerdosVencer, isLoading: acuerdosVencerLoading } = useAcuerdosVencer();

  return {
    acuerdos: acuerdos?.data || [],
    acuerdosVencer: acuerdosVencer?.data || [],
    isLoading: acuerdosLoading || acuerdosVencerLoading,
    error: acuerdos?.success === false || acuerdosVencer?.success === false
  };
};

// Hook para estadísticas de acuerdos
export const useAcuerdosStats = () => {
  const { data: acuerdos, isLoading: acuerdosLoading } = useAcuerdos({ limit: 1000 });
  const { data: acuerdosVencer, isLoading: acuerdosVencerLoading } = useAcuerdosVencer();

  const isLoading = acuerdosLoading || acuerdosVencerLoading;

  // Calcular estadísticas
  const stats = isLoading ? null : {
    total: acuerdos?.data?.length || 0,
    activos: acuerdos?.data?.filter((a: Acuerdo) => a.estado === 'activo').length || 0,
    inactivos: acuerdos?.data?.filter((a: Acuerdo) => a.estado === 'inactivo').length || 0,
    vencidos: acuerdos?.data?.filter((a: Acuerdo) => a.estado === 'vencido').length || 0,
    pendientes: acuerdos?.data?.filter((a: Acuerdo) => a.estado === 'pendiente').length || 0,
    porVencer: acuerdosVencer?.data?.length || 0,
    criticos: acuerdosVencer?.data?.filter((a: AcuerdoVencer) => a.alerta === 'critica').length || 0,
    advertencias: acuerdosVencer?.data?.filter((a: AcuerdoVencer) => a.alerta === 'advertencia').length || 0,
  };

  return {
    stats,
    isLoading,
    error: acuerdos?.success === false || acuerdosVencer?.success === false
  };
};
