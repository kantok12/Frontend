import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// ==================== HOOKS PARA CARTERAS ====================

export const useCarteras = (params?: { limit?: number; offset?: number; search?: string }) => {
  return useQuery({
    queryKey: ['carteras', params],
    queryFn: () => apiService.getCarteras(params),
    select: (data) => data,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

export const useCartera = (id: number) => {
  return useQuery({
    queryKey: ['cartera', id],
    queryFn: () => apiService.getCartera(id),
    select: (data) => data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCartera = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string }) => apiService.createCartera(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carteras'] });
      queryClient.invalidateQueries({ queryKey: ['estructura'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    },
  });
};

// ==================== HOOKS PARA CLIENTES ====================

export const useClientes = (params?: { limit?: number; offset?: number; search?: string; cartera_id?: number }) => {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => apiService.getClientes(params),
    select: (data) => data,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useCliente = (id: number) => {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => apiService.getCliente(id),
    select: (data) => data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { nombre: string; cartera_id: number; region_id?: number }) => 
      apiService.createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['carteras'] });
      queryClient.invalidateQueries({ queryKey: ['estructura'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    },
  });
};

// ==================== HOOKS PARA NODOS ====================

export const useNodos = (params?: { limit?: number; offset?: number; search?: string; cliente_id?: number; cartera_id?: number }) => {
  return useQuery({
    queryKey: ['nodos', params],
    queryFn: () => apiService.getNodos(params),
    select: (data) => data,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useNodo = (id: number) => {
  return useQuery({
    queryKey: ['nodo', id],
    queryFn: () => apiService.getNodo(id),
    select: (data) => data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateNodo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { nombre: string; cliente_id: number }) => 
      apiService.createNodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodos'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['carteras'] });
      queryClient.invalidateQueries({ queryKey: ['estructura'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    },
  });
};

// ==================== HOOKS PARA ESTRUCTURA Y ESTADÍSTICAS ====================

export const useEstructura = (params?: { cartera_id?: number; cliente_id?: number }) => {
  return useQuery({
    queryKey: ['estructura', params],
    queryFn: () => apiService.getEstructura(params),
    select: (data) => data,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useEstadisticasServicios = () => {
  return useQuery({
    queryKey: ['estadisticas-servicios'],
    queryFn: () => apiService.getEstadisticasServicios(),
    select: (data) => data,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

// ==================== HOOKS COMBINADOS ====================

export const useServiciosDashboard = () => {
  const { data: estadisticas, isLoading: estadisticasLoading } = useEstadisticasServicios();
  const { data: estructura, isLoading: estructuraLoading } = useEstructura();
  const { data: carteras, isLoading: carterasLoading } = useCarteras({ limit: 10 });

  return {
    estadisticas: estadisticas?.data,
    estructura: estructura?.data,
    carteras: carteras?.data,
    isLoading: estadisticasLoading || estructuraLoading || carterasLoading,
    error: estadisticas?.success === false || estructura?.success === false || carteras?.success === false
  };
};

// Hook específico para la página de servicios
export const useServiciosPage = (searchTerm: string = '', activeTab: 'carteras' | 'clientes' | 'nodos' = 'carteras') => {
  const { data: estadisticas, isLoading: estadisticasLoading, error: estadisticasError } = useEstadisticasServicios();
  const { data: estructura, isLoading: estructuraLoading, error: estructuraError } = useEstructura();
  const { data: carteras, isLoading: carterasLoading, error: carterasError } = useCarteras({ 
    limit: 100, 
    search: searchTerm || undefined 
  });
  const { data: clientes, isLoading: clientesLoading, error: clientesError } = useClientes({ 
    limit: 100, 
    search: searchTerm || undefined 
  });
  const { data: nodos, isLoading: nodosLoading, error: nodosError } = useNodos({ 
    limit: 100, 
    search: searchTerm || undefined 
  });

  const isLoading = estadisticasLoading || estructuraLoading || carterasLoading || clientesLoading || nodosLoading;
  const hasError = estadisticasError || estructuraError || carterasError || clientesError || nodosError;

  return {
    estadisticas: estadisticas?.data,
    estructura: estructura?.data,
    carteras: carteras?.data || [],
    clientes: clientes?.data || [],
    nodos: nodos?.data || [],
    isLoading,
    error: hasError
  };
};
