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


// Hook para crear curso (según documentación actualizada de la API)
// Ahora POST /api/cursos acepta multipart/form-data y maneja archivos
export const useCreateCurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCursoData | FormData) => {
      // Si ya viene como FormData (con archivo), enviarlo directamente
      if (data instanceof FormData) {
        return apiService.createCurso(data);
      }
      
      // Si viene como objeto, validar y convertir si tiene archivo
      const cursoData = data as CreateCursoData;
      
      // Validar datos requeridos según la documentación
      if (!cursoData.nombre_curso) {
        throw new Error('Nombre del curso es requerido');
      }

      // Si se proporcionó rut_persona pero no personal_id, intentar resolverlo
      if (!cursoData.personal_id && cursoData.rut_persona) {
        try {
          const personResp = await apiService.getPersonalByRut(cursoData.rut_persona);
          if (personResp?.success && personResp.data) {
            // Algunos endpoints devuelven el objeto persona directamente
            const persona = personResp.data;
            // persona puede contener id o rut; preferir id
            if (persona.id) {
              cursoData.personal_id = String(persona.id);
            } else if (persona.rut) {
              // No tenemos id numérico, dejar rut_persona como fallback
              cursoData.personal_id = undefined;
            }
          } else {
            // fallback: no se encontró persona
            throw new Error('No se encontró persona para el RUT proporcionado');
          }
        } catch (err) {
          // Propagar error para que el caller lo maneje
          const message = (err as any)?.message || String(err);
          throw new Error(`No se pudo resolver personal_id desde rut_persona: ${message}`);
        }
      }
      
      // Si tiene archivo, crear FormData
        if (cursoData.archivo) {
        const formData = new FormData();
        // Preferir enviar personal_id si está disponible para evitar violaciones FK en backend
        if (cursoData.personal_id) {
          formData.append('personal_id', cursoData.personal_id);
        } else if (cursoData.rut_persona) {
          formData.append('rut_persona', cursoData.rut_persona);
        }
        formData.append('nombre_curso', cursoData.nombre_curso);
        
        if (cursoData.fecha_inicio) formData.append('fecha_inicio', cursoData.fecha_inicio);
        if (cursoData.fecha_fin) formData.append('fecha_fin', cursoData.fecha_fin);
        if (cursoData.fecha_vencimiento) formData.append('fecha_vencimiento', cursoData.fecha_vencimiento);
        if (cursoData.fecha_obtencion) formData.append('fecha_obtencion', cursoData.fecha_obtencion);
        formData.append('estado', cursoData.estado || 'completado');
        if (cursoData.institucion) formData.append('institucion', cursoData.institucion);
        if (cursoData.descripcion) formData.append('descripcion', cursoData.descripcion);
        
        // Agregar archivo (backend ahora lo guarda automáticamente en cursos_certificaciones/)
        // Si el usuario proporciona un nombre final deseado (`nombre_archivo_destino`),
        // adjuntamos el archivo usando ese nombre físico y también enviamos el campo
        // para que el backend pueda respetarlo si lo soporta.
        const archivoFile = cursoData.archivo as File;

        // Helper: slugify nombre del curso para generar un nombre de archivo seguro
        const slugify = (s: string) => {
          return s
            .normalize('NFD') // separar diacríticos
            .replace(/[\u0300-\u036f]/g, '') // eliminar tildes
            .replace(/[^\w\s-]/g, '') // eliminar caracteres no alfanuméricos (excepto guiones/espacios)
            .trim()
            .replace(/\s+/g, '_')
            .replace(/-+/g, '_')
            .toLowerCase();
        };

        const getExtension = (filename: string) => {
          const idx = filename.lastIndexOf('.');
          return idx !== -1 ? filename.substring(idx) : '';
        };

        let desiredFilename = cursoData.nombre_archivo_destino || '';
        if (!desiredFilename && cursoData.nombre_curso) {
          const ext = getExtension(archivoFile.name) || '.pdf';
          desiredFilename = `${slugify(cursoData.nombre_curso)}${ext}`;
        }

        if (desiredFilename) {
          // Append with filename override (third param) so FormData carries the desired filename
          formData.append('archivo', archivoFile, desiredFilename);
          // Enviar también el campo explícito por si el backend prefiere leerlo
          formData.append('nombre_archivo_destino', desiredFilename);
        } else {
          formData.append('archivo', archivoFile);
        }
        
        // Metadatos opcionales del documento
        if (cursoData.fecha_emision) formData.append('fecha_emision', cursoData.fecha_emision);
        if (cursoData.dias_validez) formData.append('dias_validez', cursoData.dias_validez.toString());
        if (cursoData.institucion_emisora) formData.append('institucion_emisora', cursoData.institucion_emisora);
        
        return apiService.createCurso(formData);
      }
      
      // Si no tiene archivo, enviar como JSON (comportamiento original)
      const cursoDataToSend = {
        ...cursoData,
        estado: cursoData.estado || 'completado'
      };
      
      return apiService.createCurso(cursoDataToSend);
    },
    onSuccess: (response, variables) => {
      // Obtener RUT desde FormData o desde el objeto
      let rutPersona: string | null = null;
      
      if (variables instanceof FormData) {
        rutPersona = variables.get('rut_persona') as string;
      } else if ('rut_persona' in variables) {
        rutPersona = variables.rut_persona || null;
      }
      
      // eslint-disable-next-line no-console
      console.log('✅ Curso creado exitosamente (con archivo si se incluyó), invalidando queries para RUT:', rutPersona);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      if (rutPersona) {
        queryClient.invalidateQueries({ queryKey: ['cursos', 'persona', rutPersona] });
        // También invalidar documentos ya que el backend registra el archivo automáticamente
        queryClient.invalidateQueries({ queryKey: ['documentos', 'persona', rutPersona] });
      }
      queryClient.invalidateQueries({ queryKey: ['cursos', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      
      // eslint-disable-next-line no-console
      console.log('🔄 Queries invalidadas para refrescar datos (cursos y documentos)');
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
