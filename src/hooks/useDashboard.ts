import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DashboardStats } from '../types';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiService.getDashboardStats(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
};
