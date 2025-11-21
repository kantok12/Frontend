import { useQuery, useMutation } from '@tanstack/react-query';
import apiService from '../services/api';
import { generateRutVariants } from '../utils/rut';

// Query hook: returns cached results for provided clienteId + ruts
export function useMatchPrerequisitosQuery(clienteId: number | null | undefined, ruts: string[] | null | undefined, options?: { enabled?: boolean; staleTime?: number }) {
  const enabled = Boolean(clienteId && Array.isArray(ruts) && ruts.length > 0 && (options?.enabled ?? true));

  // Generate a stable key using clienteId and normalized ruts
  const normalizedKey = ruts && ruts.length ? ruts.map(r => String(r).replace(/\./g, '').trim()).join(',') : '';

  return useQuery([
    'prereq',
    'match',
    clienteId,
    normalizedKey
  ],
  async () => {
    // Expand ruts to include common variants (with/without dots)
    const expanded: string[] = [];
    (ruts || []).forEach(rut => {
      const variants = generateRutVariants(rut);
      variants.forEach(v => expanded.push(v));
    });

    // Deduplicate
    const unique = Array.from(new Set(expanded));

    const resp = await apiService.matchPrerequisitosClienteBatch(Number(clienteId), unique);
    return resp;
  }, {
    enabled,
    staleTime: options?.staleTime ?? 1000 * 60 * 5 // 5 minutes
  });
}

// Mutation hook: perform on-demand match with payload { clienteId, ruts }
export function useMatchPrerequisitos(clienteId?: undefined) {
  return useMutation(async ({ clienteId, ruts, options }: { clienteId: number; ruts: string[]; options?: any }) => {
    // Normalize ruts (trim, remove dots)
    const normalized = (ruts || []).map((r) => (r || '').toString().replace(/\./g, '').trim());
    // Try batch endpoint first; apiService has fallback to per-rut if not available
    const resp = await apiService.matchPrerequisitosClienteBatch(clienteId, normalized, options);
    return resp;
  });
}

export default useMatchPrerequisitos;

