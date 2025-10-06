import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Interfaz para los estados
export interface Estado {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

// Hook para obtener todos los estados
export const useEstados = (params?: { limit?: number; offset?: number; search?: string }) => {
  return useQuery({
    queryKey: ['estados', params?.limit || 20, params?.offset || 0, params?.search || ''],
    queryFn: () => apiService.getEstados(params),
    staleTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
  });
};

// Función utilitaria para obtener el nombre del estado por ID
export const getEstadoNombre = (estados: Estado[], estadoId: number): string => {
  const estado = estados.find(e => e.id === estadoId);
  return estado?.nombre || 'Desconocido';
};

// Función utilitaria para verificar si un estado es activo
export const isEstadoActivo = (estados: Estado[], estadoId: number): boolean => {
  const estado = estados.find(e => e.id === estadoId);
  return estado?.nombre === 'Activo';
};

