import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DocumentoUpload } from '../types';

// Hook para obtener todos los documentos con paginación
export const useDocumentos = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['documentos', page, limit],
    queryFn: () => apiService.getDocumentos(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener un documento específico
export const useDocumento = (id: number) => {
  return useQuery({
    queryKey: ['documento', id],
    queryFn: () => apiService.getDocumentoById(id.toString()),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener documentos por persona
export const useDocumentosByPersona = (rut: string) => {
  return useQuery({
    queryKey: ['documentos-persona', rut],
    queryFn: () => apiService.getDocumentosByPersona(rut),
    enabled: !!rut,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDocumentosByCurso = (nombreCurso: string) => {
  return useQuery({
    queryKey: ['documentos-curso', nombreCurso],
    queryFn: () => apiService.getDocumentosByCurso(nombreCurso),
    enabled: !!nombreCurso,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para obtener tipos de documentos
export const useTiposDocumentos = () => {
  return useQuery({
    queryKey: ['tipos-documentos'],
    queryFn: () => apiService.getTiposDocumentos(),
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos ya que no cambian frecuentemente
  });
};

// Hook para obtener formatos de documentos
export const useFormatosDocumentos = () => {
  return useQuery({
    queryKey: ['formatos-documentos'],
    queryFn: () => apiService.getFormatosDocumentos(),
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos ya que no cambian frecuentemente
  });
};

// Hook para subir documento
export const useUploadDocumento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentoUpload) => apiService.uploadDocumento(data),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-persona', variables.rut_persona] });
    },
  });
};

// Hook para eliminar documento
export const useDeleteDocumento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deleteDocumento(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-persona'] });
    }
  });
};

// Hook para descargar documento
export const useDownloadDocumento = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const blob = await apiService.downloadDocumento(id.toString());
      
      // Crear URL temporal y descargar automáticamente
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento_${id}.pdf`; // Nombre por defecto
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return blob;
    },
  });
};
