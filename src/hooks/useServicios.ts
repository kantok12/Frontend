import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useMinimoPersonal } from './useMinimoPersonal';

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
    queryFn: async () => {
      console.log('🔍 useClientes: Obteniendo clientes con params:', params);
      try {
        const result = await apiService.getClientes(params);
        console.log('✅ useClientes: Datos obtenidos:', result);
        return result;
      } catch (error) {
        console.error('❌ useClientes: Error obteniendo clientes:', error);
        throw error;
      }
    },
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
    queryFn: async () => {
      console.log('🔍 useNodos: Obteniendo nodos con params:', params);
      try {
        const result = await apiService.getNodos(params);
        console.log('✅ useNodos: Datos obtenidos:', result);
        return result;
      } catch (error) {
        console.error('❌ useNodos: Error obteniendo nodos:', error);
        throw error;
      }
    },
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
  const { data: minimoPersonal, isLoading: minimoPersonalLoading, error: minimoPersonalError } = useMinimoPersonal({ 
    limit: 1000 
  });

  const isLoading = estadisticasLoading || estructuraLoading || carterasLoading || clientesLoading || nodosLoading || minimoPersonalLoading;
  const hasError = estadisticasError || estructuraError || carterasError || clientesError || nodosError || minimoPersonalError;

  // Enriquecer datos de clientes con nombres de carteras y mínimo personal
  const clientesEnriquecidos = React.useMemo(() => {
    if (!clientes?.data || !carteras?.data || !minimoPersonal?.data) {
      return clientes?.data || [];
    }

    return clientes.data.map((cliente: any) => {
      // Buscar el nombre de la cartera
      const cartera = carteras.data.find((c: any) => c.id === cliente.cartera_id);
      const carteraNombre = cartera?.nombre || `Cartera ID: ${cliente.cartera_id}`;

      // Buscar el mínimo personal para este cliente
      const minimoCliente = minimoPersonal.data.find((mp: any) => 
        mp.cliente_id === cliente.id && mp.activo
      );
      const minimoPersonalCliente = minimoCliente?.minimo_personal || 0;

      return {
        ...cliente,
        cartera_nombre: carteraNombre,
        minimo_personal: minimoPersonalCliente
      };
    });
  }, [clientes?.data, carteras?.data, minimoPersonal?.data]);

  // Enriquecer datos de nodos con nombres de clientes y carteras
  const nodosEnriquecidos = React.useMemo(() => {
    if (!nodos?.data || !clientes?.data || !carteras?.data) {
      return nodos?.data || [];
    }

    return nodos.data.map((nodo: any) => {
      // Buscar el nombre del cliente
      const cliente = clientes.data.find((c: any) => c.id === nodo.cliente_id);
      const clienteNombre = cliente?.nombre || `Cliente ID: ${nodo.cliente_id}`;

      // Buscar el nombre de la cartera (puede venir del nodo o del cliente)
      let carteraNombre = '';
      if (nodo.cartera_id) {
        const cartera = carteras.data.find((c: any) => c.id === nodo.cartera_id);
        carteraNombre = cartera?.nombre || `Cartera ID: ${nodo.cartera_id}`;
      } else if (cliente?.cartera_id) {
        const cartera = carteras.data.find((c: any) => c.id === cliente.cartera_id);
        carteraNombre = cartera?.nombre || `Cartera ID: ${cliente.cartera_id}`;
      } else {
        carteraNombre = 'Sin cartera';
      }

      return {
        ...nodo,
        cliente_nombre: clienteNombre,
        cartera_nombre: carteraNombre
      };
    });
  }, [nodos?.data, clientes?.data, carteras?.data]);

  return {
    estadisticas: estadisticas?.data,
    estructura: estructura?.data,
    carteras: carteras?.data || [],
    clientes: clientesEnriquecidos,
    nodos: nodosEnriquecidos,
    minimoPersonal: minimoPersonal?.data || [],
    isLoading,
    error: hasError
  };
};

// ==================== RE-EXPORTAR HOOKS DE NUEVOS ENDPOINTS ====================

// Re-exportar hooks de mínimo personal
export {
  useMinimoPersonal,
  useMinimoPersonalById,
  useCreateMinimoPersonal,
  useUpdateMinimoPersonal,
  useDeleteMinimoPersonal,
  useCalcularMinimoPersonal,
  useRecalcularMinimoPersonal,
  useMinimoPersonalDashboard
} from './useMinimoPersonal';

// Re-exportar hooks de acuerdos
export {
  useAcuerdos,
  useAcuerdoById,
  useCreateAcuerdo,
  useUpdateAcuerdo,
  useDeleteAcuerdo,
  useAcuerdosVencer,
  useActivarAcuerdo,
  useDesactivarAcuerdo,
  useAcuerdosDashboard,
  useAcuerdosStats
} from './useAcuerdos';