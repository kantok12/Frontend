/* eslint-disable no-console */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { CreateDocumentoData, DocumentosResponse } from '../types';
import { validateFile, formatBytes } from '../utils/helpers';
import { FILE_CONFIG } from '../config/api';

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

// Hook para obtener documentos por persona (RUT) según documentación de la API
export const useDocumentosByPersona = (rut: string) => {
  return useQuery<DocumentosResponse>({
    queryKey: ['documentos', 'persona', rut],
    queryFn: async (): Promise<DocumentosResponse> => {
      console.log('🔍 Solicitando documentos para RUT:', rut);
      try {
        const result = await apiService.getDocumentosByPersona(rut);
        console.log('📄 Documentos recibidos para RUT', rut, ':', result);
        
        // Verificar la estructura de respuesta según la documentación
        if (result?.success && result?.data) {
          // La respuesta debe tener la estructura: { success: true, data: [...], pagination: {...} }
          if (Array.isArray(result.data)) {
            return {
              success: true,
              data: result.data,
              pagination: (result as any).pagination || { total: result.data.length, limit: 10, offset: 0, hasMore: false }
            };
          } else if (typeof result.data === 'object' && 'documentos' in result.data) {
            // Si ya tiene la estructura esperada
            return result as DocumentosResponse;
          }
        }
        
        // Si no tiene la estructura esperada, devolver datos vacíos
        return {
          success: true,
          data: [],
          pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
          message: 'Estructura de datos no reconocida'
        };
      } catch (error: any) {
        // Manejar diferentes tipos de errores según la documentación
        if (error.response?.status === 404) {
          console.warn('⚠️ No se encontraron documentos para RUT:', rut);
          return {
            success: true,
            data: [],
            pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
            message: 'No se encontraron documentos para este RUT'
          };
        } else if (error.response?.status === 500) {
          console.warn('⚠️ Error interno del servidor en /api/documentos/persona/{rut}');
          return {
            success: true,
            data: [],
            pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
            message: 'Error interno del servidor'
          };
        }
        
        // Para otros errores, devolver datos vacíos
        return {
          success: true,
          data: [],
          pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
          message: 'No se pudieron obtener los documentos'
        };
      }
    },
    enabled: !!rut,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error: any) => {
      if (error.response?.status !== 404 && error.response?.status !== 500) {
        console.error('❌ Error al obtener documentos para RUT', rut, ':', error);
      }
    }
  });
};

// Nota: No hay endpoint específico para documentos de cursos
// Los documentos se obtienen por persona y se filtran por tipo en el componente

// Tipos de documentos por defecto (según documentación de la API)
const TIPOS_DOCUMENTOS_DEFAULT = [
  { label: 'Certificado de Curso', value: 'certificado_curso' },
  { label: 'Diploma', value: 'diploma' },
  { label: 'Certificado Laboral', value: 'certificado_laboral' },
  { label: 'Certificado Médico', value: 'certificado_medico' },
  { label: 'Licencia de Conducir', value: 'licencia_conducir' },
  { label: 'Certificado de Seguridad', value: 'certificado_seguridad' },
  { label: 'Certificado de Vencimiento', value: 'certificado_vencimiento' },
  { label: 'Otro', value: 'otro' }
];

// Tipos de archivo soportados según la documentación
const SUPPORTED_FILE_TYPES = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf'
  ],
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/bmp'
  ]
};

const SUPPORTED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
  '.ppt', '.pptx', '.txt', '.rtf', 
  '.jpg', '.jpeg', '.png', '.tiff', '.bmp'
];

// Hook para obtener tipos de documentos
export const useTiposDocumentos = () => {
  return useQuery({
    queryKey: ['tipos-documentos'],
    queryFn: async () => {
      console.log('🔍 Solicitando tipos de documentos...');
      try {
        const result = await apiService.getTiposDocumentos();
        console.log('📋 Tipos de documentos recibidos del backend:', result);
        
        // Verificar si el resultado tiene datos válidos
        if (result?.success && result?.data && result.data.length > 0) {
          return result;
        } else {
          console.warn('⚠️ Backend devolvió datos vacíos, usando tipos por defecto');
          return {
            success: true,
            data: TIPOS_DOCUMENTOS_DEFAULT,
            message: 'Usando tipos de documentos por defecto (backend vacío)'
          };
        }
      } catch (error) {
        console.warn('⚠️ Error al obtener tipos de documentos del backend, usando tipos por defecto:', error);
        // Retornar tipos por defecto en caso de error
        return {
          success: true,
          data: TIPOS_DOCUMENTOS_DEFAULT,
          message: 'Usando tipos de documentos por defecto (error de conexión)'
        };
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutos (cambia poco)
    retry: 1, // Solo reintentar una vez
    // Asegurar que siempre devuelva datos
    placeholderData: {
      success: true,
      data: TIPOS_DOCUMENTOS_DEFAULT,
      message: 'Cargando tipos de documentos...'
    }
  });
};

// Hook para obtener formatos de archivo soportados
export const useFormatosArchivo = () => {
  return useQuery({
    queryKey: ['formatos-archivo'],
    queryFn: () => apiService.getFormatosArchivo(),
    staleTime: 30 * 60 * 1000, // 30 minutos (cambia poco)
  });
};

// Hook para subir documento (según documentación de la API)
export const useUploadDocumento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (documentoData: FormData) => {
      // Validar que el FormData tenga los campos requeridos
      const rutPersona = documentoData.get('rut_persona');
      const nombreDocumento = documentoData.get('nombre_documento');
      const tipoDocumento = documentoData.get('tipo_documento');
      const archivo = documentoData.get('archivo');
      
      if (!rutPersona || !nombreDocumento || !tipoDocumento || !archivo) {
        throw new Error('Faltan campos requeridos: rut_persona, nombre_documento, tipo_documento, archivo');
      }
      
      // Validar que el archivo sea una instancia de File
      if (!(archivo instanceof File)) {
        throw new Error('El archivo debe ser válido');
      }
      
      // Validar el archivo según las limitaciones del backend
      const validation = validateFileForBackend(archivo);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      return apiService.uploadDocumento(documentoData);
    },
    onSuccess: (response, variables) => {
      console.log('✅ Documento subido exitosamente:', response);
      
      // Obtener el RUT de la persona del FormData para invalidar queries específicas
      const rutPersona = variables.get('rut_persona');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      if (rutPersona) {
        queryClient.invalidateQueries({ queryKey: ['documentos', 'persona', rutPersona] });
      }
      queryClient.invalidateQueries({ queryKey: ['documentos', 'curso'] });
    },
    onError: (error: any) => {
      console.error('❌ Error al subir documento:', error);
      
      // Manejar errores específicos según la documentación
      if (error.response?.status === 400) {
        throw new Error('Datos inválidos. Verifique que todos los campos estén correctamente completados.');
      } else if (error.response?.status === 413) {
        throw new Error('El archivo es demasiado grande. Máximo permitido: 100MB.');
      } else if (error.response?.status === 500) {
        throw new Error('Error interno del servidor. Por favor, intente nuevamente más tarde.');
      }
    }
  });
};

// Hook para eliminar documento
export const useDeleteDocumento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteDocumento(id),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos', 'persona'] });
      queryClient.invalidateQueries({ queryKey: ['documentos', 'curso'] });
    },
  });
};

// Hook para descargar documento
export const useDownloadDocumento = () => {
  return useMutation({
    mutationFn: (id: number) => apiService.downloadDocumento(id),
  });
};

// Funciones utilitarias para documentos
export const formatTamañoArchivo = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateDocumentoData = (data: CreateDocumentoData): string[] => {
  const errors: string[] = [];
  
  if (!data.personal_id || data.personal_id.trim().length === 0) {
    errors.push('ID de personal es requerido');
  }
  
  if (!data.nombre_documento || data.nombre_documento.trim().length === 0) {
    errors.push('Nombre del documento es requerido');
  }
  
  if (!data.tipo_documento || data.tipo_documento.trim().length === 0) {
    errors.push('Tipo de documento es requerido');
  }
  
  if (!data.archivo) {
    errors.push('Archivo es requerido');
  } else {
    // Validar archivo usando la nueva configuración
    const fileValidation = validateFile(data.archivo, FILE_CONFIG.MAX_SIZE_MB, FILE_CONFIG.SUPPORTED_TYPES);
    if (!fileValidation.isValid) {
      errors.push(fileValidation.error || 'Archivo inválido');
    }
  }
  
  return errors;
};

// Función para crear FormData para subir documento (según documentación de la API)
export const createDocumentoFormData = (data: CreateDocumentoData): FormData => {
  const formData = new FormData();
  
  // Usar 'rut_persona' en lugar de 'personal_id' según la documentación
  formData.append('rut_persona', data.personal_id); // El backend espera 'rut_persona'
  formData.append('nombre_documento', data.nombre_documento);
  formData.append('tipo_documento', data.tipo_documento);
  formData.append('archivo', data.archivo); // Campo requerido según documentación
  
  // Agregar descripción si existe
  if (data.descripcion) {
    formData.append('descripcion', data.descripcion);
  }
  
  // Debug: Log del FormData creado
  console.log('🔍 FormData creado según documentación de la API:', {
    rut_persona: data.personal_id,
    nombre_documento: data.nombre_documento,
    tipo_documento: data.tipo_documento,
    descripcion: data.descripcion || 'Sin descripción',
    archivo_name: data.archivo.name,
    archivo_size: formatBytes(data.archivo.size),
    archivo_type: data.archivo.type,
    max_size_allowed: `${FILE_CONFIG.MAX_SIZE_MB}MB`
  });
  
  return formData;
};

// Función para validar archivos según las limitaciones del backend
export const validateFileForBackend = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024; // 100MB según documentación
  
  // Verificar tamaño
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Máximo permitido: 100MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }
  
  // Verificar tipo de archivo
  const allSupportedTypes = [...SUPPORTED_FILE_TYPES.documents, ...SUPPORTED_FILE_TYPES.images];
  if (!allSupportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Tipo de archivo no soportado. Tipos permitidos: ${SUPPORTED_EXTENSIONS.join(', ')}`
    };
  }
  
  return { isValid: true };
};

// Función para obtener el tipo de archivo basado en la extensión
export const getFileTypeFromExtension = (filename: string): string => {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'txt':
      return 'text/plain';
    case 'rtf':
      return 'application/rtf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'tiff':
      return 'image/tiff';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
};
