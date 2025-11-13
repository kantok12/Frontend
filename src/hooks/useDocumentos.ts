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
          // La respuesta puede venir en varias formas. Queremos garantizar que
          // siempre devolvemos un objeto con los campos esperados y, si es
          // posible, un `documentos_locales_split` con `documentos` y `cursos_certificaciones`.
          // 1) Si viene un array → convertir a DocumentosResponse
          if (Array.isArray(result.data)) {
            return {
              success: true,
              data: result.data,
              pagination: (result as any).pagination || { total: result.data.length, limit: 10, offset: 0, hasMore: false }
            };
          }

          // 2) Si viene la forma esperada con 'documentos' u 'documentos_locales_split'
          if (typeof result.data === 'object') {
            const dataObj: any = result.data;

            // Si backend ya entrega la forma 'documentos_locales_split', respetarla
            if (dataObj.documentos_locales_split) {
              // Asegurar que la respuesta tenga al menos documentos y cursos_certificaciones
              const split = dataObj.documentos_locales_split || { documentos: [], cursos_certificaciones: [] };
              dataObj.documentos_locales_split = {
                documentos: split.documentos || [],
                cursos_certificaciones: split.cursos_certificaciones || []
              };

              return {
                ...(result as any),
                data: dataObj
              } as DocumentosResponse;
            }

            // Si sólo existe 'documentos_locales' (legacy), generar un split a partir de la propiedad carpeta
            if (Array.isArray(dataObj.documentos_locales)) {
              const locales: any[] = dataObj.documentos_locales || [];
              const cursos = locales.filter((f: any) => {
                const carpeta = (f?.carpeta || '').toString().toLowerCase();
                return carpeta.includes('curso') || carpeta.includes('certific') || carpeta.includes('cursos_certificaciones');
              });
              const otros = locales.filter((f: any) => !cursos.includes(f));

              dataObj.documentos_locales_split = {
                documentos: otros,
                cursos_certificaciones: cursos
              };

              // Si la respuesta ya tiene 'documentos' o es la forma esperada, devolver respetando esos campos
              return {
                success: result.success,
                data: dataObj,
                pagination: (result as any).pagination || { total: (dataObj.documentos || []).length, limit: 10, offset: 0, hasMore: false }
              } as DocumentosResponse;
            }

            // Si tiene 'documentos' y no locales, devolver tal cual
            if ('documentos' in dataObj) {
              return result as DocumentosResponse;
            }
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
  // Documentos de Cursos y Certificados (se guardan en cursos_certificaciones/)
  { label: 'Certificado de Curso', value: 'certificado_curso', categoria: 'cursos' }, // ⭐ RECOMENDADO para cursos
  { label: 'Diploma', value: 'diploma', categoria: 'cursos' },
  { label: 'Certificado de Seguridad', value: 'certificado_seguridad', categoria: 'cursos' },
  { label: 'Certificado de Vencimiento', value: 'certificado_vencimiento', categoria: 'cursos' },
  
  // Documentos Personales
  { label: 'Carnet de Identidad', value: 'carnet_identidad', categoria: 'personal' },
  { label: 'Exámenes Preocupacionales', value: 'examenes_preocupacionales', categoria: 'personal' },
  { label: 'Licencia de Conducir', value: 'licencia_conducir', categoria: 'personal' },
  { label: 'Certificado Médico', value: 'certificado_medico', categoria: 'personal' },
  { label: 'Certificado Laboral', value: 'certificado_laboral', categoria: 'personal' },
  { label: 'Contrato de Trabajo', value: 'contrato_trabajo', categoria: 'personal' },
  { label: 'Fotografía Personal', value: 'fotografia_personal', categoria: 'personal' },
  { label: 'Otro', value: 'otro', categoria: 'personal' }
];

// Añadir tipo para prerrequisitos (reconocido en varias partes del sistema)
TIPOS_DOCUMENTOS_DEFAULT.push({ label: 'Prerrequisitos', value: 'prerrequisitos', categoria: 'personal' });

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
      const archivo = documentoData.get('archivo');
      
      if (!rutPersona || !nombreDocumento || !archivo) {
        throw new Error('Faltan campos requeridos: rut_persona, nombre_documento, archivo');
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

      // Extraer el nombre canónico que el backend pudo haber usado al guardar el archivo.
      // La forma de la respuesta puede variar, por eso intentamos múltiples caminos.
      const extractSavedName = (resp: any): string | null => {
        if (!resp) return null;
        // apiService.* devuelve usualmente un objeto { success, data }
        const payload = resp.data || resp;
        // data puede contener 'documentos' (array) o 'documento' (obj) o directamente el objeto
        const candidates = payload?.documentos || payload?.documento || payload;
        if (Array.isArray(candidates) && candidates.length > 0) {
          return candidates[0].nombre_archivo || candidates[0].nombre_archivo_guardado || candidates[0].nombre_original || null;
        }
        if (typeof candidates === 'object') {
          return candidates.nombre_archivo || candidates.nombre_archivo_guardado || candidates.nombre_original || null;
        }
        return null;
      };

      const savedName = extractSavedName(response);
      if (savedName) {
        console.log('📌 Nombre final devuelto por backend:', savedName);
      }

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

// Hook para eliminar documento y su archivo en Drive cuando sea posible
export const useDeleteDocumentoAndDrive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, driveFileId }: { id: number; driveFileId?: string }) => apiService.deleteDocumentoAndDrive(id, driveFileId),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos', 'persona'] });
      queryClient.invalidateQueries({ queryKey: ['documentos', 'curso'] });
    },
    onError: (error: any) => {
      console.error('❌ useDeleteDocumentoAndDrive - error:', error);
      throw error;
    }
  });
};

// Hook para registrar un documento que ya existe en almacenamiento externo (p.e. Google Drive)
export const useRegisterDocumentoExistente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => {
      // Log para debugging: mostrar carpeta destino según tipo_documento
      const esCurso = payload.tipo_documento && ['certificado_curso', 'diploma', 'curso', 'certificacion', 'certificación', 'curso/certificacion', 'curso/certificación']
        .includes(payload.tipo_documento.toLowerCase());
      const carpetaDestino = esCurso ? 'cursos_certificaciones/' : 'documentos/';
      
      console.log('📂 Registrando documento existente:', {
        rut_persona: payload.rut_persona,
        nombre_documento: payload.nombre_documento,
        tipo_documento: payload.tipo_documento || '(no especificado)',
        carpeta_destino: carpetaDestino,
        file: payload.file
      });
      
      return apiService.registerExistingDocument(payload);
    },
    onSuccess: (data: any, variables: any) => {
      // Extraer nombre final devuelto por el backend, si existe
      const extractSavedName = (resp: any): string | null => {
        if (!resp) return null;
        const payload = resp.data || resp;
        const candidates = payload?.documentos || payload?.documento || payload;
        if (Array.isArray(candidates) && candidates.length > 0) {
          return candidates[0].nombre_archivo || candidates[0].nombre_archivo_guardado || candidates[0].nombre_original || null;
        }
        if (typeof candidates === 'object') {
          return candidates.nombre_archivo || candidates.nombre_archivo_guardado || candidates.nombre_original || null;
        }
        return null;
      };

      const savedName = extractSavedName(data);
      if (savedName) console.log('📌 Nombre final devuelto por backend (registrar-existente):', savedName);

      // Invalidar caches relacionados para refrescar la lista de documentos de la persona
      const rut = variables?.rut_persona || variables?.rut || (variables && variables.rut_persona) || null;
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      if (rut) queryClient.invalidateQueries({ queryKey: ['documentos', 'persona', rut] });
      queryClient.invalidateQueries({ queryKey: ['documentos', 'curso'] });
    },
    onError: (error: any) => {
      console.error('❌ Error al registrar documento existente:', error);

      // Manejar errores específicos según la respuesta del backend
      if (error.response?.status === 409) { // Código 409 para conflicto (archivo duplicado)
        console.warn('⚠️ El archivo ya existe en el backend o en la carpeta destino.');
        throw new Error('El archivo ya existe. No es necesario volver a subirlo.');
      } else if (error.response?.status === 400) {
        throw new Error('Datos inválidos. Verifique que todos los campos estén correctamente completados.');
      } else if (error.response?.status === 413) {
        throw new Error('El archivo es demasiado grande. Máximo permitido: 100MB.');
      } else if (error.response?.status === 500) {
        throw new Error('Error interno del servidor. Por favor, intente nuevamente más tarde.');
      }

      // Lanzar error genérico para otros casos
      throw error;
    }
  });
};

// Hook para actualizar documento
export const useUpdateDocumento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiService.updateDocumento(id, data),
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
    mutationFn: async (id: number) => {
      try {
        console.log('📥 Iniciando descarga del documento ID:', id);
        const { blob, filename } = await apiService.downloadDocumento(id);
        console.log('📦 Blob recibido:', blob);
        console.log('📁 Nombre del archivo:', filename);
        
        // Crear URL temporal para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear elemento de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Descarga completada para documento ID:', id, 'como:', filename);
        return { blob, filename };
      } catch (error) {
        console.error('❌ Error en descarga del documento ID:', id, error);
        throw error;
      }
    },
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
  
  // tipo_documento es opcional
  
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
  
  // tipo_documento es opcional - El backend usa este campo para decidir carpeta destino:
  // - Si es 'curso', 'certificacion', etc. → guarda en cursos_certificaciones/
  // - Si no se especifica o es otro valor → guarda en documentos/
  if (data.tipo_documento) {
    formData.append('tipo_documento', data.tipo_documento);
  }
  // Indicar al backend el nombre con el que deseamos que se guarde el archivo
  // (esto permitirá que, incluso si el backend copia el archivo desde Drive o lo
  // almacena con el nombre original, tenga la instrucción del nombre deseado).
  if (data.nombre_documento) {
    formData.append('nombre_archivo_destino', data.nombre_documento);
  }
  // Agregar el archivo (solo una vez)
  formData.append('archivo', data.archivo); // Campo requerido según documentación (singular, no 'files')
  
  // Agregar descripción si existe
  if (data.descripcion) {
    formData.append('descripcion', data.descripcion);
  }
  
  // Agregar campos de validez si existen
  if (data.fecha_emision) {
    formData.append('fecha_emision', data.fecha_emision);
  }
  
  if (data.fecha_vencimiento) {
    formData.append('fecha_vencimiento', data.fecha_vencimiento);
  }
  
  if (data.dias_validez) {
    formData.append('dias_validez', data.dias_validez.toString());
  }
  
  if (data.estado_documento) {
    formData.append('estado_documento', data.estado_documento);
  }
  
  if (data.institucion_emisora) {
    formData.append('institucion_emisora', data.institucion_emisora);
  }

  // Si vienen prerrequisitos asociados al documento, enviarlos como JSON
  if ((data as any).prerrequisitos) {
    try {
      const prs = (data as any).prerrequisitos;
      // Enviar como JSON (backend puede aceptar JSON) y como array de campos 'prerrequisitos[]' por compatibilidad
      formData.append('prerrequisitos', JSON.stringify(prs));
      if (Array.isArray(prs)) {
        prs.forEach((id: any) => formData.append('prerrequisitos[]', String(id)));
      }
    } catch (e) {
      console.warn('No se pudo serializar prerrequisitos:', e);
    }
  }
  // Nota: no añadir tipo_documento por defecto aquí — el usuario debe asignarlo manualmente
  
  // Debug: Log del FormData creado
  const esCurso = data.tipo_documento && ['certificado_curso', 'diploma', 'curso', 'certificacion', 'certificación', 'curso/certificacion', 'curso/certificación']
    .includes(data.tipo_documento.toLowerCase());
  const carpetaDestino = esCurso ? 'cursos_certificaciones/' : 'documentos/';
  
  console.log('🔍 FormData creado según documentación de la API:', {
    rut_persona: data.personal_id,
    nombre_documento: data.nombre_documento,
    tipo_documento: data.tipo_documento || '(no especificado)',
    carpeta_destino: carpetaDestino,
    descripcion: data.descripcion || 'Sin descripción',
    fecha_emision: data.fecha_emision || 'Sin fecha',
    fecha_vencimiento: data.fecha_vencimiento || 'Sin fecha',
    dias_validez: data.dias_validez || 'Sin especificar',
    estado_documento: data.estado_documento || 'Sin estado',
    institucion_emisora: data.institucion_emisora || 'Sin institución',
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

// Funciones para obtener tipos de documentos por categoría
export const getTiposDocumentosCursos = () => {
  return TIPOS_DOCUMENTOS_DEFAULT.filter(tipo => tipo.categoria === 'cursos');
};

export const getTiposDocumentosPersonal = () => {
  return TIPOS_DOCUMENTOS_DEFAULT.filter(tipo => tipo.categoria === 'personal');
};
