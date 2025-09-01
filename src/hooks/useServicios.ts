import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Servicio, CreateServicioData, UpdateServicioData } from '../types';

// Hook para obtener lista de servicios con paginación y filtros
export const useServiciosList = (page = 1, limit = 10, search = '', filters: any = {}) => {
  return useQuery({
    queryKey: ['servicios', 'list', page, limit, search, filters],
    queryFn: () => apiService.getServicios(page, limit, search, JSON.stringify(filters)),
    staleTime: 5 * 60 * 1000, // 5 minutos
    keepPreviousData: true,
  });
};

// Hook para obtener servicio por ID
export const useServicioById = (id: string) => {
  return useQuery({
    queryKey: ['servicios', 'detail', id],
    queryFn: () => apiService.getServicioById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para crear servicio
export const useCreateServicio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateServicioData) => apiService.createServicio(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
    },
  });
};

// Hook para actualizar servicio
export const useUpdateServicio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServicioData }) => 
      apiService.updateServicio(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['servicios', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['servicios', 'detail', id] });
    },
  });
};

// Hook para eliminar servicio
export const useDeleteServicio = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteServicio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
    },
  });
};

// Hook para obtener personal asociado a un servicio
export const useServicioPersonal = (id: string) => {
  return useQuery({
    queryKey: ['servicios', 'personal', id],
    queryFn: () => apiService.getServicioPersonal(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener estadísticas de servicios
export const useServiciosStats = () => {
  return useQuery({
    queryKey: ['servicios', 'stats'],
    queryFn: () => apiService.getServiciosStats(),
    staleTime: 5 * 60 * 1000,
  });
};
