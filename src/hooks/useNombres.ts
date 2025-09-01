import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Interfaz para la tabla nombres
export interface Nombre {
  rut: string;
  nombre: string;
  sexo?: 'M' | 'F';
  fecha_nacimiento?: string;
  licencia_conducir?: string;
  created_at?: string;
  updated_at?: string;
}

// Interfaz para crear/actualizar nombres
export interface CreateNombreData {
  rut: string;
  nombre: string;
  sexo?: 'M' | 'F';
  fecha_nacimiento?: string;
  licencia_conducir?: string;
}

export interface UpdateNombreData {
  nombre?: string;
  sexo?: 'M' | 'F';
  fecha_nacimiento?: string;
  licencia_conducir?: string;
}

// Hook para obtener nombre por RUT
export const useNombreByRut = (rut: string) => {
  return useQuery({
    queryKey: ['nombre', rut],
    queryFn: () => apiService.getNombreByRut(rut),
    enabled: !!rut,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para buscar nombres
export const useSearchNombres = (searchTerm: string) => {
  return useQuery({
    queryKey: ['nombres', 'search', searchTerm],
    queryFn: () => apiService.searchNombres(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para obtener estadísticas de nombres
export const useNombresStats = () => {
  return useQuery({
    queryKey: ['nombres', 'stats'],
    queryFn: () => apiService.getNombresStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para crear nombre
export const useCreateNombre = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateNombreData) => apiService.createNombre(data),
    onSuccess: (response, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['nombre', variables.rut] });
      queryClient.invalidateQueries({ queryKey: ['nombres', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['nombres', 'search'] });
    },
  });
};

// Hook para actualizar nombre
export const useUpdateNombre = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ rut, data }: { rut: string; data: UpdateNombreData }) => 
      apiService.updateNombre(rut, data),
    onSuccess: (response, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['nombre', variables.rut] });
      queryClient.invalidateQueries({ queryKey: ['nombres', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['nombres', 'search'] });
    },
  });
};

// Hook para eliminar nombre
export const useDeleteNombre = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rut: string) => apiService.deleteNombre(rut),
    onSuccess: (response, rut) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['nombre', rut] });
      queryClient.invalidateQueries({ queryKey: ['nombres', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['nombres', 'search'] });
    },
  });
};

// Función utilitaria para validar datos de nombre
export const validateNombreData = (data: CreateNombreData | UpdateNombreData): string[] => {
  const errors: string[] = [];
  
  if ('rut' in data && (!data.rut || data.rut.trim().length === 0)) {
    errors.push('RUT es requerido');
  }
  
  if ('nombre' in data && (!data.nombre || data.nombre.trim().length === 0)) {
    errors.push('Nombre es requerido');
  }
  
  if (data.sexo && !['M', 'F'].includes(data.sexo)) {
    errors.push('Sexo debe ser M o F');
  }
  
  return errors;
};

// Función utilitaria para verificar si existe un RUT
export const useCheckRutExists = () => {
  return useMutation({
    mutationFn: async (rut: string): Promise<boolean> => {
      try {
        await apiService.getNombreByRut(rut);
        return true;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return false;
        }
        throw error;
      }
    },
  });
};

