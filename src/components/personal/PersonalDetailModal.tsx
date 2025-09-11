import React, { useState, useEffect } from 'react';
import { Personal, UpdatePersonalData } from '../../types';
import { useUpdatePersonal } from '../../hooks/usePersonal';
import { useUpdateNombre } from '../../hooks/useNombres';
import { useEstados } from '../../hooks/useEstados';
import { useCursosByRut, useDeleteCurso } from '../../hooks/useCursos';
import { X, User, Calendar, MapPin, Award, ShirtIcon, Car, Activity, Edit, Save, XCircle, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { CursoModal } from './CursoModal';

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
  const updateNombreMutation = useUpdateNombre();
  const { data: estadosData, isLoading: estadosLoading } = useEstados();
  const { data: cursosData, isLoading: cursosLoading, refetch: refetchCursos } = useCursosByRut(personal?.rut || '');
  const deleteCursoMutation = useDeleteCurso();

  // Estados para modal de cursos
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<any>(null);

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
      setIsEditing(false);
      setErrors({});
    }
  }, [personal, isOpen]);

  if (!isOpen || !personal) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleInputChange = (field: keyof UpdatePersonalData, value: any) => {
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
    if (!validateForm()) {
      return;
    }

    try {
      const promises = [];
      let nombreActualizado = false;

      // 1. Si se cambió el nombre o apellido, actualizar en el servicio de nombres
      if (editData.nombre || editData.apellido) {
        const nombreCompleto = `${editData.nombre || personal.nombre} ${editData.apellido || personal.apellido}`;
        promises.push(
          updateNombreMutation.mutateAsync({
            rut: personal.rut,
            data: {
              nombre: nombreCompleto
            }
          }).then(() => {
            nombreActualizado = true;
          }).catch(error => {
            console.warn('No se pudo actualizar en el servicio de nombres:', error);
            // No es crítico si falla, continuamos
          })
        );
      }

      // 2. Actualizar datos en personal-disponible
      // Preparar comentario_estado
      let comentarioEstado = editData.comentario_estado || personal.comentario_estado || '';
      
      // Si se cambió el nombre/apellido, actualizar solo la parte del nombre en el comentario
      if (editData.nombre || editData.apellido) {
        const nombreCompleto = `${editData.nombre || personal.nombre} ${editData.apellido || personal.apellido}`;
        // Si el comentario actual sigue el patrón "Importado: Nombre", actualizarlo
        if (comentarioEstado.includes('Importado:')) {
          comentarioEstado = `Importado: ${nombreCompleto}`;
        } else {
          // Si el comentario es personalizado, mantenerlo tal como el usuario lo editó
          comentarioEstado = editData.comentario_estado || personal.comentario_estado || '';
        }
      }

      // Preparar datos con SOLO los campos que existen en la base de datos
      const updateData = {
        // Campos requeridos por el backend
        sexo: editData.sexo || personal.sexo,
        fecha_nacimiento: personal.fecha_nacimiento, // No se puede editar la fecha de nacimiento
        licencia_conducir: editData.licencia_conducir || personal.licencia_conducir,
        cargo: editData.cargo || personal.cargo,
        estado_id: editData.estado_id !== undefined ? editData.estado_id : personal.estado_id,
        // Campos adicionales editables (SOLO los que existen en la BD)
        talla_zapatos: editData.talla_zapatos || personal.talla_zapatos || '',
        talla_pantalones: editData.talla_pantalones || personal.talla_pantalones || '',
        talla_poleras: editData.talla_poleras || personal.talla_poleras || '',
        zona_geografica: editData.zona_geografica || personal.zona_geografica || '',
        comentario_estado: comentarioEstado, // Aquí guardamos el nombre completo como fallback
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
      
    } catch (error) {
      console.error('Error al actualizar:', error);
      setErrors({ general: 'Error al actualizar el personal. Verifique los datos ingresados.' });
    }
  };

  const handleCancel = () => {
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
                  className="text-white hover:text-yellow-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
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
          
          {/* Estado */}
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
            
            {/* Información Personal */}
            <div className="space-y-6">
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
            </div>

            {/* Información de Vestuario y Equipamiento */}
            <div className="space-y-6">
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
                  <Award className="h-5 w-5 mr-2 text-red-600" />
                  Información del Sistema
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">ID del Estado:</span>
                    <span className="text-gray-900">{personal.estado_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Estado:</span>
                    {isEditing ? (
                      <div className="flex flex-col">
                        <select
                          value={editData.estado_id || personal.estado_id}
                          onChange={(e) => handleInputChange('estado_id', parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={estadosLoading}
                        >
                          {estadosLoading ? (
                            <option>Cargando estados...</option>
                          ) : (
                            estadosData?.data?.map((estado: any) => (
                              <option key={estado.id} value={estado.id}>
                                {estado.nombre}
                              </option>
                            ))
                          )}
                        </select>
                        {estadosData?.data?.find((e: any) => e.id === (editData.estado_id || personal.estado_id))?.descripcion && (
                          <span className="text-xs text-gray-500 mt-1">
                            {estadosData.data.find((e: any) => e.id === (editData.estado_id || personal.estado_id))?.descripcion}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className={`font-semibold ${
                          personal.activo ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {personal.estado_nombre}
                        </span>
                        {estadosData?.data?.find((e: any) => e.id === personal.estado_id)?.descripcion && (
                          <div className="text-xs text-gray-500 mt-1">
                            {estadosData.data.find((e: any) => e.id === personal.estado_id)?.descripcion}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

              {/* Cursos y Certificaciones */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-purple-600" />
                    Cursos y Certificaciones
                  </h3>
                  <button
                    onClick={handleAddCurso}
                    className="text-purple-600 hover:text-purple-900 p-2 rounded-full hover:bg-purple-100 transition-colors"
                    title="Agregar curso"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {cursosLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                    <span className="ml-2 text-purple-600">Cargando cursos...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cursosData?.data && cursosData.data.length > 0 ? (
                      cursosData.data.map((curso: any, index: number) => (
                        <div key={curso.id || index} className="bg-white rounded-lg p-3 border border-purple-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1 cursor-pointer" 
                              onClick={() => handleEditCurso(curso)}
                              title="Hacer clic para editar"
                            >
                              <h4 className="font-medium text-purple-900 text-sm hover:text-purple-700">
                                {curso.nombre_curso}
                              </h4>
                              <p className="text-xs text-purple-600 mt-1">
                                Obtenido: {new Date(curso.fecha_obtencion).toLocaleDateString('es-CL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteCurso(curso)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors ml-2"
                              title="Eliminar curso"
                              disabled={deleteCursoMutation.isLoading}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <GraduationCap className="h-12 w-12 text-purple-300 mx-auto mb-3" />
                        <p className="text-purple-600 text-sm">
                          No hay cursos o certificaciones registradas
                        </p>
                        <button
                          onClick={handleAddCurso}
                          className="mt-2 text-purple-600 hover:text-purple-800 text-xs underline"
                        >
                          Agregar primer curso
                        </button>
                      </div>
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
    </div>
  );
};
