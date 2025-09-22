import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Curso, CreateCursoData, UpdateCursoData } from '../types';

// Hook para obtener todos los cursos con filtros
export const useCursos = (filters?: { rut?: string; curso?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['cursos', filters],
    queryFn: () => apiService.getCursos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook para obtener cursos de una persona específica
export const useCursosByRut = (rut: string) => {
  return useQuery({
    queryKey: ['cursos', 'persona', rut],
    queryFn: () => apiService.getCursosByRut(rut),
    enabled: !!rut,
    staleTime: 5 * 60 * 1000, // 5 minutos
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


// Hook para crear curso
export const useCreateCurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCursoData) => apiService.createCurso(data),
    onSuccess: (response, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['cursos', 'persona', variables.rut_persona] });
      queryClient.invalidateQueries({ queryKey: ['cursos', 'stats'] });
    },
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
    const year = new Date(curso.fecha_obtencion).getFullYear();
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(curso);
    return groups;
  }, {} as { [year: number]: Curso[] });
};

// Función utilitaria para obtener cursos únicos (sin duplicados por nombre)
export const getUniqueCursos = (cursos: Curso[]): string[] => {
  const unique = new Set(cursos.map(curso => curso.nombre_curso));
  return Array.from(unique);
};
