import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener todos los nodos
export const useNodos = () => {
  return useQuery({
    queryKey: ['nodos'],
    queryFn: () => apiService.getNodos(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener un nodo específico
export const useNodo = (id: number) => {
  return useQuery({
    queryKey: ['nodo', id],
    queryFn: () => apiService.getNodoById(id.toString()),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener nodos por cliente
export const useNodosByCliente = (clienteId: number) => {
  return useQuery({
    queryKey: ['nodos-cliente', clienteId],
    queryFn: () => apiService.getNodosByCliente(clienteId.toString()),
    enabled: !!clienteId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener estadísticas de nodos
export const useNodosEstadisticas = () => {
  return useQuery({
    queryKey: ['nodos-estadisticas'],
    queryFn: () => apiService.getNodosEstadisticas(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para crear un nuevo nodo
export const useCreateNodo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (nodoData: { nombre: string; descripcion?: string; cliente_id: number; ubicacion?: string; estado: 'activo' | 'inactivo' | 'mantenimiento' }) => 
      apiService.createNodo(nodoData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodos'] });
      queryClient.invalidateQueries({ queryKey: ['nodos-cliente', variables.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['nodos-estadisticas'] });
    },
  });
};

// Hook para actualizar un nodo
export const useUpdateNodo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nombre: string; descripcion?: string; cliente_id: number; ubicacion?: string; estado: 'activo' | 'inactivo' | 'mantenimiento' } }) => 
      apiService.updateNodo(id.toString(), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodos'] });
      queryClient.invalidateQueries({ queryKey: ['nodo', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['nodos-cliente', variables.data.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['nodos-estadisticas'] });
    },
  });
};

// Hook para eliminar un nodo
export const useDeleteNodo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteNodo(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodos'] });
      queryClient.invalidateQueries({ queryKey: ['nodos-estadisticas'] });
    },
  });
};

