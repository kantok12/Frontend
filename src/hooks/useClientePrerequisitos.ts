import { useQuery } from '@tanstack/react-query';
import apiService from '../services/api';

// Hook robusto para obtener prerrequisitos de un cliente.
// Algunos backends exponen la ruta `/prerequisitos/clientes/:id` y otros `/prerrequisitos/cliente/:id`.
// Intentamos la primera y si devuelve 404 hacemos fallback a la segunda.
export function useClientePrerequisitos(clienteId?: number) {
  return useQuery(['prereq', clienteId], async () => {
    if (!clienteId) return { success: false, data: [] };

    try {
      // Intento principal (ruta antigua en el cliente)
      const resp = await apiService.getClientePrerequisitos(clienteId);
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV !== 'production') console.debug('useClientePrerequisitos: used getClientePrerequisitos', clienteId, resp);
      return resp;
    } catch (err: any) {
      // Si la respuesta es 404, intentar la ruta alternativa
      const status = err?.response?.status;
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV !== 'production') console.debug('useClientePrerequisitos: primary endpoint failed', clienteId, status);
      if (status === 404) {
        try {
          const alt = await apiService.getPrerrequisitosByCliente(clienteId);
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV !== 'production') console.debug('useClientePrerequisitos: used getPrerrequisitosByCliente fallback', clienteId, alt);
          return alt;
        } catch (err2: any) {
          // eslint-disable-next-line no-console
          console.error('useClientePrerequisitos: both endpoints failed for clienteId=', clienteId, err2);
          throw err2;
        }
      }
      // Propagar otros errores
      throw err;
    }
  }, {
    enabled: !!clienteId,
    staleTime: 5 * 60 * 1000
  });
}

export default useClientePrerequisitos;
