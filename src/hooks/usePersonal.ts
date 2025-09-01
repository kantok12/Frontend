import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Personal, CreatePersonalData, UpdatePersonalData, CreatePersonalDisponibleData } from '../types';

// Función para adaptar datos del backend al frontend
const adaptPersonalData = (personalBackend: any): Personal => {
  let nombre = 'Sin nombre';
  let apellido = 'Sin apellido';

  // Prioridad 1: Si el backend ya tiene el campo 'nombre' directamente
  if (personalBackend.nombre) {
    const fullName = personalBackend.nombre.trim();
    const nameParts = fullName.split(' ');
    if (nameParts.length === 1) {
      nombre = nameParts[0];
      apellido = '';
    } else if (nameParts.length === 2) {
      nombre = nameParts[0];
      apellido = nameParts[1];
    } else {
      // Para nombres con más de 2 palabras, asumir que las últimas 2 son apellidos
      nombre = nameParts.slice(0, -1).join(' ');
      apellido = nameParts.slice(-1).join(' ');
    }
  }
  // Prioridad 2: Extraer del comentario_estado si existe y el nombre no está disponible
  else if (personalBackend.comentario_estado?.includes(':')) {
    const fullName = personalBackend.comentario_estado.split(':')[1]?.trim() || '';
    if (fullName) {
      const nameParts = fullName.split(' ');
      if (nameParts.length >= 2) {
        nombre = nameParts.slice(0, -2).join(' ') || nameParts[0];
        apellido = nameParts.slice(-2).join(' ') || nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        nombre = nameParts[0];
        apellido = '';
      }
    }
  }

  return {
    ...personalBackend,
    id: personalBackend.rut,
    nombre,
    apellido,
    activo: personalBackend.estado_nombre === 'Activo',
    email: undefined,
    contacto: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    empresa_id: '1',
    servicio_id: '1',
    empresa: {
      id: '1',
      nombre: personalBackend.zona_geografica
    }
  };
};

// Hook para obtener lista de personal con paginación y filtros
export const usePersonalList = (page = 1, limit = 10, search = '', filters: any = {}) => {
  return useQuery({
    queryKey: ['personal', 'list', page, limit, search, filters],
    queryFn: async () => {
      const response = await apiService.getPersonal(page, limit, search, JSON.stringify(filters));
      // Adaptar la estructura de respuesta del backend al frontend
      return {
        success: response.success,
        data: {
          items: response.data.map(adaptPersonalData),
          total: response.pagination.total,
          page: Math.floor(response.pagination.offset / response.pagination.limit) + 1,
          limit: response.pagination.limit,
          totalPages: Math.ceil(response.pagination.total / response.pagination.limit)
        },
        message: response.message
      };
    },
    staleTime: 30 * 1000, // 30 segundos para que se refresque más rápido durante búsquedas
    keepPreviousData: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refrescar automáticamente cuando cambie el término de búsqueda
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

// Hook para obtener personal por ID
export const usePersonalById = (id: string) => {
  return useQuery({
    queryKey: ['personal', 'detail', id],
    queryFn: () => apiService.getPersonalById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para crear personal (usando personal-disponible)
export const useCreatePersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePersonalDisponibleData) => apiService.createPersonalDisponible(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal'] });
    },
  });
};

// Hook para actualizar personal
export const useUpdatePersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonalData }) => 
      apiService.updatePersonal(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['personal', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['personal', 'detail', id] });
    },
  });
};

// Hook para eliminar personal
export const useDeletePersonal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deletePersonal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal'] });
    },
  });
};

// Hook para obtener/actualizar disponibilidad
export const usePersonalAvailability = (id: string) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['personal', 'availability', id],
    queryFn: () => apiService.getPersonalDisponibilidad(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (disponibilidad: any) => apiService.updatePersonalDisponibilidad(id, disponibilidad),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal', 'availability', id] });
    },
  });

  return {
    ...query,
    updateAvailability: updateMutation.mutate,
    isUpdating: updateMutation.isLoading,
  };
};
