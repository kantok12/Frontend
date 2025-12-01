/* eslint-disable no-console */
import React, { useState, useEffect, useMemo } from 'react';
import { Personal, UpdatePersonalData } from '../../types';
import { useUpdatePersonal } from '../../hooks/usePersonal';
import { useAsignaciones } from '../../hooks/useAsignaciones';
import { useUpdatePersonalData } from '../../hooks/useNombres';
import { useEstados } from '../../hooks/useEstados';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Download, Trash2, Edit, FileText, Plus, User, Upload, Save, XCircle, Activity, MapPin, Car, Shirt as ShirtIcon, GraduationCap } from 'lucide-react';
import { useDocumentosByPersona, useDeleteDocumentoAndDrive, useDownloadDocumento, useUpdateDocumento } from '../../hooks/useDocumentos';
import { useCursosByRut, useDeleteCurso } from '../../hooks/useCursos';
import { displayValue } from '../../utils/display';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getAge, formatRUT, standardizeName, formatDate, truncateFilename, daysUntilNumber, daysUntilText, getDocumentIcon, getDocumentColor } from '../../utils/formatters';
import { API_CONFIG } from '../../config/api';
import { useProfileImage } from '../../hooks/useProfileImage';
import SubirDocumentoModal from './SubirDocumentoModal';
import { CursoModal } from './CursoModal';
import CourseDocumentModal from './CourseDocumentModal';
import EditDocumentModal from './EditDocumentModal';


interface PersonalDetailModalProps {
  personal: Personal | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const PersonalDetailModal: React.FC<PersonalDetailModalProps> = ({ personal, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'documentos' | 'cursos' | 'detalles'>('detalles');
  const [showSubirModal, setShowSubirModal] = useState(false);
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<any | null>(null);
  const [showCourseDocumentModal, setShowCourseDocumentModal] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any | null>(null);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<any | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<Set<number | string>>(new Set());
  const [expandedDocs, setExpandedDocs] = useState<Set<number | string>>(new Set());
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdatePersonalData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentEstadoId, setCurrentEstadoId] = useState<number>(personal?.estado_id || 1);
  const [showAsignaciones, setShowAsignaciones] = useState(false);
  
  // State for profile image
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateMutation = useUpdatePersonal();
  const updatePersonalDataMutation = useUpdatePersonalData();
  const { data: estadosData, isLoading: estadosLoading } = useEstados({ limit: 100 });
  const { data: documentosData, isLoading: isLoadingDocumentos, error: errorDocumentos, refetch: refetchDocumentos } = useDocumentosByPersona(personal?.rut ?? '');
  const { data: cursosData, isLoading: isLoadingCursos, error: errorCursos, refetch: refetchCursos } = useCursosByRut(personal?.rut ?? '');
  const deleteCursoMutation = useDeleteCurso();
  const deleteDocumentoAndDriveMutation = useDeleteDocumentoAndDrive();
  const downloadDocumentoMutation = useDownloadDocumento();
  const { uploadImage, deleteImage, isUploading: isUploadingImage, isDeleting: isDeletingImage } = useProfileImage(personal?.rut || '');
  const updateDocumentoMutation = useUpdateDocumento();

  useEffect(() => {
    if (personal?.rut) {
      const encodedRut = encodeURIComponent(personal.rut);
      setImageUrl(`${API_CONFIG.BASE_URL}/personal/${encodedRut}/image/download?t=${new Date().getTime()}`);
      setImageError(false);
    }
    if (personal?.estado_id !== undefined) {
      setCurrentEstadoId(personal.estado_id);
    }
  }, [personal]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && personal) {
      const file = event.target.files[0];
      try {
        await uploadImage(file);
        // Refresh image
        const encodedRut = encodeURIComponent(personal.rut);
        setImageUrl(`${API_CONFIG.BASE_URL}/personal/${encodedRut}/image/download?t=${new Date().getTime()}`);
        setImageError(false);
      } catch (error) {
        console.error("Error uploading image:", error);
        setImageError(true);
      }
    }
  };

  const handleRemoveImage = async () => {
    if (personal) {
      try {
        await deleteImage();
        setImageUrl('');
        setImageError(true); // To show placeholder
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
  };

  // Obtener nombre del estado por id (usando datos de la API)
  const getEstadoNombreById = (id?: number) => {
    if (!id) return personal?.estado_nombre || 'Desconocido';
    const found = estadosData?.data?.find((e: any) => e.id === id);
    return found?.nombre || personal?.estado_nombre || 'Desconocido';
  };
  
  const handleDownloadDocument = async (documento: any) => {
    if (!documento.id) {
      console.error("ID de documento no válido");
      return;
    }
    try {
      await downloadFile(documento.id, documento.nombre_documento);
    } catch (error) {
      console.error("Error al descargar el documento:", error);
    }
  };

  // Cargar documentos del personal desde el backend
  // Filtrar documentos por categorías
  // La API puede devolver varias formas:
  //  - { success: true, data: { documentos: [...] } }
  //  - { success: true, data: [...] } (array directo)
  //  - { success: true, data: { documentos_locales_split: { documentos: [...], cursos_certificaciones: [...] } } }
  // Normalizar a un array plano de documentos en `rawDocumentos` para evitar resultados vacíos.
  const rawDocumentos: any[] = (() => {
    // Normalize many possible shapes returned by the backend.
    // The hook may return: { success, data: [...] } OR { success, data: { documentos: [...] } }
    // or might already be the array. Add defensive logs to help debugging.
    if (isOpen) console.log('🔍 documentosData full:', documentosData);
    const d: any = documentosData?.data ?? documentosData;
    if (!d) return [];

    // If backend returned a raw array, use it directly
    if (Array.isArray(d)) return d;

    // Prefer explicit top-level arrays returned by the backend when present and non-empty.
    // Backend may provide the documents under different keys (documentos, mis_documentos, items, rows)
    const preferredKeys = ['documentos', 'mis_documentos', 'items', 'rows', 'documentos_locales'];
    for (const k of preferredKeys) {
      if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
    }

    // If the backend provides a split structure, combine only if it contains items.
    if (d.documentos_locales_split) {
      const split = d.documentos_locales_split;
      const docs = Array.isArray(split.documentos) ? split.documentos : [];
      const cursos = Array.isArray(split.cursos_certificaciones) ? split.cursos_certificaciones : [];
      if (docs.length > 0 || cursos.length > 0) return [...docs, ...cursos];
    }

    // Fallbacks: return empty arrays or any arrays even if empty to keep consistent behavior
    if (Array.isArray(d.documentos)) return d.documentos;
    if (Array.isArray(d.documentos_locales)) return d.documentos_locales;

    return [];
  })();

  // Reuse the query above (`documentosData`) instead of creating a second query instance.
  // The first call to `useDocumentosByPersona` returns `isLoadingDocumentos` and `errorDocumentos`.

  // Dedupe: el backend a veces puede devolver entradas duplicadas (por ejemplo registro y copia local).
  // Usar el nombre de archivo normalizado como clave principal (elimina sufijos de timestamp, underscores, mayúsculas)
  const normalizeName = (name: string | undefined) => {
    if (!name) return '';
    // Lowercase
    let s = name.toString().toLowerCase();
    // Replace underscores and multiple separators with space
    s = s.replace(/[_\-]+/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    // Remove trailing numeric timestamps (e.g. 1759500715991 or _1759500715991)
    s = s.replace(/(?:\s|_|-)*\d{9,}(?:\.\w+)?$/, '');
    // Trim again
    return s.trim();
  };

  const uniqueDocumentosMap = new Map<string, any>();
  for (const d of rawDocumentos) {
    const rawName = d?.nombre_original || d?.nombre_archivo || '';
    const normalized = normalizeName(rawName);
    const tipo = (d?.tipo_documento || '').toString().toLowerCase();
    const key = normalized ? `${normalized}::${tipo}` : (d?.id ? `id::${d.id}` : JSON.stringify(d));
    if (!uniqueDocumentosMap.has(key)) uniqueDocumentosMap.set(key, d);
  }
  const todosDocumentos = Array.from(uniqueDocumentosMap.values());

  console.log('� Documentos totales (únicos):', todosDocumentos.length, 'raw:', rawDocumentos.length);
  
  // Documentos de cursos y certificados
  // Incluye: curso, certificacion, certificación y tipos legacy
  const courseDocuments = todosDocumentos.filter((doc: any) => {
    const tipo = doc.tipo_documento?.toLowerCase() || '';
    return tipo === 'curso' || 
           tipo === 'certificacion' || 
           tipo === 'certificación' ||
           tipo === 'curso/certificacion' ||
           tipo === 'curso/certificación' ||
           tipo === 'certificado_curso' || 
           tipo === 'diploma' ||
           tipo === 'certificado_seguridad' ||
           tipo === 'certificado_vencimiento';
  });
  
  console.log('� Documentos de cursos:', courseDocuments.length);
  
  // Documentos personales (carnet, exámenes, licencias, etc.)
  const personalDocuments = todosDocumentos.filter((doc: any) => {
    const tipo = doc.tipo_documento?.toLowerCase() || '';
    // Si no es un curso/certificación, entonces es documento personal
    const esCurso = tipo === 'curso' || 
                    tipo === 'certificacion' || 
                    tipo === 'certificación' ||
                    tipo === 'curso/certificacion' ||
                    tipo === 'curso/certificación' ||
                    tipo === 'certificado_curso' || 
                    tipo === 'diploma' ||
                    tipo === 'certificado_seguridad' ||
                    tipo === 'certificado_vencimiento';
    return !esCurso;
  });
  
  // Función utilitaria para descargar archivos
  const downloadFile = async (documentId: number, fileName: string) => {
    try {
      console.log('🔍 downloadFile - Iniciando descarga:', { documentId, fileName });
      const result = await downloadDocumentoMutation.mutateAsync(documentId);
      console.log('✅ downloadFile - Respuesta recibida:', { 
        blobSize: result.blob?.size, 
        blobType: result.blob?.type,
        filename: result.filename 
      });
      
      const { blob, filename } = result;
      
      if (!blob || blob.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }
      
      const url = window.URL.createObjectURL(blob);
      console.log('🔗 downloadFile - URL creada:', url);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ downloadFile - Descarga completada');
      return true;
    } catch (error: any) {
      console.error('❌ downloadFile - Error detallado:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        error: error
      });
      throw error;
    }
  };

  const handleEditDocumentModalClose = () => {
    setShowEditDocumentModal(false);
    setEditingDocumento(null);
  };

  const handleEditDocumentSuccess = () => {
    refetchDocumentos();
    setShowEditDocumentModal(false);
    setEditingDocumento(null);
  };

  const handleCourseDocumentModalClose = () => {
    setShowCourseDocumentModal(false);
    setSelectedCurso(null);
  };

  // Inicializar datos de edición cuando se abre la modal
  useEffect(() => {
    if (personal && isOpen) {
      setEditData({
        nombre: personal.nombre || '',
        apellido: personal.apellido || '',
        cargo: personal.cargo,
        telefono: (personal.telefono as any) || '',
        email: personal.email || '',
        contacto: personal.contacto || undefined,
        contacto_emergencia: personal.contacto_emergencia || undefined,
        sexo: personal.sexo,
        licencia_conducir: personal.licencia_conducir,
        talla_zapatos: personal.talla_zapatos,
        talla_pantalon: personal.talla_pantalon,
        talla_poleras: personal.talla_poleras,
        ubicacion: {
          region: personal.ubicacion?.region || '',
          ciudad: personal.ubicacion?.ciudad || '',
          comuna: personal.ubicacion?.comuna || '',
          direccion: personal.ubicacion?.direccion || ''
        },
        activo: personal.activo,
        estado_id: personal.estado_id,
        comentario_estado: personal.comentario_estado,
        fecha_nacimiento: personal.fecha_nacimiento.split('T')[0],
        edad: getAge(personal.fecha_nacimiento).toString(),
      });
    }
  }, [personal, isOpen]);

  if (!isOpen || !personal) {
    return null;
  }

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (editData.nombre !== undefined && !editData.nombre?.trim()) newErrors.nombre = 'El nombre es requerido';
    if (editData.apellido !== undefined && !editData.apellido?.trim()) newErrors.apellido = 'El apellido es requerido';
    if (editData.cargo !== undefined && !editData.cargo?.trim()) newErrors.cargo = 'El cargo es requerido';
    if (editData.licencia_conducir !== undefined && !editData.licencia_conducir?.trim()) newErrors.licencia_conducir = 'La licencia es requerida';
    // zona_geografica removed from UI per request — skip validation here
    // Validación de contacto
    const emailValue = (editData as any).email || personal.email || '';
    const telefonoValue = (editData as any).telefono || personal.telefono || '';
    const contactoEmerg = (editData as any).contacto_emergencia || personal.contacto_emergencia || {};

    const isValidEmail = (value: string) => {
      if (!value) return true; // vacío permitido, se maneja como 'sin email'
      return /^\S+@\S+\.\S+$/.test(value.trim());
    };

    const isValidPhone = (value: string) => {
      if (!value) return true; // vacío permitido
      const digits = (value || '').replace(/\D/g, '');
      if (digits.length < 6) return false;
      return /^[+]?[-()\s\d]+$/.test(value.trim());
    };

    if (!isValidPhone(telefonoValue)) newErrors.telefono = 'Teléfono inválido (mínimo 6 dígitos)';
    if (!isValidEmail(emailValue)) newErrors.email = 'Email con formato inválido';

    // Si se provee algún dato de contacto de emergencia, validar campos mínimos
    const anyEmerg = Boolean(contactoEmerg && (contactoEmerg.nombre || contactoEmerg.telefono || contactoEmerg.email || contactoEmerg.relacion));
    if (anyEmerg) {
      if (!contactoEmerg.nombre || !String(contactoEmerg.nombre).trim()) newErrors['contacto_emergencia.nombre'] = 'Nombre del contacto de emergencia es requerido';
      if (!contactoEmerg.telefono || !String(contactoEmerg.telefono).trim()) newErrors['contacto_emergencia.telefono'] = 'Teléfono del contacto de emergencia es requerido';
      if (contactoEmerg.telefono && !isValidPhone(String(contactoEmerg.telefono))) newErrors['contacto_emergencia.telefono'] = 'Teléfono de emergencia inválido';
      if (contactoEmerg.email && !isValidEmail(String(contactoEmerg.email))) newErrors['contacto_emergencia.email'] = 'Email de emergencia con formato inválido';
    }
    if (editData.comentario_estado && editData.comentario_estado.length > 1000) newErrors.comentario_estado = 'El comentario no puede exceder 1000 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!personal) return;
    if (!validateForm()) return;
    try {
      const promises = [] as any[];
      let nombreActualizado = false;
      if (editData.nombre || editData.apellido) {
        const nombreCompleto = standardizeName(
          `${editData.nombre || personal.nombre || 'Sin nombre'} ${editData.apellido || personal.apellido || 'Sin apellido'}`
        );
        const personalUpdateData = {
          nombres: nombreCompleto,
          sexo: editData.sexo || personal.sexo,
          fecha_nacimiento: personal.fecha_nacimiento,
          licencia_conducir: editData.licencia_conducir || personal.licencia_conducir,
          cargo: editData.cargo || personal.cargo,
          estado_id: editData.estado_id !== undefined ? editData.estado_id : personal.estado_id,
          talla_zapato: editData.talla_zapatos || personal.talla_zapatos || '',
          talla_pantalon: editData.talla_pantalon || personal.talla_pantalon || '',
          talla_ropa: editData.talla_poleras || personal.talla_poleras || '',
          // Campos de ubicación según el esquema real de la DB
          region: (editData as any).ubicacion?.region || personal.ubicacion?.region || undefined,
          ciudad: (editData as any).ubicacion?.ciudad || personal.ubicacion?.ciudad || undefined,
          comuna: (editData as any).ubicacion?.comuna || personal.ubicacion?.comuna || undefined,
          telefono: (editData as any).telefono || personal.telefono || undefined,
          correo_electronico: (editData as any).email || personal.email || undefined,
          contacto_emergencia: (editData as any).contacto_emergencia || personal.contacto_emergencia || undefined,
        };
        promises.push(updatePersonalDataMutation.mutateAsync({ rut: personal.rut, data: personalUpdateData }));
        nombreActualizado = true;
      }
      const nombreCompleto = standardizeName(
        `${editData.nombre || personal.nombre || ''} ${editData.apellido || personal.apellido || ''}`.trim()
      );
      const updateData = {
        nombres: nombreCompleto,
        sexo: editData.sexo || personal.sexo,
        licencia_conducir: editData.licencia_conducir || personal.licencia_conducir,
        cargo: editData.cargo || personal.cargo,
        estado_id: editData.estado_id !== undefined ? editData.estado_id : personal.estado_id,
        fecha_nacimiento: editData.fecha_nacimiento || personal.fecha_nacimiento || '1990-01-01',
        talla_zapato: editData.talla_zapatos || personal.talla_zapatos || '',
        talla_pantalon: editData.talla_pantalon || personal.talla_pantalon || '',
        talla_ropa: editData.talla_poleras || personal.talla_poleras || '',
        // Incluir datos de ubicación según esquema real de DB
        region: (editData as any).ubicacion?.region || personal.ubicacion?.region || undefined,
        ciudad: (editData as any).ubicacion?.ciudad || personal.ubicacion?.ciudad || undefined,
        comuna: (editData as any).ubicacion?.comuna || personal.ubicacion?.comuna || undefined,
        telefono: (editData as any).telefono || personal.telefono || undefined,
        correo_electronico: (editData as any).email || personal.email || undefined,
        contacto_emergencia: (editData as any).contacto_emergencia || personal.contacto_emergencia || undefined,
      };
      // cast a any because api may accept extra keys for region/ciudad/comuna
      promises.push(updateMutation.mutateAsync({ id: personal.rut, data: updateData as any }));
      await Promise.all(promises);
      const newEstadoId = editData.estado_id !== undefined ? editData.estado_id : personal.estado_id;
      if (newEstadoId !== undefined) setCurrentEstadoId(newEstadoId);
      setIsEditing(false);
      onUpdate?.();
      
      // Guardar el RUT del usuario antes de recargar para volver a abrir el modal
      sessionStorage.setItem('reopenPersonalModal', personal.rut);
      console.log('💾 Guardando RUT en sessionStorage para reabrir modal:', personal.rut);
      
      // Recargar la página inmediatamente (el alert se mostrará después del reload)
      window.location.reload();
    } catch (error: any) {
      console.error('Error al actualizar:', error);
      setErrors({ general: 'Error al actualizar el personal. Verifique los datos ingresados.' });
    }
  };

  const handleCancel = () => {
    if (!personal) return;
    setEditData({
      nombre: personal.nombre || '',
      apellido: personal.apellido || '',
      cargo: personal.cargo,
      sexo: personal.sexo,
      licencia_conducir: personal.licencia_conducir,
      talla_zapatos: personal.talla_zapatos,
      talla_pantalon: personal.talla_pantalon,
      talla_poleras: personal.talla_poleras,
      ubicacion: {
        region: personal.ubicacion?.region || '',
        ciudad: personal.ubicacion?.ciudad || '',
        comuna: personal.ubicacion?.comuna || '',
        direccion: personal.ubicacion?.direccion || ''
      },
      activo: personal.activo,
      estado_id: personal.estado_id,
      comentario_estado: personal.comentario_estado,
    });
    setIsEditing(false);
    setErrors({});
  };

  const handleAddCurso = () => { setEditingCurso(null); setShowCursoModal(true); };
  const handleEditCurso = (curso: any) => { setEditingCurso(curso); setShowCursoModal(true); };
  const handleDeleteCurso = async (curso: any) => {
    if (window.confirm(`¿Está seguro que desea eliminar el curso "${curso.nombre_curso}"?`)) {
      try { await deleteCursoMutation.mutateAsync(curso.id); refetchCursos(); } catch {}
    }
  };

  // Funciones para manejar documentos de cursos
  const handleEditDocumento = (documento: any) => {
    setEditingDocumento(documento);
    setShowEditDocumentModal(true);
  };

  const toggleSelectDocument = (docId: number | string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  };

  const clearSelected = () => setSelectedDocs(new Set());

  const toggleExpandDocument = (docId: number | string) => {
    setExpandedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  };

  
  const handleDeleteDocumento = async (documento: any) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${documento.nombre_documento}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDocumentoAndDriveMutation.mutateAsync({ id: documento.id, driveFileId: documento.drive_file_id });
        refetchDocumentos();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const handleBulkDelete = async (ids: Array<number | string>) => {
    if (!ids || ids.length === 0) return;
    if (!window.confirm(`¿Seguro que quieres eliminar ${ids.length} documento(s)? Esta acción no se puede deshacer.`)) return;
    try {
      await Promise.all(ids.map((id) => {
        const doc = todosDocumentos.find((d: any) => String(d.id) === String(id));
        const payload = { id: doc?.id, driveFileId: doc?.drive_file_id };
        return deleteDocumentoAndDriveMutation.mutateAsync(payload as any);
      }));
      clearSelected();
      refetchDocumentos();
    } catch (error) {
      console.error('Error en eliminación masiva:', error);
    }
  };

  const handleDeleteAllByType = async (tipo: string) => {
    const matches = todosDocumentos.filter((d: any) => d.tipo_documento === tipo);
    if (window.confirm(`¿Seguro que quieres eliminar ${matches.length} documentos de tipo "${tipo}"?`)) {
      const deletions = matches.map((m: any) => deleteDocumentoAndDriveMutation.mutateAsync({ id: m.id, driveFileId: m.drive_file_id }));
      try {
        await Promise.all(deletions);
        refetchDocumentos();
      } catch (error) {
        console.error("Error en eliminación masiva:", error);
      }
    }
  };

  const handleCursoModalClose = () => { setShowCursoModal(false); setEditingCurso(null); };
  const handleCursoSuccess = () => { refetchCursos(); };
  const handleAddCourseDocument = (curso: any) => { setSelectedCurso(curso); setShowCourseDocumentModal(true); };
  const handleCourseDocumentSuccess = () => { refetchDocumentos(); refetchCursos(); };

  const handleAddDocument = () => { setShowDocumentModal(true); };

  const handleDocumentModalClose = () => { setShowDocumentModal(false); };

  const handleDocumentSuccess = () => {
    refetchDocumentos();
    onUpdate();
  };

  const handleDeleteAllForCourse = async (cursoId: number) => {
    const docsToDelete = personalDocuments.filter((d: any) => d.curso_id === cursoId);
    if (docsToDelete.length === 0) return;

    if (window.confirm(`¿Seguro que quieres eliminar ${docsToDelete.length} documento(s) asociado(s) a este curso?`)) {
      try {
        await Promise.all(docsToDelete.map((d: any) => deleteDocumentoAndDriveMutation.mutateAsync({ id: d.id, driveFileId: d.drive_file_id })));
        refetchDocumentos();
      } catch (error) {
        console.error("Error en eliminación masiva de documentos de curso:", error);
      }
    }
  };

  if (!isOpen) return null;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-800';
      case 'Inactivo':
        return 'bg-red-100 text-red-800';
      case 'Suspendido':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto scrollbar-hide animate-slideInUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
                <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center overflow-hidden">
                  {!imageError && imageUrl ? (
                    <img 
                      src={imageUrl}
                      alt="Foto de perfil"
                      className="h-full w-full rounded-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>
                {/* Botones de imagen en hover */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <label 
                      htmlFor="image-upload" 
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors"
                      title="Subir imagen"
                    >
                      <Upload className="h-4 w-4 text-white" />
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    {!imageError && imageUrl && (
                      <button
                        onClick={handleRemoveImage}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors disabled:opacity-50"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>
                {/* Indicador de carga */}
                {(isUploading || isDeleting) && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  {standardizeName(`${personal.nombre || 'Sin nombre'} ${personal.apellido || 'Sin apellido'}`)}
                </h2>
                <p className="text-blue-100 text-xl">
                  {personal.cargo || 'Sin cargo especificado'}
                </p>
                {(() => {
                  const zonaLabel = displayValue(personal.zona_geografica, personal.rut);
                  if (zonaLabel && zonaLabel !== 'No asignada') {
                    return <p className="text-blue-200 text-sm">{zonaLabel}</p>;
                  }
                  return null;
                })()}
                
                <p className="text-blue-200 text-sm">RUT: {formatRUT(personal.rut)}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {/* Botón para ver Asignaciones (solo lectura) */}
              <button
                onClick={() => setShowAsignaciones((v) => !v)}
                className={`text-white transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20 ${showAsignaciones ? 'bg-white bg-opacity-20' : ''}`}
                title="Ver asignaciones"
              >
                Asignaciones
              </button>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isLoading}
                    className="text-white hover:text-green-200 transition-colores p-2 rounded-full hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
                  >
                    {updateMutation.isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <Save className="h-6 w-6" />
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={updateMutation.isLoading}
                    className="text-white hover:text-red-200 transition-colores p-2 rounded-full hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-white hover:text-blue-200 transition-colores p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <Edit className="h-6 w-6" />
                </button>
              )}
              <button
                onClick={onClose}
                    className="text-white hover:text-blue-200 transition-colores p-2 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
            <div className="mt-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${personal.activo ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              <Activity className="h-4 w-4 mr-2" />
              {personal.estado_nombre}
            </span>
            {/* Profesión / Área / Supervisor / Tipo de asistencia */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <span className="text-white text-base opacity-90 font-medium">Profesión:</span>
                <span className="text-white font-semibold text-lg drop-shadow-sm">{displayValue(personal.profesion, personal.rut)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-base opacity-90 font-medium">Área:</span>
                <span className="text-white font-semibold text-lg drop-shadow-sm text-right">{displayValue(personal.area, personal.rut)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-base opacity-90 font-medium">Supervisor:</span>
                <span className="text-white font-semibold text-lg drop-shadow-sm text-right">{displayValue(personal.supervisor, personal.rut)}</span>
              </div>
              {/* Tipo de asistencia eliminado por petición del usuario */}
            </div>

            {/* Asignaciones (Carteras/Clientes/Nodos) eliminadas de la vista por petición */}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna 1: Información Personal */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Información Personal
                </h3>
                <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:space-x-4">
                      <div className="flex-1">
                        <span className="text-gray-600 font-medium">Nombre</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.nombre || personal.nombre || ''}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                          />
                        ) : (
                          <div className="text-gray-900 mt-1">{personal.nombre}</div>
                        )}
                        {errors.nombre && (<p className="text-xs text-red-600">{errors.nombre}</p>)}
                      </div>
                      <div className="flex-1 mt-3 md:mt-0">
                        <span className="text-gray-600 font-medium">Apellido</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.apellido || personal.apellido || ''}
                            onChange={(e) => handleInputChange('apellido', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                          />
                        ) : (
                          <div className="text-gray-900 mt-1">{personal.apellido}</div>
                        )}
                        {errors.apellido && (<p className="text-xs text-red-600">{errors.apellido}</p>)}
                      </div>
                    </div>

                    <div className="mt-3" />

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Sexo:</span>
                      {isEditing ? (
                        <select
                          value={editData.sexo || 'M'}
                          onChange={(e) => handleInputChange('sexo', e.target.value as 'M' | 'F')}
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      ) : (
                        <span className="text-gray-900">{personal.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                      )}
                    </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Fecha de Nacimiento:</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editData.fecha_nacimiento || personal.fecha_nacimiento.split('T')[0]}
                        onChange={(e) => { handleInputChange('fecha_nacimiento', e.target.value); const newAge = getAge(e.target.value).toString(); handleInputChange('edad', newAge); }}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-900">{formatDate(personal.fecha_nacimiento)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Edad:</span>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editData.edad || getAge(personal.fecha_nacimiento).toString()}
                          readOnly
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 cursor-not-allowed"
                          min="0"
                          max="120"
                        />
                        <span className="text-gray-500 text-sm">años</span>
                      </div>
                    ) : (
                      <span className="text-gray-900">{getAge(personal.fecha_nacimiento)} años</span>
                    )}
                  </div>
                  {/* Contacto directo (teléfono / email) */}
                  <div className="mt-3 border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Contacto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-600 font-medium">Teléfono</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={(editData as any).telefono || personal.telefono || ''}
                            onChange={(e) => handleInputChange('telefono', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                          />
                        ) : (
                          <div className="text-gray-900 mt-1">{personal.telefono || 'Sin teléfono'}</div>
                        )}
                        {errors.telefono && (<p className="text-xs text-red-600 mt-1">{errors.telefono}</p>)}
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Email</span>
                        {isEditing ? (
                          <input
                            type="email"
                            value={(editData as any).email || personal.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                          />
                        ) : (
                          <div className="text-gray-900 mt-1">{personal.email || 'Sin email'}</div>
                        )}
                        {errors.email && (<p className="text-xs text-red-600 mt-1">{errors.email}</p>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Ubicación
                </h3>
                <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Región:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={(editData as any).ubicacion?.region || personal.ubicacion?.region || ''}
                              onChange={(e) => {
                                const prev = (editData as any).ubicacion || {};
                                handleInputChange('ubicacion', { ...prev, region: e.target.value });
                              }}
                              className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Región"
                            />
                          ) : (
                            <span className="text-gray-900">{displayValue(personal.ubicacion?.region, personal.rut)}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Ciudad:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={(editData as any).ubicacion?.ciudad || personal.ubicacion?.ciudad || ''}
                              onChange={(e) => {
                                const prev = (editData as any).ubicacion || {};
                                handleInputChange('ubicacion', { ...prev, ciudad: e.target.value });
                              }}
                              className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ciudad"
                            />
                          ) : (
                            <span className="text-gray-900">{displayValue(personal.ubicacion?.ciudad, personal.rut)}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Comuna:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={(editData as any).ubicacion?.comuna || personal.ubicacion?.comuna || ''}
                              onChange={(e) => {
                                const prev = (editData as any).ubicacion || {};
                                handleInputChange('ubicacion', { ...prev, comuna: e.target.value });
                              }}
                              className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Comuna"
                            />
                          ) : (
                            <span className="text-gray-900">{displayValue(personal.ubicacion?.comuna, personal.rut)}</span>
                          )}
                        </div>
                      </div>
                </div>
              </div>

              {/* Licencias y Certificaciones */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2 text-purple-600" />
                  Licencias y Certificaciones
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Licencia de Conducir:</span>
                    {isEditing ? (
                      <select
                        value={editData.licencia_conducir || ''}
                        onChange={(e) => handleInputChange('licencia_conducir', e.target.value)}
                        className={`px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.licencia_conducir ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Seleccione una clase</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="A4">A4</option>
                        <option value="A5">A5</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                      </select>
                    ) : (
                      <span className="text-gray-900 font-semibold">{displayValue(personal.licencia_conducir, personal.rut)}</span>
                    )}
                  </div>
                  {errors.licencia_conducir && (
                    <p className="text-xs text-red-600">{errors.licencia_conducir}</p>
                  )}
                </div>
              </div>

              {/* Tallas de Vestuario */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShirtIcon className="h-5 w-5 mr-2 text-orange-600" />
                  Tallas de Vestuario
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Talla de Zapatos:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.talla_zapatos || ''}
                        onChange={(e) => handleInputChange('talla_zapatos', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: 42, 38"
                      />
                    ) : (
                      <span className="text-gray-900 font-semibold">{displayValue(personal.talla_zapatos, personal.rut)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Talla de Pantalones:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.talla_pantalon || ''}
                        onChange={(e) => handleInputChange('talla_pantalon', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: M, 32, L"
                      />
                    ) : (
                      <span className="text-gray-900 font-semibold">{displayValue(personal.talla_pantalon, personal.rut)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Talla de Poleras:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.talla_poleras || ''}
                        onChange={(e) => handleInputChange('talla_poleras', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: S, M, L, XL"
                      />
                    ) : (
                      <span className="text-gray-900 font-semibold">{displayValue(personal.talla_poleras, personal.rut)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del Sistema */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  Estado del Personal
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Estado:</span>
                    {isEditing ? (
                      <select
                        value={editData.estado_id || personal.estado_id}
                        onChange={(e) => handleInputChange('estado_id', parseInt(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={estadosLoading}
                      >
                        {estadosLoading ? (
                          <option>Cargando...</option>
                        ) : (
                          estadosData?.data?.map((estado: any) => (
                            <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                          )))
                        }
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${personal.activo ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                        <Activity className="h-4 w-4 mr-2" />
                        {getEstadoNombreById(currentEstadoId)}
                      </span>
                    )}
                  </div>
                  {personal.created_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Fecha de Registro:</span>
                      <span className="text-gray-900 text-sm">
                        {new Date(personal.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {personal.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Última Actualización:</span>
                      <span className="text-gray-900 text-sm">
                        {new Date(personal.updated_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comentarios del Estado */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Comentarios del Estado</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editData.comentario_estado || ''}
                      onChange={(e) => handleInputChange('comentario_estado', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm leading-relaxed resize-none ${errors.comentario_estado ? 'border-red-500 focus:border-red-500' : 'border-blue-300 focus:border-blue-500'}`}
                      rows={4}
                      placeholder="Escriba comentarios adicionales sobre el estado del personal..."
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-600">{editData.comentario_estado?.length || 0} caracteres</span>
                      <span className="text-xs text-blue-600">Máximo permitido: 1000 caracteres</span>
                    </div>
                    {errors.comentario_estado && (<p className="text-xs text-red-600 mt-1">{errors.comentario_estado}</p>)}
                  </div>
                ) : (
                  <div>
                    {personal.comentario_estado ? (
                      <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">{personal.comentario_estado}</p>
                    ) : (
                      <p className="text-blue-600 text-sm italic">Sin comentarios adicionales</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Cursos y Documentación */}
            <div className="space-y-4">
              {/* Cursos y Certificaciones */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-900">Cursos y Certificados</h3>
                    <span className="ml-2 bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">{courseDocuments.length} documento{courseDocuments.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button onClick={handleAddCurso} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center" title="Agregar curso">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </button>
                </div>

                
                {isLoadingDocumentos ? (
                  <div className="flex justify-center py-4"><LoadingSpinner /></div>
                ) : courseDocuments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={courseDocuments.every((d: any) => selectedDocs.has(d.id)) && courseDocuments.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedDocs(prev => {
                              const next = new Set(prev);
                              courseDocuments.forEach((d: any) => next.add(d.id));
                              return next;
                            });
                            else setSelectedDocs(prev => {
                              const next = new Set(prev);
                              courseDocuments.forEach((d: any) => next.delete(d.id));
                              return next;
                            });
                          }}
                        />
                        <button
                          onClick={() => handleBulkDelete(courseDocuments.map((d: any) => d.id))}
                          disabled={!Array.from(selectedDocs).some(id => courseDocuments.find((d: any) => d.id === id))}
                          className="px-3 py-1 bg-red-500 text-white rounded-md text-sm disabled:opacity-50"
                        >
                          Eliminar seleccionados
                        </button>
                        <button onClick={() => { courseDocuments.forEach((d: any) => toggleExpandDocument(d.id)); }} className="px-3 py-1 bg-gray-100 rounded-md text-sm">Alternar detalle</button>
                      </div>
                      <div className="text-sm text-purple-600">{courseDocuments.length} documento{courseDocuments.length !== 1 ? 's' : ''}</div>
                    </div>
                    {courseDocuments.map((documento: any) => {
                      const isSelected = selectedDocs.has(documento.id);
                      const isExpanded = expandedDocs.has(documento.id);
                      return (
                        <div key={documento.id} className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow flex items-start gap-4">
                          <div className="flex-shrink-0 pt-1">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectDocument(documento.id)} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getDocumentIcon(documento.tipo_documento)}</span>
                                <div>
                                  <h4 className="font-semibold text-purple-900 text-lg leading-snug">{documento.nombre_documento}</h4>
                                  <div className="text-sm text-gray-600 mt-1">{truncateFilename(documento.nombre_original || documento.nombre_archivo || documento.nombre_documento, isExpanded ? 400 : 80)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`ml-2 text-sm px-3 py-1 rounded-full border ${getDocumentColor(documento.tipo_documento)}`}>{documento.tipo_documento}</span>
                                <div className="mt-2 text-xs text-gray-500">{new Date(documento.fecha_subida).toLocaleDateString('es-CL')}</div>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="mt-3 text-xs text-gray-700">
                                <p><strong>Archivo:</strong> {documento.nombre_original || documento.nombre_archivo || '—'}</p>
                                {documento.ruta_archivo && <p><strong>Ubicación:</strong> {documento.ruta_archivo}</p>}
                                {documento.fecha_vencimiento && <p><strong>Vencimiento:</strong> {new Date(documento.fecha_vencimiento).toLocaleDateString('es-CL')}</p>}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <button onClick={() => handleDownloadDocument(documento)} disabled={downloadDocumentoMutation.isLoading} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colores disabled:opacity-50 disabled:cursor-not-allowed" title="Descargar documento">
                              {downloadDocumentoMutation.isLoading ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>) : (<Download className="h-5 w-5" />)}
                            </button>
                            <button onClick={() => handleEditDocumento(documento)} className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colores" title="Editar documento"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => handleDeleteDocumento(documento)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colores" title="Eliminar documento"><Trash2 className="h-5 w-5" /></button>
                            <button onClick={() => toggleExpandDocument(documento.id)} className="text-gray-400 hover:text-gray-600 text-xs">{isExpanded ? 'Cerrar' : 'Ver más'}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                    <h4 className="text-purple-700 font-medium mb-2">Sin documentos de cursos</h4>
                    <p className="text-purple-600 text-sm mb-4">{personal.nombre || 'Sin nombre'} {personal.apellido || 'Sin apellido'} no tiene documentos de cursos o certificaciones</p>
                    <div className="flex justify-center">
                      <button onClick={handleAddCurso} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colores">
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar curso
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Documentación Personal */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-900">Documentación Personal</h3>
                    <span className="ml-2 bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">{personalDocuments.length} documento{personalDocuments.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button onClick={handleAddDocument} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colores flex items-center" title="Agregar documento">
                    <Upload className="h-4 w-4 mr-1" />
                    Subir
                  </button>
                </div>

                
                {isLoadingDocumentos ? (
                  <div className="flex justify-center py-4"><LoadingSpinner /></div>
                ) : personalDocuments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={personalDocuments.every((d: any) => selectedDocs.has(d.id)) && personalDocuments.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedDocs(prev => {
                              const next = new Set(prev);
                              personalDocuments.forEach((d: any) => next.add(d.id));
                              return next;
                            });
                            else setSelectedDocs(prev => {
                              const next = new Set(prev);
                              personalDocuments.forEach((d: any) => next.delete(d.id));
                              return next;
                            });
                          }}
                        />
                        <button
                          onClick={() => handleBulkDelete(personalDocuments.map((d: any) => d.id))}
                          disabled={!Array.from(selectedDocs).some(id => personalDocuments.find((d: any) => d.id === id))}
                          className="px-3 py-1 bg-red-500 text-white rounded-md text-sm disabled:opacity-50"
                        >
                          Eliminar seleccionados
                        </button>
                        <button onClick={() => { personalDocuments.forEach((d: any) => toggleExpandDocument(d.id)); }} className="px-3 py-1 bg-gray-100 rounded-md text-sm">Alternar detalle</button>
                      </div>
                      <div className="text-sm text-orange-600">{personalDocuments.length} documento{personalDocuments.length !== 1 ? 's' : ''}</div>
                    </div>
                    {personalDocuments.map((documento: any) => {
                      const isSelected = selectedDocs.has(documento.id);
                      const isExpanded = expandedDocs.has(documento.id);
                      return (
                        <div key={documento.id} className="bg-white rounded-lg border border-orange-200 p-4 hover:shadow-md transition-shadow flex items-start gap-4">
                          <div className="flex-shrink-0 pt-1">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectDocument(documento.id)} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getDocumentIcon(documento.tipo_documento)}</span>
                                <div>
                                  <h4 className="font-semibold text-orange-900 text-lg leading-snug">{documento.nombre_documento}</h4>
                                  <div className="text-sm text-gray-600 mt-1">{truncateFilename(documento.nombre_original || documento.nombre_archivo || documento.nombre_documento, isExpanded ? 400 : 80)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`ml-2 text-sm px-3 py-1 rounded-full border ${getDocumentColor(documento.tipo_documento)}`}>{documento.tipo_documento}</span>
                                <div className="mt-2 text-xs text-gray-500">{new Date(documento.fecha_subida).toLocaleDateString('es-CL')}</div>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="mt-3 text-xs text-gray-700">
                                <p><strong>Archivo:</strong> {documento.nombre_original || documento.nombre_archivo || '—'}</p>
                                {documento.ruta_archivo && <p><strong>Ubicación:</strong> {documento.ruta_archivo}</p>}
                                {documento.fecha_vencimiento && <p><strong>Vencimiento:</strong> {new Date(documento.fecha_vencimiento).toLocaleDateString('es-CL')}</p>}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <button onClick={() => handleDownloadDocument(documento)} className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colores disabled:opacity-50 disabled:cursor-not-allowed" title="Descargar documento" disabled={downloadDocumentoMutation.isLoading}>
                              {downloadDocumentoMutation.isLoading ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>) : (<Download className="h-5 w-5" />)}
                            </button>
                            <button onClick={() => handleEditDocumento(documento)} className="text-orange-500 hover:text-orange-700 p-1 rounded hover:bg-orange-50 transition-colores" title="Editar documento"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => handleDeleteDocumento(documento)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colores" title="Eliminar documento"><Trash2 className="h-5 w-5" /></button>
                            <button onClick={() => toggleExpandDocument(documento.id)} className="text-gray-400 hover:text-gray-600 text-xs">{isExpanded ? 'Cerrar' : 'Ver más'}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                    <h4 className="text-orange-700 font-medium mb-2">Sin documentos personales</h4>
                    <p className="text-orange-600 text-sm mb-4">{personal.nombre || 'Sin nombre'} {personal.apellido || 'Sin apellido'} no tiene documentos personales subidos</p>
                    <button onClick={handleAddDocument} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colores">
                      <Upload className="h-4 w-4 mr-1 inline" />
                      Subir primer documento
                    </button>
                  </div>
                )}
              </div>

              {/* Contacto de Emergencia editable */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contacto de Emergencia</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600">Nombre</label>
                        <input type="text" value={(editData as any).contacto_emergencia?.nombre || personal.contacto_emergencia?.nombre || ''} onChange={(e) => {
                          const prev = (editData as any).contacto_emergencia || {};
                          handleInputChange('contacto_emergencia', { ...prev, nombre: e.target.value });
                        }} className="w-full px-2 py-1 border border-gray-300 rounded mt-1" />
                        {errors['contacto_emergencia.nombre'] && (<p className="text-xs text-red-600 mt-1">{errors['contacto_emergencia.nombre']}</p>)}
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Relación</label>
                        <input type="text" value={(editData as any).contacto_emergencia?.relacion || personal.contacto_emergencia?.relacion || ''} onChange={(e) => {
                          const prev = (editData as any).contacto_emergencia || {};
                          handleInputChange('contacto_emergencia', { ...prev, relacion: e.target.value });
                        }} className="w-full px-2 py-1 border border-gray-300 rounded mt-1" />
                        {errors['contacto_emergencia.relacion'] && (<p className="text-xs text-red-600 mt-1">{errors['contacto_emergencia.relacion']}</p>)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-600">Teléfono</label>
                        <input type="text" value={(editData as any).contacto_emergencia?.telefono || personal.contacto_emergencia?.telefono || ''} onChange={(e) => {
                          const prev = (editData as any).contacto_emergencia || {};
                          handleInputChange('contacto_emergencia', { ...prev, telefono: e.target.value });
                        }} className="w-full px-2 py-1 border border-gray-300 rounded mt-1" />
                        {errors['contacto_emergencia.telefono'] && (<p className="text-xs text-red-600 mt-1">{errors['contacto_emergencia.telefono']}</p>)}
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <input type="email" value={(editData as any).contacto_emergencia?.email || personal.contacto_emergencia?.email || ''} onChange={(e) => {
                          const prev = (editData as any).contacto_emergencia || {};
                          handleInputChange('contacto_emergencia', { ...prev, email: e.target.value });
                        }} className="w-full px-2 py-1 border border-gray-300 rounded mt-1" />
                        {errors['contacto_emergencia.email'] && (<p className="text-xs text-red-600 mt-1">{errors['contacto_emergencia.email']}</p>)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {personal.contacto_emergencia ? (
                      <div className="text-sm text-gray-700">
                        <div><strong>{personal.contacto_emergencia.nombre}</strong> ({personal.contacto_emergencia.relacion})</div>
                        <div className="text-gray-600">{personal.contacto_emergencia.telefono}</div>
                        {personal.contacto_emergencia.email && <div className="text-gray-600">{personal.contacto_emergencia.email}</div>}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Sin contacto de emergencia registrado</div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">RUT:</span> {personal.rut}
            </div>
            <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colores font-medium">Cerrar</button>
          </div>
        </div>
      </div>

      {/* Modal de Cursos */}
      <CursoModal
        isOpen={showCursoModal}
        onClose={handleCursoModalClose}
        onSuccess={handleCursoSuccess}
        curso={editingCurso}
        rutPersona={personal?.rut || ''}
        nombrePersona={`${personal?.nombre || 'Sin nombre'} ${personal?.apellido || 'Sin apellido'}`.trim()}
        personalId={personal?.id || ''}
      />

      {/* Modal de Documentos (Nuevo SubirDocumentoModal) */}
      <SubirDocumentoModal
        isOpen={showDocumentModal}
        onClose={handleDocumentModalClose}
        onSuccess={handleDocumentSuccess}
        rutPersona={personal?.rut || ''}
        nombrePersona={`${personal?.nombre || 'Sin nombre'} ${personal?.apellido || 'Sin apellido'}`.trim()}
      />

      {/* Modal de Documentos de Cursos */}
      <CourseDocumentModal
        isOpen={showCourseDocumentModal}
        onClose={handleCourseDocumentModalClose}
        onSuccess={handleCourseDocumentSuccess}
        rutPersona={personal?.rut || ''}
        nombrePersona={`${personal?.nombre || 'Sin nombre'} ${personal?.apellido || 'Sin apellido'}`.trim()}
        personalId={personal?.id || ''}
        cursoNombre={selectedCurso?.nombre_curso}
      />

      {/* Modal de Edición de Documentos */}
      <EditDocumentModal
        isOpen={showEditDocumentModal}
        onClose={handleEditDocumentModalClose}
        onSuccess={handleEditDocumentSuccess}
        documento={editingDocumento}
        personalId={personal?.id || ''}
      />

    </div>
  );
};

export default PersonalDetailModal;