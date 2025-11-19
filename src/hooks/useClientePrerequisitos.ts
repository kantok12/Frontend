import { useQuery } from '@tanstack/react-query';
import apiService from '../services/api';

export function useClientePrerequisitos(clienteId?: number) {
  return useQuery(['prereq', clienteId], async () => {
    if (!clienteId) return { success: false, data: [] };
    const resp = await apiService.getClientePrerequisitos(clienteId);
    return resp;
  }, {
    enabled: !!clienteId,
    staleTime: 5 * 60 * 1000
  });
}

export default useClientePrerequisitos;
