import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { ApiResponse } from '../types';

// Tipos para los prerrequisitos
export interface Prerrequisito {
  id: number;
  cliente_id: number | null; // Puede ser nulo para prerrequisitos globales
  tipo_documento: string;
  descripcion: string;
  dias_duracion: number | null;
  es_global: boolean; // Nuevo campo para identificar prerrequisitos globales
  created_at?: string;
  updated_at?: string;
}

export interface CreatePrerrequisitoData {
  cliente_id?: number | null; // Opcional para crear prerrequisitos globales
  tipo_documento: string;
  descripcion?: string;
  dias_duracion?: number | null;
}

export interface UpdatePrerrequisitoData {
  tipo_documento?: string;
  descripcion?: string;
  dias_duracion?: number | null;
}

// Hook para obtener los prerrequisitos de un cliente
export const usePrerrequisitosByCliente = (clienteId: number | null, options: { enabled?: boolean } = {}) => {
  return useQuery<Prerrequisito[], Error>({
    queryKey: ['prerrequisitos', clienteId],
    queryFn: async () => {
      if (clienteId === null) return []; // No fetch si no hay clienteId
      const response = await apiService.getPrerrequisitosByCliente(clienteId);
      return response.data;
    },
    enabled: options.enabled ?? (clienteId !== null), // Habilitado por defecto si clienteId no es null
  });
};

// Hook para obtener todos los prerrequisitos globales
export const useAllPrerrequisitos = (options: { enabled?: boolean } = {}) => {
  return useQuery<Prerrequisito[], Error>({
    queryKey: ['prerrequisitos', 'all'],
    queryFn: async () => {
      const response = await apiService.getGlobalPrerrequisitos();
      if (response.success) {
        return response.data;
      }
      throw new Error('No se pudieron obtener los prerrequisitos globales');
    },
    enabled: options.enabled ?? true,
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook para crear un nuevo prerrequisito
export const useCreatePrerrequisito = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Prerrequisito>, Error, CreatePrerrequisitoData>({
    mutationFn: (data: CreatePrerrequisitoData) => apiService.crearPrerrequisito(data),
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        const newPrerrequisito = response.data;

        // Invalidar queries para asegurar que los datos se recarguen en segundo plano
        queryClient.invalidateQueries({ queryKey: ['prerrequisitos', 'all'] });
        if (variables.cliente_id) {
          queryClient.invalidateQueries({ queryKey: ['prerrequisitos', variables.cliente_id] });
        } else {
          // Si es un prerrequisito global, actualizar la caché 'all' manualmente
          queryClient.setQueryData<Prerrequisito[]>(['prerrequisitos', 'all'], (oldData) => {
            return oldData ? [...oldData, newPrerrequisito] : [newPrerrequisito];
          });
        }
      }
    },
  });
};

// Hook para actualizar un prerrequisito
export const useUpdatePrerrequisito = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Prerrequisito>, Error, { id: number; data: UpdatePrerrequisitoData; cliente_id: number | null }>({
    mutationFn: ({ id, data }) =>
      apiService.actualizarPrerrequisito(id, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['prerrequisitos', 'all'] });
        if (variables.cliente_id) {
          queryClient.invalidateQueries({ queryKey: ['prerrequisitos', variables.cliente_id] });
        }
      }
    },
  });
};

// Hook para eliminar un prerrequisito
export const useDeletePrerrequisito = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Prerrequisito>, Error, { id: number; cliente_id: number | null }>({
    mutationFn: ({ id }) => apiService.eliminarPrerrequisito(id),
    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['prerrequisitos', 'all'] });
        if (variables.cliente_id) {
          queryClient.invalidateQueries({ queryKey: ['prerrequisitos', variables.cliente_id] });
        }
      }
    },
  });
};
