import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { ApiResponse } from '../types';

export interface AsignacionesPersonaResponse {
  success: boolean;
  data: {
    carteras: { id: number; nombre?: string }[];
    clientes: { id: number; nombre?: string }[];
    nodos: { id: number; nombre?: string }[];
  };
  message?: string;
}

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


