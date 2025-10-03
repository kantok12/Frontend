import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Curso, CreateCursoData, UpdateCursoData, CursosResponse } from '../types';

// Hook para obtener todos los cursos con filtros
export const useCursos = (filters?: { rut?: string; curso?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['cursos', filters],
    queryFn: () => apiService.getCursos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook para obtener cursos de una persona específica (según documentación de la API)
export const useCursosByRut = (rut: string) => {
  return useQuery<CursosResponse>({
    queryKey: ['cursos', 'persona', rut],
    queryFn: async (): Promise<CursosResponse> => {
      // eslint-disable-next-line no-console
      console.log('🔍 Solicitando cursos para RUT:', rut);
      try {
        const result = await apiService.getCursosByRut(rut);
        // eslint-disable-next-line no-console
        console.log('📚 Cursos recibidos para RUT', rut, ':', result);
        
        // Verificar la estructura de respuesta según la documentación
        if (result?.success && result?.data) {
          // La respuesta debe tener la estructura: { success: true, data: { persona: {...}, cursos: [...] } }
          if (typeof result.data === 'object' && !Array.isArray(result.data) && 'persona' in result.data && 'cursos' in result.data) {
            // Si tiene la estructura correcta, convertir a CursosResponse
            return {
              success: result.success,
              data: {
                persona: (result.data as any).persona,
                cursos: (result.data as any).cursos
              },
              message: result.message
            } as CursosResponse;
          } else if (Array.isArray(result.data)) {
            // Si viene como array directo, adaptar a la estructura esperada
            return {
              success: true,
              data: {
                persona: null,
                cursos: result.data
              }
            };
          }
        }
        
        // Si no tiene la estructura esperada, devolver datos vacíos
        return {
          success: true,
          data: {
            persona: null,
            cursos: []
          },
          message: 'Estructura de datos no reconocida'
        };
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.warn('⚠️ Error al obtener cursos para RUT', rut, ':', error);
        
        // Manejar diferentes tipos de errores según la documentación
        if (error.response?.status === 404) {
          return {
            success: true,
            data: {
              persona: null,
              cursos: []
            },
            message: 'No se encontraron cursos para este RUT'
          };
        } else if (error.response?.status === 500) {
          return {
            success: true,
            data: {
              persona: null,
              cursos: []
            },
            message: 'Error interno del servidor'
          };
        }
        
        // Devolver datos vacíos en caso de error para no romper la UI
        return {
          success: true,
          data: {
            persona: null,
            cursos: []
          },
          message: 'No se pudieron obtener los cursos'
        };
      }
    },
    enabled: !!rut,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1, // Solo reintentar una vez
    onError: (error: any) => {
      if (error.response?.status !== 404 && error.response?.status !== 500) {
        console.error('❌ Error al obtener cursos para RUT', rut, ':', error);
      }
    }
  });
};

// Hook para obtener cursos vencidos
export const useCursosVencidos = () => {
  return useQuery({
    queryKey: ['cursos', 'vencidos'],
    queryFn: () => apiService.getCursosVencidos(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

// Hook para obtener alertas de cursos
export const useCursosAlertas = () => {
  return useQuery({
    queryKey: ['cursos', 'alertas'],
    queryFn: () => apiService.getCursosAlertas(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

// Hook para obtener cursos por vencer
export const useCursosPorVencer = () => {
  return useQuery({
    queryKey: ['cursos', 'por-vencer'],
    queryFn: () => apiService.getCursosPorVencer(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

// Hook para obtener estadísticas de vencimiento
export const useCursosEstadisticasVencimiento = () => {
  return useQuery({
    queryKey: ['cursos', 'estadisticas-vencimiento'],
    queryFn: () => apiService.getCursosEstadisticasVencimiento(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });
};

// Hook para obtener curso específico por ID
export const useCursoById = (id: number) => {
  return useQuery({
    queryKey: ['curso', id],
    queryFn: () => apiService.getCursoById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};


// Hook para crear curso (según documentación de la API)
export const useCreateCurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCursoData) => {
      // Validar datos requeridos según la documentación
      if (!data.rut_persona || !data.nombre_curso) {
        throw new Error('RUT de la persona y nombre del curso son requeridos');
      }
      
      // Asegurar que el estado tenga un valor por defecto
      const cursoData = {
        ...data,
        estado: data.estado || 'completado' // Valor por defecto según documentación
      };
      
      return apiService.createCurso(cursoData);
    },
    onSuccess: (response, variables) => {
      // eslint-disable-next-line no-console
      console.log('✅ Curso creado exitosamente, invalidando queries para RUT:', variables.rut_persona);
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['cursos', 'persona', variables.rut_persona] });
      queryClient.invalidateQueries({ queryKey: ['cursos', 'stats'] });
      // eslint-disable-next-line no-console
      console.log('🔄 Queries invalidadas para refrescar datos');
    },
    onError: (error: any) => {
      console.error('❌ Error al crear curso:', error);
      
      // Manejar errores específicos según la documentación
      if (error.response?.status === 400) {
        throw new Error('Datos inválidos. Verifique que todos los campos estén correctamente completados.');
      } else if (error.response?.status === 409) {
        throw new Error('Ya existe un curso con estos datos.');
      } else if (error.response?.status === 500) {
        throw new Error('Error interno del servidor. Por favor, intente nuevamente más tarde.');
      }
    }
  });
};

// Hook para actualizar curso
export const useUpdateCurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCursoData }) => 
      apiService.updateCurso(id, data),
    onSuccess: (response, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cursos', 'stats'] });
      
      // También invalidar cursos por persona si sabemos el RUT
      if (response.data?.rut_persona) {
        queryClient.invalidateQueries({ queryKey: ['cursos', 'persona', response.data.rut_persona] });
      }
    },
  });
};

// Hook para eliminar curso
export const useDeleteCurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteCurso(id),
    onSuccess: (response, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', id] });
      queryClient.invalidateQueries({ queryKey: ['cursos', 'stats'] });
      
      // También invalidar cursos por persona si sabemos el RUT
      if (response.data?.rut_persona) {
        queryClient.invalidateQueries({ queryKey: ['cursos', 'persona', response.data.rut_persona] });
      }
    },
  });
};

// Función utilitaria para formatear fecha de obtención
export const formatFechaCurso = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Función utilitaria para validar datos de curso
export const validateCursoData = (data: CreateCursoData | UpdateCursoData): string[] => {
  const errors: string[] = [];
  
  if ('rut_persona' in data && (!data.rut_persona || data.rut_persona.trim().length === 0)) {
    errors.push('RUT de la persona es requerido');
  }
  
  if ('nombre_curso' in data && (!data.nombre_curso || data.nombre_curso.trim().length === 0)) {
    errors.push('Nombre del curso es requerido');
  }
  
  if ('fecha_obtencion' in data && (!data.fecha_obtencion || data.fecha_obtencion.trim().length === 0)) {
    errors.push('Fecha de obtención es requerida');
  }
  
  // Validar que la fecha no sea futura
  if ('fecha_obtencion' in data && data.fecha_obtencion) {
    const fechaCurso = new Date(data.fecha_obtencion);
    const fechaActual = new Date();
    if (fechaCurso > fechaActual) {
      errors.push('La fecha de obtención no puede ser futura');
    }
  }
  
  return errors;
};

// Función utilitaria para agrupar cursos por año
export const groupCursosByYear = (cursos: Curso[]): { [year: number]: Curso[] } => {
  return cursos.reduce((groups, curso) => {
    // Usar fecha_obtencion si existe, sino usar fecha_fin, sino usar fecha_inicio, sino usar created_at
    const fecha = curso.fecha_obtencion || curso.fecha_fin || curso.fecha_inicio || curso.created_at;
    if (fecha) {
      const year = new Date(fecha).getFullYear();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(curso);
    }
    return groups;
  }, {} as { [year: number]: Curso[] });
};

// Función utilitaria para obtener cursos únicos (sin duplicados por nombre)
export const getUniqueCursos = (cursos: Curso[]): string[] => {
  const unique = new Set(cursos.map(curso => curso.nombre_curso));
  return Array.from(unique);
};
