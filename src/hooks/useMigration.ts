import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';

// Hook para verificar estado de migración
export const useMigrationStatus = () => {
  return useQuery({
    queryKey: ['migration', 'status'],
    queryFn: () => apiService.getMigrationStatus(),
    staleTime: 30 * 1000, // 30 segundos (cambia frecuentemente durante migración)
    refetchInterval: 5000, // Refetch cada 5 segundos si está en progreso
  });
};

// Hook para ejecutar migración
export const useRunMigration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.runMigration(),
    onSuccess: () => {
      // Invalidar estado de migración
      queryClient.invalidateQueries({ queryKey: ['migration', 'status'] });
    },
  });
};
