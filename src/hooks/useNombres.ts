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

// Hook para obtener personal por RUT (corregido)
export const usePersonalByRut = (rut: string) => {
  return useQuery({
    queryKey: ['personal', rut],
    queryFn: () => apiService.getPersonalByRut(rut),
    enabled: !!rut,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para buscar personal (corregido)
export const useSearchPersonal = (searchTerm: string) => {
  return useQuery({
    queryKey: ['personal', 'search', searchTerm],
    queryFn: () => apiService.searchPersonal(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para obtener estadísticas de personal (corregido)
export const usePersonalStats = () => {
  return useQuery({
    queryKey: ['personal', 'stats'],
    queryFn: () => apiService.getPersonalStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para crear personal (corregido)
export const useCreatePersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateNombreData) => apiService.createPersonal(data),
    onSuccess: (response, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['personal', variables.rut] });
      queryClient.invalidateQueries({ queryKey: ['personal', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['personal', 'search'] });
    },
  });
};

// Hook para actualizar personal (corregido)
export const useUpdatePersonalData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ rut, data }: { rut: string; data: UpdateNombreData }) => 
      apiService.updatePersonalData(rut, data),
    onSuccess: (response, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['personal', variables.rut] });
      queryClient.invalidateQueries({ queryKey: ['personal', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['personal', 'search'] });
    },
  });
};

// Hook para eliminar personal (corregido)
export const useDeletePersonalData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rut: string) => apiService.deletePersonalData(rut),
    onSuccess: (response, rut) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['personal', rut] });
      queryClient.invalidateQueries({ queryKey: ['personal', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['personal', 'search'] });
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

// Función utilitaria para verificar si existe un RUT (corregido)
export const useCheckRutExists = () => {
  return useMutation({
    mutationFn: async (rut: string): Promise<boolean> => {
      try {
        await apiService.getPersonalByRut(rut);
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

