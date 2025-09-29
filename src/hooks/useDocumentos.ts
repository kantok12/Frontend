import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener documentos con filtros
export const useDocumentos = (filters?: {
  rut_persona?: string;
  tipo_documento?: string;
  nombre_documento?: string;
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['documentos', filters],
    queryFn: () => apiService.getDocumentos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener documento por ID
export const useDocumentoById = (id: string) => {
  return useQuery({
    queryKey: ['documento', id],
    queryFn: () => apiService.getDocumentoById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener documentos por persona
export const useDocumentosByPersona = (rut: string) => {
  return useQuery({
    queryKey: ['documentos', 'persona', rut],
    queryFn: () => apiService.getDocumentosByPersona(rut),
    enabled: !!rut,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener tipos de documentos
export const useTiposDocumentos = () => {
  return useQuery({
    queryKey: ['tipos-documentos'],
    queryFn: () => apiService.getTiposDocumentos(),
    staleTime: 30 * 60 * 1000, // 30 minutos (cambia poco)
  });
};

// Hook para subir documentos
export const useUploadDocumentos = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (documentosData: FormData) => apiService.uploadDocumentos(documentosData),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos', 'persona'] });
    },
  });
};

// Hook para eliminar documento
export const useDeleteDocumento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteDocumento(id),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos', 'persona'] });
    },
  });
};

// Hook para descargar documento
export const useDownloadDocumento = () => {
  return useMutation({
    mutationFn: (id: string) => apiService.downloadDocumento(id),
  });
};
