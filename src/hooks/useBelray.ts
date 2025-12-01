import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';

// Hook para listar todas las empresas Belray
export const useBelrayList = () => {
  const page = 1;
  const limit = 100;
  return useQuery({
    queryKey: ['belray', { page, limit }],
    queryFn: async () => {
      const response = await apiService.getBelray({ page, limit });
      // Debug: log raw response to help identify backend payload shape
      // eslint-disable-next-line no-console
      console.debug('useBelrayList - raw getBelray response:', response);

      // Normalizar distintas formas de respuesta que el backend puede devolver:
      // - ApiResponse.data es un array directo -> return that array
      // - ApiResponse.data puede ser un objeto paginado { data: [items], pagination: ... }
      // - En algunos backends la respuesta puede venir como { items: [...] }
      // Manejar todos los casos y devolver siempre un array de empresas.
      try {
        const respAny: any = response;

        // Caso 1: respuesta directa es un array (inusual pero posible)
        if (Array.isArray(respAny)) return respAny;

        // Caso 2: ApiResponse: { success, data: [...] }
        if (respAny && Array.isArray(respAny.data)) return respAny.data;

        // Caso 3: ApiResponse: { success, data: { data: [...], pagination: {...} } }
        if (respAny && respAny.data && Array.isArray(respAny.data.data)) return respAny.data.data;

        // Caso 3b: ApiResponse: { success, data: { registros: [...] } } (forma usada por el backend actual)
        if (respAny && respAny.data && Array.isArray(respAny.data.registros)) return respAny.data.registros;

        // Caso 4: ApiResponse: { success, data: { items: [...] } }
        if (respAny && respAny.data && Array.isArray(respAny.data.items)) return respAny.data.items;

        // Caso por defecto: intentar devolver respAny.data si es array, sino un array vacío
        const finalArray = Array.isArray(respAny.data) ? respAny.data : [];
        // eslint-disable-next-line no-console
        console.debug('useBelrayList - normalized empresas length:', finalArray.length);
        return finalArray;
      } catch (e) {
        // Si ocurre un error de parseo, devolver array vacío para evitar romper la UI
        // eslint-disable-next-line no-console
        console.warn("useBelrayList - couldn't normalize response", e, response);
        return [];
      }
    },
  });
};

// Hook para obtener una empresa Belray por ID
export const useBelrayById = (id: number | null) => {
  return useQuery({
    queryKey: ['belray', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiService.getBelrayById(id);
      return response.data || null;
    },
    enabled: !!id,
  });
};

// Hook para crear una empresa Belray
export const useCreateBelray = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiService.crearBelray(data),
    onSuccess: () => {
      // Invalidate and then refetch immediately to ensure UI updates reliably
      queryClient.invalidateQueries({ queryKey: ['belray'] });
      // refetchQueries returns a promise; we don't need to await here but trigger it
      try {
        // Call refetchQueries with queryKey argument to match overloads and TypeScript types
        // This triggers an immediate refetch of queries matching ['belray']
        queryClient.refetchQueries(['belray']);
      } catch (e) {
        // swallow any unexpected errors from refetch to avoid breaking the mutation flow
        // eslint-disable-next-line no-console
        console.warn('useCreateBelray - refetchQueries failed:', e);
      }
    },
  });
};

// Hook para actualizar una empresa Belray
export const useUpdateBelray = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiService.updateBelray(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['belray'] });
      queryClient.invalidateQueries({ queryKey: ['belray', variables.id] });
    },
  });
};

// Hook para eliminar una empresa Belray
export const useDeleteBelray = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deleteBelray(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['belray'] });
    },
  });
};

// Hook para listar documentos de una empresa Belray
export const useBelrayDocuments = (id: number | null) => {
  return useQuery({
    queryKey: ['belray-documents', id],
    queryFn: async () => {
      if (!id) return [];
      const response = await apiService.getBelrayDocuments(id);
      return response.data || [];
    },
    enabled: !!id,
  });
};

// Hook para subir un documento a una empresa Belray
export const useUploadBelrayDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      apiService.uploadBelrayDocument(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['belray-documents', variables.id] });
    },
  });
};

// Hook para eliminar un documento de una empresa Belray
export const useDeleteBelrayDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, filename }: { id: number; filename: string }) =>
      apiService.deleteBelrayDocument(id, filename),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['belray-documents', variables.id] });
    },
  });
};
