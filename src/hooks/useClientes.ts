import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener todos los clientes
export const useClientes = () => {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => apiService.getClientes(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener un cliente específico
export const useCliente = (id: number) => {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => apiService.getClienteById(id.toString()),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener estadísticas de un cliente
export const useClienteEstadisticas = (id: number) => {
  return useQuery({
    queryKey: ['cliente-estadisticas', id],
    queryFn: () => apiService.getClienteEstadisticas(id.toString()),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para crear un nuevo cliente
export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clienteData: { nombre: string; email?: string; telefono?: string; cartera_id: number }) => 
      apiService.createCliente(clienteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
};

// Hook para actualizar un cliente
export const useUpdateCliente = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nombre: string; email?: string; telefono?: string; cartera_id: number } }) => 
      apiService.updateCliente(id.toString(), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cliente-estadisticas', variables.id] });
    },
  });
};

// Hook para eliminar un cliente
export const useDeleteCliente = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteCliente(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
};

