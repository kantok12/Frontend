import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener carteras con filtros
export const useCarteras = (filters?: {
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['carteras', filters],
    queryFn: () => apiService.getCarteras(filters),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obtener cartera por ID
export const useCarteraById = (id: string) => {
  return useQuery({
    queryKey: ['cartera', id],
    queryFn: () => apiService.getCarteraById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

// Hook para obtener clientes por cartera
export const useClientesByCartera = (carteraId: string) => {
  return useQuery({
    queryKey: ['clientes', 'cartera', carteraId],
    queryFn: () => apiService.getClientesByCartera(carteraId),
    enabled: !!carteraId,
    staleTime: 10 * 60 * 1000,
  });
};
