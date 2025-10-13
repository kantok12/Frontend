import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { ApiResponse } from '../types';

// Resumen: carteras, personal por cartera y asignaciones por RUT (solo lectura)
export const useAsignacionesResumen = (params?: { carteraId?: number; rut?: string }) => {
  const { carteraId, rut } = params || {};

  // Carteras disponibles
  const carterasQuery = useQuery({
    queryKey: ['asignaciones', 'carteras'],
    queryFn: () => apiService.getCarteras(),
  });

  // Personal asignado a una cartera específica
  const personalPorCarteraQuery = useQuery({
    queryKey: ['asignaciones', 'cartera', carteraId],
    queryFn: async () => {
      if (!carteraId || carteraId <= 0) return { success: true, data: [] } as any;
      return apiService.getPersonalByCartera(carteraId);
    },
    enabled: !!carteraId && carteraId > 0,
  });

  // Asignaciones de una persona por RUT
  const asignacionesPorRutQuery = useQuery({
    queryKey: ['asignaciones', 'persona', rut],
    queryFn: async () => {
      if (!rut) return { success: true, data: null } as any;
      return apiService.getAsignacionesByRut(rut);
    },
    enabled: !!rut,
  });

  return {
    carteras: carterasQuery.data?.data || [],
    isLoadingCarteras: carterasQuery.isLoading,
    personalAsignadoCartera: personalPorCarteraQuery.data?.data || [],
    isLoadingPersonalAsignado: personalPorCarteraQuery.isLoading,
    asignacionesPersona: asignacionesPorRutQuery.data?.data || null,
    isLoadingAsignacionesPersona: asignacionesPorRutQuery.isLoading,
    refetchCarteras: carterasQuery.refetch,
    refetchPersonalAsignado: personalPorCarteraQuery.refetch,
    refetchAsignacionesPersona: asignacionesPorRutQuery.refetch,
  };
};
 
export interface AsignacionesPersonaResponse {
  success: boolean;
  data: {
    carteras: { id: number; nombre?: string }[];
    clientes: { id: number; nombre?: string }[];
    nodos: { id: number; nombre?: string }[];
  };
  message?: string;
}

// Detalle y mutaciones para una persona por RUT
export const useAsignaciones = (rut: string) => {
  const queryClient = useQueryClient();

  const asignacionesQuery = useQuery<AsignacionesPersonaResponse>({
    queryKey: ['asignaciones', rut],
    queryFn: async () => {
      const res = await apiService.getAsignacionesByRut(rut);
      return res as unknown as AsignacionesPersonaResponse;
    },
    enabled: !!rut,
    staleTime: 60 * 1000,
  });

  const mutateAndRefetch = async (fn: () => Promise<ApiResponse<any>>) => {
    const res = await fn();
    await queryClient.invalidateQueries({ queryKey: ['asignaciones', rut] });
    return res;
  };

  const assignCartera = useMutation({
    mutationFn: (carteraId: number) => mutateAndRefetch(() => apiService.assignCarteraToPersona(rut, carteraId))
  });

  const unassignCartera = useMutation({
    mutationFn: (carteraId: number) => mutateAndRefetch(() => apiService.unassignCarteraFromPersona(rut, carteraId))
  });

  const assignCliente = useMutation({
    mutationFn: (clienteId: number) => mutateAndRefetch(() => apiService.assignClienteToPersona(rut, clienteId))
  });

  const unassignCliente = useMutation({
    mutationFn: (clienteId: number) => mutateAndRefetch(() => apiService.unassignClienteFromPersona(rut, clienteId))
  });

  const assignNodo = useMutation({
    mutationFn: (nodoId: number) => mutateAndRefetch(() => apiService.assignNodoToPersona(rut, nodoId))
  });

  const unassignNodo = useMutation({
    mutationFn: (nodoId: number) => mutateAndRefetch(() => apiService.unassignNodoFromPersona(rut, nodoId))
  });

  return {
    asignaciones: asignacionesQuery.data?.data,
    isLoading: asignacionesQuery.isLoading,
    error: asignacionesQuery.error,
    refetch: asignacionesQuery.refetch,
    assignCartera,
    unassignCartera,
    assignCliente,
    unassignCliente,
    assignNodo,
    unassignNodo,
  };
};


