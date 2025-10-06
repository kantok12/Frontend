/* eslint-disable no-console */
import React, { useState, useEffect } from 'react';
import { Personal, UpdatePersonalData } from '../../types';
import { useUpdatePersonal } from '../../hooks/usePersonal';
import { useUpdatePersonalData } from '../../hooks/useNombres';
import { useEstados } from '../../hooks/useEstados';
import { useCursosByRut, useDeleteCurso } from '../../hooks/useCursos';
import { useDocumentosByPersona, useDownloadDocumento, useDeleteDocumento } from '../../hooks/useDocumentos';
import { useProfileImage } from '../../hooks/useProfileImage';
import { X, User, MapPin, ShirtIcon, Car, Activity, Edit, Save, XCircle, GraduationCap, Plus, Trash2, FileText, Upload, Download } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { CursoModal } from './CursoModal';
import DocumentModal from './DocumentModal';
import CourseDocumentModal from './CourseDocumentModal';

interface PersonalDetailModalProps {
  personal: Personal | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const PersonalDetailModal: React.FC<PersonalDetailModalProps> = ({
  personal,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdatePersonalData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentEstadoId, setCurrentEstadoId] = useState<number>(personal?.estado_id || 1);
  
  const updateMutation = useUpdatePersonal();
  const updatePersonalDataMutation = useUpdatePersonalData();
  const { data: estadosData, isLoading: estadosLoading } = useEstados();
  const { data: cursosData, isLoading: cursosLoading, refetch: refetchCursos } = useCursosByRut(personal?.rut || '');
  
  const deleteCursoMutation = useDeleteCurso();
  const deleteDocumentoMutation = useDeleteDocumento();

  // Estados para modal de cursos
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<any>(null);
  
  // Estados para modal de documentos de cursos
  const [showCourseDocumentModal, setShowCourseDocumentModal] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);

  // Estados para documentación
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  
  // Hook para manejar imagen de perfil
  const { 
    profileImage, 
    loading: profileImageLoading, 
    error: profileImageError, 
    uploadImage, 
    deleteImage, 
    isUploading, 
    isDeleting 
  } = useProfileImage(personal?.rut || '');

  // Mantener sincronizado el estado local cuando cambie la persona seleccionada
  useEffect(() => {
    if (personal?.estado_id !== undefined) {
      setCurrentEstadoId(personal.estado_id);
    }
  }, [personal?.estado_id]);

  // Obtener nombre del estado por id (usando datos de la API)
  const getEstadoNombreById = (id?: number) => {
    if (!id) return personal?.estado_nombre || 'Desconocido';
    const found = estadosData?.data?.find((e: any) => e.id === id);
    return found?.nombre || personal?.estado_nombre || 'Desconocido';
  };
  
  // Usar datos reales del backend en lugar de datos mock
  const { data: documentosData, isLoading: documentosLoading, refetch: refetchDocumentos } = useDocumentosByPersona(personal?.rut || '');
  
  // Filtrar documentos de cursos desde los documentos generales
  const courseDocuments = (documentosData?.data as any)?.documentos?.filter((doc: any) => 
    doc.tipo_documento === 'certificado_curso' || 
    doc.tipo_documento === 'diploma' ||
    doc.tipo_documento === 'certificado_seguridad' ||
    doc.tipo_documento === 'certificado_vencimiento'
  ) || [];
  const downloadMutation = useDownloadDocumento();
  
  // Función utilitaria para descargar archivos
  const downloadFile = async (documentId: number, fileName: string) => {
    try {
      const blob = await downloadMutation.mutateAsync(documentId);
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('❌ Error al descargar archivo:', error);
      throw error;
    }
  };

  // Inicializar datos de edición cuando se abre la modal
  useEffect(() => {
    if (personal && isOpen) {
      setEditData({
        nombre: personal.nombre || '',
        apellido: personal.apellido || '',
        cargo: personal.cargo,
        sexo: personal.sexo,
        licencia_conducir: personal.licencia_conducir,
        talla_zapatos: personal.talla_zapatos,
        talla_pantalones: personal.talla_pantalones,
        talla_poleras: personal.talla_poleras,
        zona_geografica: personal.zona_geografica,
        activo: personal.activo,
        estado_id: personal.estado_id,
        comentario_estado: personal.comentario_estado,
        fecha_nacimiento: personal.fecha_nacimiento.split('T')[0], // Formato para input date
        edad: getAge(personal.fecha_nacimiento).toString(), // Agregar edad calculada
      });
      
      // Los documentos se cargan automáticamente desde el backend
    }
  }, [personal, isOpen]);

  // Si no hay personal o el modal no está abierto, no renderizar nada
  if (!isOpen || !personal) {
    return null;
  }

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar solo si el usuario ha ingresado datos
    if (editData.nombre !== undefined && !editData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (editData.apellido !== undefined && !editData.apellido?.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }
    if (editData.cargo !== undefined && !editData.cargo?.trim()) {
      newErrors.cargo = 'El cargo es requerido';
    }
    if (editData.licencia_conducir !== undefined && !editData.licencia_conducir?.trim()) {
      newErrors.licencia_conducir = 'La licencia es requerida';
    }
    if (editData.zona_geografica !== undefined && !editData.zona_geografica?.trim()) {
      newErrors.zona_geografica = 'La zona geográfica es requerida';
    }
    
    // Validación opcional para comentarios (longitud máxima)
    if (editData.comentario_estado && editData.comentario_estado.length > 1000) {
      newErrors.comentario_estado = 'El comentario no puede exceder 1000 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!personal) return;
    
    if (!validateForm()) {
      return;
    }

    try {
      const promises = [];
      let nombreActualizado = false;

      // 1. Si se cambió el nombre o apellido, actualizar en el servicio de personal-disponible
      if (editData.nombre || editData.apellido) {
        const nombreCompleto = `${editData.nombre || personal.nombre || 'Sin nombre'} ${editData.apellido || personal.apellido || 'Sin apellido'}`;
        
        const personalUpdateData = {
          sexo: editData.sexo || personal.sexo,
          fecha_nacimiento: personal.fecha_nacimiento,
          licencia_conducir: editData.licencia_conducir || personal.licencia_conducir,
          cargo: editData.cargo || personal.cargo,
          estado_id: editData.estado_id !== undefined ? editData.estado_id : personal.estado_id,
          talla_zapatos: editData.talla_zapatos || personal.talla_zapatos || '',
          talla_pantalones: editData.talla_pantalones || personal.talla_pantalones || '',
          talla_poleras: editData.talla_poleras || personal.talla_poleras || '',
          zona_geografica: editData.zona_geografica || personal.zona_geografica || '',
          comentario_estado: editData.comentario_estado !== undefined ? editData.comentario_estado : personal.comentario_estado || '',
          nombre: nombreCompleto
        };

        promises.push(
          updatePersonalDataMutation.mutateAsync({
            rut: personal.rut,
            data: personalUpdateData
          })
        );
        nombreActualizado = true;
      }

      // 2. Actualizar en el servicio principal
      // Combinar nombre y apellido en un solo campo 'nombres'
      const nombreCompleto = `${editData.nombre || personal.nombre || ''} ${editData.apellido || personal.apellido || ''}`.trim();
      
      // Solo enviar campos que sabemos que existen en la tabla personal_disponible
      const updateData = {
        nombres: nombreCompleto, // Usar 'nombres' directamente como en el backend
        sexo: editData.sexo || personal.sexo,
        licencia_conducir: editData.licencia_conducir || personal.licencia_conducir,
        cargo: editData.cargo || personal.cargo,
        estado_id: editData.estado_id !== undefined ? editData.estado_id : personal.estado_id,
        // Campo requerido por el backend
        fecha_nacimiento: editData.fecha_nacimiento || personal.fecha_nacimiento || '1990-01-01', // Valor por defecto
        // Campos adicionales editables (SOLO los que existen en la BD)
        talla_zapatos: editData.talla_zapatos || personal.talla_zapatos || '',
        talla_pantalones: editData.talla_pantalones || personal.talla_pantalones || '',
        talla_poleras: editData.talla_poleras || personal.talla_poleras || '',
        zona_geografica: editData.zona_geografica || personal.zona_geografica || '',
        comentario_estado: editData.comentario_estado !== undefined ? editData.comentario_estado : personal.comentario_estado || '',
      };

      // Log detallado de los datos que se van a enviar
      console.log('🔍 Datos que se van a enviar al endpoint principal:', JSON.stringify({
        id: personal.rut,
        data: updateData
      }, null, 2));
      console.log('🔍 Datos originales del personal:', JSON.stringify(personal, null, 2));
      console.log('🔍 Datos editados:', JSON.stringify(editData, null, 2));

      promises.push(
        updateMutation.mutateAsync({
          id: personal.rut, // Usar RUT como ID
          data: updateData
        })
      );

      // 3. Ejecutar todas las actualizaciones
      await Promise.all(promises);

      // Si se cambió el estado, actualizar la vista inmediatamente
      const newEstadoId = editData.estado_id !== undefined ? editData.estado_id : personal.estado_id;
      if (newEstadoId !== undefined) {
        setCurrentEstadoId(newEstadoId);
      }

      setIsEditing(false);
      onUpdate?.(); // Refrescar datos
      
      // Mensaje de éxito personalizado
      const mensaje = nombreActualizado 
        ? 'Personal actualizado exitosamente (incluyendo nombre en ambos sistemas)'
        : 'Personal actualizado exitosamente';
      alert(mensaje);
      
    } catch (error: any) {
      console.error('Error al actualizar:', error);
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 400) {
        setErrors({ 
          general: 'Datos inválidos. Verifique que todos los campos estén correctamente completados.' 
        });
      } else if (error.response?.status === 404) {
        setErrors({ 
          general: 'Personal no encontrado. Por favor, recargue la página e intente nuevamente.' 
        });
      } else if (error.response?.status === 500) {
        setErrors({ 
          general: 'Error interno del servidor. Por favor, intente nuevamente más tarde.' 
        });
      } else {
        setErrors({ 
          general: 'Error al actualizar el personal. Verifique los datos ingresados.' 
        });
      }
    }
  };

  const handleCancel = () => {
    if (!personal) return;
    
    // Restaurar datos originales
    setEditData({
      nombre: personal.nombre || '',
      apellido: personal.apellido || '',
      cargo: personal.cargo,
      sexo: personal.sexo,
      licencia_conducir: personal.licencia_conducir,
      talla_zapatos: personal.talla_zapatos,
      talla_pantalones: personal.talla_pantalones,
      talla_poleras: personal.talla_poleras,
      zona_geografica: personal.zona_geografica,
      activo: personal.activo,
      estado_id: personal.estado_id,
      comentario_estado: personal.comentario_estado,
    });
    setIsEditing(false);
    setErrors({});
  };

  // Funciones para manejar cursos
  const handleAddCurso = () => {
    setEditingCurso(null);
    setShowCursoModal(true);
  };

  const handleEditCurso = (curso: any) => {
    setEditingCurso(curso);
    setShowCursoModal(true);
  };

  const handleDeleteCurso = async (curso: any) => {
    if (window.confirm(`¿Está seguro que desea eliminar el curso "${curso.nombre_curso}"?`)) {
      try {
        await deleteCursoMutation.mutateAsync(curso.id);
        refetchCursos();
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Error al eliminar curso:', error);
        
        // Manejar diferentes tipos de errores
        if (error.response?.status === 404) {
          // El curso ya no existe, actualizar la lista
          alert('El curso ya fue eliminado. Actualizando la lista...');
          refetchCursos();
        } else if (error.response?.status === 400) {
          alert('No se puede eliminar este curso. Verifique los datos.');
        } else {
          alert('Error al eliminar el curso. Intente nuevamente.');
        }
      }
    }
  };

  const handleCursoModalClose = () => {
    setShowCursoModal(false);
    setEditingCurso(null);
  };

  const handleCursoSuccess = () => {
    refetchCursos();
  };

  // Funciones para documentos de cursos
  const handleAddCourseDocument = (curso: any) => {
    setSelectedCurso(curso);
    setShowCourseDocumentModal(true);
  };

  const handleCourseDocumentSuccess = (nuevoDocumento: any) => {
    // Refrescar la lista de documentos para mostrar el nuevo documento
    refetchDocumentos();
    alert(`Documento "${nuevoDocumento.nombre_documento}" subido exitosamente`);
    
    // Refrescar la lista de cursos para mostrar la información actualizada
    refetchCursos();
  };

  const handleCourseDocumentModalClose = () => {
    setShowCourseDocumentModal(false);
    setSelectedCurso(null);
  };

  // Funciones para manejar documentos de cursos

  const handleDownloadCourseDocument = async (curso: any) => {
    // Buscar documentos relacionados con cursos (certificados, diplomas, etc.)
    const documentosRelacionados = courseDocuments.filter((doc: any) => 
      doc.nombre_documento.toLowerCase().includes(curso.nombre_curso.toLowerCase()) ||
      doc.tipo_documento === 'certificado_curso' ||
      doc.tipo_documento === 'diploma' ||
      doc.tipo_documento === 'certificado_seguridad'
    );
    
    if (documentosRelacionados.length > 0) {
      // Si hay múltiples documentos, usar el primero o mostrar opciones
      const documentoCurso = documentosRelacionados[0];
      
      try {
        const fileName = `${curso.nombre_curso}_${documentoCurso.nombre_original || documentoCurso.nombre_documento}`;
        await downloadFile(documentoCurso.id, fileName);
        
        // eslint-disable-next-line no-console
        console.log('✅ Documento de curso descargado exitosamente:', {
          curso: curso.nombre_curso,
          documento: documentoCurso.nombre_documento,
          archivo: documentoCurso.nombre_original,
          id: documentoCurso.id
        });
      } catch (error) {
        alert(`Error al descargar el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    } else {
      alert(`No hay documentos relacionados con el curso "${curso.nombre_curso}". Primero debe subir un documento de tipo "Certificado de Curso", "Diploma" o "Certificado de Seguridad".`);
    }
  };


  // Funciones para documentación
  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleDocumentSuccess = (nuevoDocumento: any) => {
    // Refrescar la lista de documentos desde el backend
    refetchDocumentos();
  };

  const handleDocumentModalClose = () => {
    setShowDocumentModal(false);
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este documento?')) {
      try {
        await deleteDocumentoMutation.mutateAsync(documentId);
        refetchDocumentos();
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Error al eliminar documento:', error);
        
        // Manejar diferentes tipos de errores
        if (error.response?.status === 404) {
          // El documento ya no existe, actualizar la lista
          alert('El documento ya fue eliminado. Actualizando la lista...');
          refetchDocumentos();
        } else if (error.response?.status === 400) {
          alert('No se puede eliminar este documento. Verifique los datos.');
        } else if (error.response?.status === 500) {
          const errorMessage = error.response?.data?.error || '';
          if (errorMessage.includes('no existe la columna')) {
            alert('Error del servidor: La base de datos necesita ser actualizada. Contacte al administrador del sistema.');
          } else {
            alert('Error del servidor. Por favor, intente nuevamente más tarde.');
          }
        } else {
          alert('Error al eliminar el documento. Intente nuevamente.');
        }
      }
    }
  };

  const handleDownloadDocument = async (documento: any) => {
    if (!documento.id) {
      alert('Error: No se pudo obtener el ID del documento');
      return;
    }

    try {
      const fileName = documento.nombre_original || `${documento.nombre_documento}.pdf`;
      await downloadFile(documento.id, fileName);
      
      // eslint-disable-next-line no-console
      console.log('✅ Documento descargado exitosamente:', {
        documento: documento.nombre_documento,
        archivo: documento.nombre_original,
        id: documento.id
      });
    } catch (error) {
      alert(`Error al descargar el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };


  // Funciones para manejar imagen de perfil
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadImage(file);
      alert('Imagen de perfil actualizada exitosamente');
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert(`Error al subir imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleRemoveImage = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar la imagen de perfil?')) {
      try {
        await deleteImage();
        alert('Imagen de perfil eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar imagen:', error);
        alert(`Error al eliminar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  };

  const getDocumentIcon = (tipo: string) => {
    switch (tipo) {
      case 'contrato': return '📄';
      case 'identidad': return '🆔';
      case 'medico': return '🏥';
      case 'antecedentes': return '📋';
      default: return '📄';
    }
  };

  const getDocumentColor = (tipo: string) => {
    switch (tipo) {
      case 'contrato': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'identidad': return 'bg-green-100 text-green-800 border-green-200';
      case 'medico': return 'bg-red-100 text-red-800 border-red-200';
      case 'antecedentes': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Funciones auxiliares
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!personal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Foto de perfil" 
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isUploading || isDeleting ? (
                      <div className="bg-blue-500 bg-opacity-90 text-white rounded-full p-2">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <label className="bg-blue-500 bg-opacity-90 hover:bg-opacity-100 text-white rounded-full p-2 cursor-pointer transition-all duration-200 shadow-lg">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading || isDeleting}
                        />
                      </label>
                    )}
                  </div>
                )}
                {profileImage && isEditing && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    title="Eliminar imagen"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editData.nombre || ''}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        className={`bg-white bg-opacity-20 text-white placeholder-blue-200 border ${
                          errors.nombre ? 'border-red-300' : 'border-white border-opacity-30'
                        } rounded px-2 py-1 text-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50`}
                        placeholder="Nombre"
                      />
                      <input
                        type="text"
                        value={editData.apellido || ''}
                        onChange={(e) => handleInputChange('apellido', e.target.value)}
                        className={`bg-white bg-opacity-20 text-white placeholder-blue-200 border ${
                          errors.apellido ? 'border-red-300' : 'border-white border-opacity-30'
                        } rounded px-2 py-1 text-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50`}
                        placeholder="Apellido"
                      />
                    </div>
                  ) : (
                    `${personal.nombre || 'Sin nombre'} ${personal.apellido || 'Sin apellido'}`
                  )}
                </h2>
                <p className="text-blue-100 text-lg">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.cargo || ''}
                      onChange={(e) => handleInputChange('cargo', e.target.value)}
                      className={`bg-white bg-opacity-20 text-blue-100 placeholder-blue-200 border ${
                        errors.cargo ? 'border-red-300' : 'border-white border-opacity-30'
                      } rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50`}
                      placeholder="Cargo"
                    />
                  ) : (
                    personal.cargo
                  )}
                </p>
                <p className="text-blue-200 text-sm">RUT: {personal.rut}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isLoading}
                    className="text-white hover:text-green-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
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
                    className="text-white hover:text-red-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <Edit className="h-6 w-6" />
                </button>
              )}
              <button
                onClick={onClose}
                    className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              personal.activo 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <Activity className="h-4 w-4 mr-2" />
              {personal.estado_nombre}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}
          
          {profileImageError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error de imagen de perfil:</strong> {profileImageError}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Columna 1: Información Personal */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Información Personal
                </h3>
                <div className="space-y-3">
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
                      <span className="text-gray-900">
                        {personal.sexo === 'M' ? 'Masculino' : 'Femenino'}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Fecha de Nacimiento:</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editData.fecha_nacimiento || personal.fecha_nacimiento.split('T')[0]}
                        onChange={(e) => {
                          handleInputChange('fecha_nacimiento', e.target.value);
                          // Recalcular edad automáticamente cuando cambie la fecha
                          const newAge = getAge(e.target.value).toString();
                          handleInputChange('edad', newAge);
                        }}
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
                          onChange={(e) => handleInputChange('edad', e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="120"
                        />
                        <span className="text-gray-500 text-sm">años</span>
                      </div>
                    ) : (
                      <span className="text-gray-900">{getAge(personal.fecha_nacimiento)} años</span>
                    )}
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Zona Geográfica:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.zona_geografica || ''}
                        onChange={(e) => handleInputChange('zona_geografica', e.target.value)}
                        className={`px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.zona_geografica ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Zona geográfica"
                      />
                    ) : (
                      <span className="text-gray-900">{personal.zona_geografica}</span>
                    )}
                  </div>
                  {errors.zona_geografica && (
                    <p className="text-xs text-red-600">{errors.zona_geografica}</p>
                  )}
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
                      <input
                        type="text"
                        value={editData.licencia_conducir || ''}
                        onChange={(e) => handleInputChange('licencia_conducir', e.target.value)}
                        className={`px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.licencia_conducir ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ej: B, A1, C"
                      />
                    ) : (
                      <span className="text-gray-900 font-semibold">
                        {personal.licencia_conducir || 'No especificada'}
                      </span>
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
                      <span className="text-gray-900 font-semibold">{personal.talla_zapatos}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Talla de Pantalones:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.talla_pantalones || ''}
                        onChange={(e) => handleInputChange('talla_pantalones', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: M, 32, L"
                      />
                    ) : (
                      <span className="text-gray-900 font-semibold">{personal.talla_pantalones}</span>
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
                      <span className="text-gray-900 font-semibold">{personal.talla_poleras}</span>
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
                            <option key={estado.id} value={estado.id}>
                              {estado.nombre}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        personal.activo 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        <Activity className="h-4 w-4 mr-2" />
                        {getEstadoNombreById(currentEstadoId)}
                      </span>
                    )}
                  </div>
                  {personal.created_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Fecha de Registro:</span>
                      <span className="text-gray-900 text-sm">
                        {new Date(personal.created_at).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )}
                  {personal.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Última Actualización:</span>
                      <span className="text-gray-900 text-sm">
                        {new Date(personal.updated_at).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comentarios del Estado */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Comentarios del Estado
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editData.comentario_estado || ''}
                      onChange={(e) => handleInputChange('comentario_estado', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm leading-relaxed resize-none ${
                        errors.comentario_estado 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-blue-300 focus:border-blue-500'
                      }`}
                      rows={4}
                      placeholder="Escriba comentarios adicionales sobre el estado del personal..."
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-600">
                        {editData.comentario_estado?.length || 0} caracteres
                      </span>
                      <span className="text-xs text-blue-600">
                        Máximo permitido: 1000 caracteres
                      </span>
                    </div>
                    {errors.comentario_estado && (
                      <p className="text-xs text-red-600 mt-1">{errors.comentario_estado}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    {personal.comentario_estado ? (
                      <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {personal.comentario_estado}
                      </p>
                    ) : (
                      <p className="text-blue-600 text-sm italic">
                        Sin comentarios adicionales
                      </p>
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
                    <h3 className="text-lg font-semibold text-purple-900">
                      Cursos y Certificaciones
                    </h3>
                    {cursosData?.data && (cursosData.data as any)?.cursos && (
                      <span className="ml-2 bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {(cursosData.data as any).cursos.length} curso{(cursosData.data as any).cursos.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleAddCurso}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                    title="Agregar curso"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </button>
                </div>

                {/* Estadísticas de Cursos */}
                {cursosData?.data && (cursosData.data as any)?.cursos && (cursosData.data as any).cursos.length > 0 && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-purple-600 font-medium">Total de cursos:</span>
                        <span className="ml-2 text-purple-900 font-semibold">{(cursosData.data as any).cursos.length}</span>
                      </div>
                      <div>
                        <span className="text-purple-600 font-medium">Cursos recientes:</span>
                        <span className="ml-2 text-purple-900 font-semibold">
                          {(cursosData.data as any).cursos.filter((curso: any) => {
                            const diasTranscurridos = Math.floor((new Date().getTime() - new Date(curso.fecha_obtencion).getTime()) / (1000 * 60 * 60 * 24));
                            return diasTranscurridos <= 30;
                          }).length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Cursos */}
                {cursosLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Debug: Log de condición de renderizado */}
                    {(() => {
                      // eslint-disable-next-line no-console
                      console.log('🔍 Renderizando cursos - cursosData:', cursosData);
                      // eslint-disable-next-line no-console
                      console.log('🔍 Renderizando cursos - cursosData?.data:', cursosData?.data);
                      // eslint-disable-next-line no-console
                      console.log('🔍 Renderizando cursos - cursosData?.data?.cursos:', (cursosData?.data as any)?.cursos);
                      // eslint-disable-next-line no-console
                      console.log('🔍 Renderizando cursos - cursosData?.data?.cursos?.length:', (cursosData?.data as any)?.cursos?.length);
                      // eslint-disable-next-line no-console
                      console.log('🔍 Renderizando cursos - Estructura completa de data:', JSON.stringify(cursosData?.data, null, 2));
                      return null;
                    })()}
                    {(cursosData?.data as any)?.cursos && (cursosData?.data as any).cursos.length > 0 ? (
                      (cursosData?.data as any).cursos.map((curso: any) => {
                        // eslint-disable-next-line no-console
                        console.log('🔍 Datos completos del curso:', curso);
                        
                        const fechaObtencion = curso.fecha_obtencion ? new Date(curso.fecha_obtencion) : null;
                        const fechaInicio = curso.fecha_inicio ? new Date(curso.fecha_inicio) : null;
                        const fechaFin = curso.fecha_fin ? new Date(curso.fecha_fin) : null;
                        const fechaVencimiento = curso.fecha_vencimiento ? new Date(curso.fecha_vencimiento) : null;
                        
                        const diasTranscurridos = fechaObtencion ? Math.floor((new Date().getTime() - fechaObtencion.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                        const esReciente = diasTranscurridos <= 30;

                        return (
                          <div key={curso.id} className="bg-white rounded-lg border border-purple-200 p-3 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div 
                                className="flex-1 cursor-pointer" 
                                onClick={() => handleEditCurso(curso)}
                                title="Hacer clic para editar"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-purple-900 text-sm hover:text-purple-700">
                                    {curso.nombre_curso}
                                  </h4>
                                  {esReciente && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      Reciente
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {(() => {
                                    // Buscar documentos relacionados con este curso
                                    const documentosRelacionados = courseDocuments.filter((doc: any) => 
                                      doc.nombre_documento.toLowerCase().includes(curso.nombre_curso.toLowerCase()) ||
                                      doc.tipo_documento === 'certificado_curso' ||
                                      doc.tipo_documento === 'diploma' ||
                                      doc.tipo_documento === 'certificado_seguridad'
                                    );
                                    const documentoCurso = documentosRelacionados.length > 0 ? documentosRelacionados[0] : null;
                                    
                                    if (documentoCurso) {
                                      // Si hay documento, mostrar información del documento
                                      return (
                                        <>
                                          <p className="text-xs text-purple-600">
                                            <span className="font-medium">Documento:</span> {documentoCurso.nombre_documento}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            <span className="font-medium">Subido:</span> {new Date(documentoCurso.fecha_subida).toLocaleDateString('es-CL')}
                                          </p>
                                        </>
                                      );
                                    } else {
                                      // Si no hay documento, mostrar fecha en "Obtenido" y tiempo transcurrido en "Hace"
                                      return (
                                        <>
                                          <p className="text-xs text-purple-600">
                                            <span className="font-medium">Obtenido:</span> {fechaObtencion ? fechaObtencion.toLocaleDateString('es-CL', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            }) : 'Fecha no disponible'}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            <span className="font-medium">Hace:</span> {diasTranscurridos === 0 ? 'Hoy' : 
                                              diasTranscurridos === 1 ? '1 día' : 
                                              diasTranscurridos < 30 ? `${diasTranscurridos} días` :
                                              diasTranscurridos < 365 ? `${Math.floor(diasTranscurridos / 30)} meses` :
                                              `${Math.floor(diasTranscurridos / 365)} años`
                                            }
                                          </p>
                                        </>
                                      );
                                    }
                                  })()}
                                  
                                  {/* Información adicional del curso */}
                                  {curso.institucion && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Institución:</span> {curso.institucion}
                                    </p>
                                  )}
                                  
                                  {curso.estado && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Estado:</span> 
                                      <span className={`ml-1 px-1 py-0.5 rounded text-xs ${
                                        curso.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                        curso.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                                        curso.estado === 'pendiente' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {curso.estado}
                                      </span>
                                    </p>
                                  )}
                                  
                                  {fechaInicio && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Inicio:</span> {fechaInicio.toLocaleDateString('es-CL')}
                                    </p>
                                  )}
                                  
                                  {fechaFin && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Fin:</span> {fechaFin.toLocaleDateString('es-CL')}
                                    </p>
                                  )}
                                  
                                  {fechaVencimiento && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Vencimiento:</span> {fechaVencimiento.toLocaleDateString('es-CL')}
                                    </p>
                                  )}
                                  
                                  {curso.descripcion && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Descripción:</span> {curso.descripcion}
                                    </p>
                                  )}
                                  
                                  {curso.horas_academicas && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Horas:</span> {curso.horas_academicas} hrs
                                    </p>
                                  )}
                                  
                                  {curso.tipo_curso && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Tipo:</span> {curso.tipo_curso}
                                    </p>
                                  )}
                                  
                                  {curso.observaciones && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Observaciones:</span> {curso.observaciones}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1 ml-3">
                                <button
                                  onClick={() => handleEditCurso(curso)}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                                  title="Editar curso"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleAddCourseDocument(curso)}
                                  className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors"
                                  title="Subir documento de curso"
                                >
                                  <Upload className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDownloadCourseDocument(curso)}
                                  className="text-purple-500 hover:text-purple-700 p-1 rounded hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Descargar documento del curso"
                                  disabled={downloadMutation.isLoading}
                                >
                                  {downloadMutation.isLoading ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500"></div>
                                  ) : (
                                    <Download className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteCurso(curso)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                  title="Eliminar curso"
                                  disabled={deleteCursoMutation.isLoading}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <GraduationCap className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                        <h4 className="text-purple-700 font-medium mb-2">Sin cursos registrados</h4>
                        <p className="text-purple-600 text-sm mb-4">
                          {personal.nombre || 'Sin nombre'} {personal.apellido || 'Sin apellido'} no tiene cursos o certificaciones registradas
                        </p>
                        <div className="flex justify-center">
                          <button
                            onClick={handleAddCurso}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Plus className="h-4 w-4 mr-1 inline" />
                            Agregar primer curso
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>


              {/* Documentación Personal */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-900">
                      Documentación Personal
                    </h3>
                    <span className="ml-2 bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {(documentosData?.data as any)?.documentos?.length || 0} documento{((documentosData?.data as any)?.documentos?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={handleAddDocument}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                    title="Agregar documento"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Subir
                  </button>
                </div>

                {/* Estadísticas de Documentos */}
                {(documentosData?.data as any)?.documentos && (documentosData?.data as any).documentos.length > 0 && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-orange-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-orange-600 font-medium">Total documentos:</span>
                        <span className="ml-2 text-orange-900 font-semibold">{(documentosData?.data as any).documentos.length}</span>
                      </div>
                      <div>
                        <span className="text-orange-600 font-medium">Documentos activos:</span>
                        <span className="ml-2 text-orange-900 font-semibold">
                          {(documentosData?.data as any).documentos.filter((doc: any) => doc.activo).length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Documentos */}
                {documentosLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : (documentosData?.data as any)?.documentos && (documentosData?.data as any).documentos.length > 0 ? (
                  <div className="space-y-3">
                    {(documentosData?.data as any).documentos.map((documento: any) => (
                      <div key={documento.id} className="bg-white rounded-lg border border-orange-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">{getDocumentIcon(documento.tipo_documento)}</span>
                                <h4 className="font-semibold text-orange-900 text-sm">
                                  {documento.nombre_documento}
                                </h4>
                                <span className={`ml-2 text-xs px-2 py-1 rounded-full border ${getDocumentColor(documento.tipo_documento)}`}>
                                  {documento.tipo_documento}
                                </span>
                              </div>
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                Activo
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-orange-600">
                                <span className="font-medium">Archivo:</span> {documento.nombre_original}
                              </p>
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Subido:</span> {new Date(documento.fecha_subida).toLocaleDateString('es-CL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1 ml-3">
                            <button
                              onClick={() => handleDownloadDocument(documento)}
                              className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Descargar documento"
                              disabled={downloadMutation.isLoading}
                            >
                              {downloadMutation.isLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(documento.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Eliminar documento"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                    <h4 className="text-orange-700 font-medium mb-2">Sin documentos registrados</h4>
                    <p className="text-orange-600 text-sm mb-4">
                      {personal.nombre || 'Sin nombre'} {personal.apellido || 'Sin apellido'} no tiene documentos subidos
                    </p>
                    <button
                      onClick={handleAddDocument}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-1 inline" />
                      Subir primer documento
                    </button>
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
              <span className="font-medium">RUT:</span> {personal.rut} • 
              <span className="font-medium ml-2">Zona:</span> {personal.zona_geografica}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Cerrar
            </button>
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

      {/* Modal de Documentos */}
      <DocumentModal
        isOpen={showDocumentModal}
        onClose={handleDocumentModalClose}
        onSuccess={handleDocumentSuccess}
        rutPersona={personal?.rut || ''}
        nombrePersona={`${personal?.nombre || 'Sin nombre'} ${personal?.apellido || 'Sin apellido'}`.trim()}
        personalId={personal?.id || ''}
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

    </div>
  );
};

export default PersonalDetailModal;