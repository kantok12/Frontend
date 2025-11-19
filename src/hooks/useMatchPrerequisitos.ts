import { useMutation } from '@tanstack/react-query';
import apiService from '../services/api';

export function useMatchPrerequisitos() {
  return useMutation(async ({ clienteId, ruts, options }: { clienteId: number; ruts: string[]; options?: any }) => {
    // Normalize ruts (trim, remove dots)
    const normalized = (ruts || []).map((r) => (r || '').toString().replace(/\./g, '').trim());
    // Try batch endpoint first; apiService has fallback to per-rut if not available
    const resp = await apiService.matchPrerequisitosClienteBatch(clienteId, normalized, options);
    return resp;
  });
}

export default useMatchPrerequisitos;
