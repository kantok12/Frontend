import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener personal del área de servicio
export const useAreaServicioPersonal = (filters?: {
  cargo?: string;
  zona?: string;
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['area-servicio', 'personal', filters],
    queryFn: () => apiService.getAreaServicioPersonal(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener estadísticas del área de servicio
export const useAreaServicioStats = () => {
  return useQuery({
    queryKey: ['area-servicio', 'stats'],
    queryFn: () => apiService.getAreaServicioStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obtener cargos disponibles
export const useCargosDisponibles = () => {
  return useQuery({
    queryKey: ['area-servicio', 'cargos'],
    queryFn: () => apiService.getCargosDisponibles(),
    staleTime: 30 * 60 * 1000, // 30 minutos (cambia poco)
  });
};

// Hook para obtener zonas geográficas
export const useZonasGeograficas = () => {
  return useQuery({
    queryKey: ['area-servicio', 'zonas'],
    queryFn: () => apiService.getZonasGeograficas(),
    staleTime: 30 * 60 * 1000, // 30 minutos (cambia poco)
  });
};

// Hook para obtener personal por cargo
export const usePersonalByCargo = (cargo: string) => {
  return useQuery({
    queryKey: ['area-servicio', 'cargo', cargo],
    queryFn: () => apiService.getPersonalByCargo(cargo),
    enabled: !!cargo,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener personal por zona
export const usePersonalByZona = (zona: string) => {
  return useQuery({
    queryKey: ['area-servicio', 'zona', zona],
    queryFn: () => apiService.getPersonalByZona(zona),
    enabled: !!zona,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener personal disponible para servicio
export const usePersonalDisponibleServicio = () => {
  return useQuery({
    queryKey: ['area-servicio', 'disponibles'],
    queryFn: () => apiService.getPersonalDisponibleServicio(),
    staleTime: 2 * 60 * 1000, // 2 minutos (cambia frecuentemente)
  });
};
