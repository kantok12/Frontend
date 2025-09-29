import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Hook para obtener lista de backups
export const useBackups = () => {
  return useQuery({
    queryKey: ['backups'],
    queryFn: () => apiService.getBackups(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para obtener información del sistema de backups
export const useBackupInfo = () => {
  return useQuery({
    queryKey: ['backup', 'info'],
    queryFn: () => apiService.getBackupInfo(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para crear backup
export const useCreateBackup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.createBackup(),
    onSuccess: () => {
      // Invalidar lista de backups
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup', 'info'] });
    },
  });
};

// Hook para descargar backup
export const useDownloadBackup = () => {
  return useMutation({
    mutationFn: (filename: string) => apiService.downloadBackup(filename),
  });
};

// Hook para eliminar backup
export const useDeleteBackup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (filename: string) => apiService.deleteBackup(filename),
    onSuccess: () => {
      // Invalidar lista de backups
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup', 'info'] });
    },
  });
};
