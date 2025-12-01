import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';

// Hook para listar todas las empresas Belray
export const useBelrayList = () => {
  return useQuery({
    queryKey: ['belray'],
    queryFn: async () => {
      const response = await apiService.getBelray();
      return response.data || [];
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
      queryClient.invalidateQueries({ queryKey: ['belray'] });
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
