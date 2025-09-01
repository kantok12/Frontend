import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DashboardStats } from '../types';

// Datos mock como fallback
const mockDashboardStats: DashboardStats = {
  total_personal: 45,
  total_empresas: 12,
  total_servicios: 8,
  personal_activo: 38,
  servicios_activos: 6,
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      try {
        // Intentar obtener datos reales de la API
        const response = await apiService.getDashboardStats();
        return response.data;
      } catch (error) {
        console.warn('No se pudieron obtener datos reales del dashboard, usando datos mock:', error);
        // Si falla, usar datos mock
        return mockDashboardStats;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
};
