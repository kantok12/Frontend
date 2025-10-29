import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener dashboard de actividad de auditoría
export const useAuditoriaDashboard = (params?: {
  limit?: number;
  es_critico?: boolean;
}) => {
  return useQuery({
    queryKey: ['auditoria', 'dashboard', params],
    queryFn: () => apiService.getAuditoriaDashboard(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2,
  });
};

// Hook para obtener historial de un registro específico
export const useAuditoriaHistorial = (tabla: string, id: string | number) => {
  return useQuery({
    queryKey: ['auditoria', 'historial', tabla, id],
    queryFn: () => apiService.getAuditoriaHistorial(tabla, id),
    enabled: !!tabla && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook para obtener estadísticas de auditoría
export const useAuditoriaEstadisticas = (periodo?: number) => {
  return useQuery({
    queryKey: ['auditoria', 'estadisticas', periodo],
    queryFn: () => apiService.getAuditoriaEstadisticas({ periodo }),
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });
};

// Hook para obtener notificaciones de auditoría
export const useAuditoriaNotificaciones = (leida?: boolean) => {
  return useQuery({
    queryKey: ['auditoria', 'notificaciones', leida],
    queryFn: () => apiService.getAuditoriaNotificaciones({ leida }),
    staleTime: 1 * 60 * 1000, // 1 minuto (más frecuente)
    retry: 2,
  });
};
