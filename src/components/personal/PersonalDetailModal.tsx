import React, { useState, useEffect, useCallback } from 'react';
import { Personal, UpdatePersonalData } from '../../types';
import { useUpdatePersonal } from '../../hooks/usePersonal';
import { useUpdatePersonalData } from '../../hooks/useNombres';
import { useEstados } from '../../hooks/useEstados';
import { useCursosByRut, useDeleteCurso } from '../../hooks/useCursos';
import { X, User, MapPin, ShirtIcon, Car, Activity, Edit, Save, XCircle, GraduationCap, Plus, Trash2, FileText, Upload, Download, Eye } from 'lucide-react';
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
  
  const updateMutation = useUpdatePersonal();
  const updatePersonalDataMutation = useUpdatePersonalData();
  const { data: estadosData, isLoading: estadosLoading } = useEstados();
  const { data: cursosData, isLoading: cursosLoading, refetch: refetchCursos } = useCursosByRut(personal?.rut || '');
  const deleteCursoMutation = useDeleteCurso();

  // Estados para modal de cursos
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<any>(null);
  
  // Estados para modal de documentos de cursos
  const [showCourseDocumentModal, setShowCourseDocumentModal] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);
  const [courseDocuments, setCourseDocuments] = useState<any[]>([]);

  // Estados para documentación
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  
  // Solo mostrar datos mock para el primer personal (RUT específico)
  const getDocumentosMock = useCallback(() => {
    if (personal?.rut === '15338132-1') {
      return [
        { id: 1, nombre: 'Contrato de Trabajo', tipo: 'contrato', fecha: '2024-01-15', archivo: 'contrato_juan_perez.pdf', estado: 'vigente' },
        { id: 2, nombre: 'Carnet de Identidad', tipo: 'identidad', fecha: '2024-01-10', archivo: 'carnet_juan_perez.pdf', estado: 'vigente' },
        { id: 3, nombre: 'Examen Preocupacional', tipo: 'medico', fecha: '2024-01-12', archivo: 'examen_preocupacional.pdf', estado: 'vigente' },
        { id: 4, nombre: 'Certificado de Antecedentes', tipo: 'antecedentes', fecha: '2024-01-08', archivo: 'antecedentes_juan_perez.pdf', estado: 'vigente' }
      ];
    }
    return []; // Array vacío para otros personales
  }, [personal?.rut]);
  
  const [documentos, setDocumentos] = useState(getDocumentosMock());

  // Inicializar datos de edición cuando se abre la modal
  useEffect(() => {
    if (personal && isOpen) {
      setEditData({
        nombre: personal.nombre,
        apellido: personal.apellido,
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
      
      // Actualizar documentos mock según el personal
      setDocumentos(getDocumentosMock());
    }
  }, [personal, isOpen, getDocumentosMock]);

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
    
    if (!editData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!editData.apellido?.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }
    if (!editData.cargo?.trim()) {
      newErrors.cargo = 'El cargo es requerido';
    }
    if (!editData.licencia_conducir?.trim()) {
      newErrors.licencia_conducir = 'La licencia es requerida';
    }
    if (!editData.zona_geografica?.trim()) {
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
        const nombreCompleto = `${editData.nombre || personal.nombre} ${editData.apellido || personal.apellido}`;
        
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
          comentario_estado: editData.comentario_estado || personal.comentario_estado || '',
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
      const updateData = {
        nombre: editData.nombre || personal.nombre,
        apellido: editData.apellido || personal.apellido,
        sexo: editData.sexo || personal.sexo,
        licencia_conducir: editData.licencia_conducir || personal.licencia_conducir,
        cargo: editData.cargo || personal.cargo,
        estado_id: editData.estado_id !== undefined ? editData.estado_id : personal.estado_id,
        // Campos adicionales editables (SOLO los que existen en la BD)
        talla_zapatos: editData.talla_zapatos || personal.talla_zapatos || '',
        talla_pantalones: editData.talla_pantalones || personal.talla_pantalones || '',
        talla_poleras: editData.talla_poleras || personal.talla_poleras || '',
        zona_geografica: editData.zona_geografica || personal.zona_geografica || '',
        comentario_estado: editData.comentario_estado || personal.comentario_estado || '',
      };

      promises.push(
        updateMutation.mutateAsync({
          id: personal.rut, // Usar RUT como ID
          data: updateData
        })
      );

      // 3. Ejecutar todas las actualizaciones
      await Promise.all(promises);
      
      setIsEditing(false);
      onUpdate?.(); // Refrescar datos
      
      // Mensaje de éxito personalizado
      const mensaje = nombreActualizado 
        ? 'Personal actualizado exitosamente (incluyendo nombre en ambos sistemas)'
        : 'Personal actualizado exitosamente';
      alert(mensaje);
      
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Error al actualizar:', error);
      setErrors({ general: 'Error al actualizar el personal. Verifique los datos ingresados.' });
    }
  };

  const handleCancel = () => {
    if (!personal) return;
    
    // Restaurar datos originales
    setEditData({
      nombre: personal.nombre,
      apellido: personal.apellido,
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
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error al eliminar curso:', error);
        alert('Error al eliminar el curso');
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
    // Agregar el documento a la lista de documentos de cursos
    setCourseDocuments(prev => [...prev, nuevoDocumento]);
    alert(`Documento "${nuevoDocumento.nombre}" subido exitosamente para el curso "${nuevoDocumento.curso}"`);
    
    // Refrescar la lista de cursos para mostrar la información actualizada
    refetchCursos();
  };

  const handleCourseDocumentModalClose = () => {
    setShowCourseDocumentModal(false);
    setSelectedCurso(null);
  };

  // Funciones para manejar documentos de cursos
  const handleDeleteCourseDocument = (documentId: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este documento de curso?')) {
      setCourseDocuments(prev => prev.filter(doc => doc.id !== documentId));
    }
  };

  const handleDownloadCourseDocument = (curso: any) => {
    // Buscar si existe un documento para este curso
    const documentoCurso = courseDocuments.find(doc => doc.curso === curso.nombre_curso);
    
    if (documentoCurso) {
      // Simular descarga del documento
      // eslint-disable-next-line no-console
      console.log('Descargando documento del curso:', {
        curso: curso.nombre_curso,
        documento: documentoCurso.nombre,
        tipo: documentoCurso.tipo,
        archivo: documentoCurso.archivo
      });
      
      // Crear un enlace de descarga simulado
      const link = document.createElement('a');
      link.href = '#'; // En una implementación real, aquí iría la URL del archivo
      link.download = `${curso.nombre_curso}_${documentoCurso.nombre}`;
      link.click();
      
      alert(`Descargando documento: ${documentoCurso.nombre} del curso ${curso.nombre_curso}`);
    } else {
      alert(`No hay documento disponible para el curso "${curso.nombre_curso}". Primero debe subir un documento.`);
    }
  };

  const handleViewCourseDocument = (documento: any) => {
    // Simular visualización
    // eslint-disable-next-line no-console
    console.log('Visualizando documento de curso:', documento.nombre);
    // Aquí iría la lógica real de visualización
  };

  // Funciones para documentación
  const handleAddDocument = () => {
    setShowDocumentModal(true);
  };

  const handleDocumentSuccess = (nuevoDocumento: any) => {
    setDocumentos(prev => [...prev, nuevoDocumento]);
  };

  const handleDocumentModalClose = () => {
    setShowDocumentModal(false);
  };

  const handleDeleteDocument = (documentId: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este documento?')) {
      setDocumentos(prev => prev.filter(doc => doc.id !== documentId));
    }
  };

  const handleDownloadDocument = (documento: any) => {
    // Simular descarga
    // eslint-disable-next-line no-console
    console.log('Descargando documento:', documento.nombre);
    // Aquí iría la lógica real de descarga
  };

  const handleViewDocument = (documento: any) => {
    // Simular visualización
    // eslint-disable-next-line no-console
    console.log('Visualizando documento:', documento.nombre);
    // Aquí iría la lógica real de visualización
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
              <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
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
                    `${personal.nombre} ${personal.apellido}`
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
                    <span className="text-gray-900">{formatDate(personal.fecha_nacimiento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Edad:</span>
                    <span className="text-gray-900">{getAge(personal.fecha_nacimiento)} años</span>
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
                        {personal.estado_nombre}
                      </span>
                    )}
                  </div>
                  {personal.created_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Fecha de Registro:</span>
                      <span className="text-gray-900 text-sm">
                        {new Date(personal.created_at).toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  {personal.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Última Actualización:</span>
                      <span className="text-gray-900 text-sm">
                        {new Date(personal.updated_at).toLocaleString('es-CL')}
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
                    {cursosData?.data && (
                      <span className="ml-2 bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {cursosData.data.length} curso{cursosData.data.length !== 1 ? 's' : ''}
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
                {cursosData?.data && cursosData.data.length > 0 && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-purple-600 font-medium">Total de cursos:</span>
                        <span className="ml-2 text-purple-900 font-semibold">{cursosData.data.length}</span>
                      </div>
                      <div>
                        <span className="text-purple-600 font-medium">Cursos recientes:</span>
                        <span className="ml-2 text-purple-900 font-semibold">
                          {cursosData.data.filter((curso: any) => {
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
                    {cursosData?.data && cursosData.data.length > 0 ? (
                      cursosData.data.map((curso: any) => {
                        const fechaObtencion = new Date(curso.fecha_obtencion);
                        const diasTranscurridos = Math.floor((new Date().getTime() - fechaObtencion.getTime()) / (1000 * 60 * 60 * 24));
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
                                    // Buscar si existe un documento para este curso
                                    const documentoCurso = courseDocuments.find(doc => doc.curso === curso.nombre_curso);
                                    
                                    if (documentoCurso) {
                                      // Si hay documento, mostrar tipo de documento en "Obtenido" y fecha en "Hace"
                                      return (
                                        <>
                                          <p className="text-xs text-purple-600">
                                            <span className="font-medium">Obtenido:</span> {documentoCurso.tipo}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            <span className="font-medium">Hace:</span> {fechaObtencion.toLocaleDateString('es-CL', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            })}
                                          </p>
                                        </>
                                      );
                                    } else {
                                      // Si no hay documento, mostrar fecha en "Obtenido" y tiempo transcurrido en "Hace"
                                      return (
                                        <>
                                          <p className="text-xs text-purple-600">
                                            <span className="font-medium">Obtenido:</span> {fechaObtencion.toLocaleDateString('es-CL', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            })}
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
                                  className="text-purple-500 hover:text-purple-700 p-1 rounded hover:bg-purple-50 transition-colors"
                                  title="Descargar documento del curso"
                                >
                                  <Download className="h-3 w-3" />
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
                          {personal.nombre} {personal.apellido} no tiene cursos o certificaciones registradas
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

              {/* Documentos de Cursos */}
              {courseDocuments.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center mb-4">
                    <Upload className="h-5 w-5 mr-2 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Documentos de Cursos
                    </h3>
                    <span className="ml-2 bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                      {courseDocuments.length} documento{courseDocuments.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Lista de Documentos de Cursos */}
                  <div className="space-y-3">
                    {courseDocuments.map((documento) => (
                      <div key={documento.id} className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <FileText className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-900 truncate">
                                {documento.nombre}
                              </p>
                              <p className="text-xs text-green-600">
                                <span className="font-medium">Curso:</span> {documento.curso} • 
                                <span className="font-medium ml-1">Tipo:</span> {documento.tipo} • 
                                <span className="font-medium ml-1">Fecha:</span> {documento.fecha}
                              </p>
                              <p className="text-xs text-gray-500">
                                {documento.archivo}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleViewCourseDocument(documento)}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Ver documento"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadCourseDocument(documento)}
                              className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Descargar documento"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourseDocument(documento.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Eliminar documento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentación Personal */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-900">
                      Documentación Personal
                    </h3>
                    <span className="ml-2 bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
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
                {documentos.length > 0 && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-orange-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-orange-600 font-medium">Total documentos:</span>
                        <span className="ml-2 text-orange-900 font-semibold">{documentos.length}</span>
                      </div>
                      <div>
                        <span className="text-orange-600 font-medium">Documentos vigentes:</span>
                        <span className="ml-2 text-orange-900 font-semibold">
                          {documentos.filter(doc => doc.estado === 'vigente').length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Documentos */}
                {documentos.length > 0 ? (
                  <div className="space-y-3">
                    {documentos.map((documento) => (
                      <div key={documento.id} className="bg-white rounded-lg border border-orange-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">{getDocumentIcon(documento.tipo)}</span>
                                <h4 className="font-semibold text-orange-900 text-sm">
                                  {documento.nombre}
                                </h4>
                                <span className={`ml-2 text-xs px-2 py-1 rounded-full border ${getDocumentColor(documento.tipo)}`}>
                                  {documento.tipo}
                                </span>
                              </div>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {documento.estado}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-orange-600">
                                <span className="font-medium">Archivo:</span> {documento.archivo}
                              </p>
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Subido:</span> {new Date(documento.fecha).toLocaleDateString('es-CL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1 ml-3">
                            <button
                              onClick={() => handleViewDocument(documento)}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Ver documento"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(documento)}
                              className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Descargar documento"
                            >
                              <Download className="h-3 w-3" />
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
                      {personal.nombre} {personal.apellido} no tiene documentos subidos
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
        nombrePersona={`${personal?.nombre || ''} ${personal?.apellido || ''}`.trim()}
      />

      {/* Modal de Documentos */}
      <DocumentModal
        isOpen={showDocumentModal}
        onClose={handleDocumentModalClose}
        onSuccess={handleDocumentSuccess}
        rutPersona={personal?.rut || ''}
        nombrePersona={`${personal?.nombre || ''} ${personal?.apellido || ''}`.trim()}
      />

      {/* Modal de Documentos de Cursos */}
      <CourseDocumentModal
        isOpen={showCourseDocumentModal}
        onClose={handleCourseDocumentModalClose}
        onSuccess={handleCourseDocumentSuccess}
        rutPersona={personal?.rut || ''}
        nombrePersona={`${personal?.nombre || ''} ${personal?.apellido || ''}`.trim()}
        cursoNombre={selectedCurso?.nombre_curso}
      />
    </div>
  );
};

export default PersonalDetailModal;