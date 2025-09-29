import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener todas las carteras
export const useCarteras = () => {
  return useQuery({
    queryKey: ['carteras'],
    queryFn: () => apiService.getCarteras(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener una cartera específica
export const useCartera = (id: number) => {
  return useQuery({
    queryKey: ['cartera', id],
    queryFn: () => apiService.getCarteraById(id.toString()),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener estadísticas de una cartera
export const useCarteraEstadisticas = (id: number) => {
  return useQuery({
    queryKey: ['cartera-estadisticas', id],
    queryFn: () => apiService.getCarteraEstadisticas(id.toString()),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para crear una nueva cartera
export const useCreateCartera = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (carteraData: { nombre: string; descripcion?: string }) => 
      apiService.createCartera(carteraData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carteras'] });
    },
  });
};

// Hook para actualizar una cartera
export const useUpdateCartera = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nombre: string; descripcion?: string } }) => 
      apiService.updateCartera(id.toString(), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['carteras'] });
      queryClient.invalidateQueries({ queryKey: ['cartera', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cartera-estadisticas', variables.id] });
    },
  });
};

// Hook para eliminar una cartera
export const useDeleteCartera = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteCartera(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carteras'] });
    },
  });
};
