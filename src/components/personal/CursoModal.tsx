import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Calendar, Save, Upload, FileText } from 'lucide-react';
import { useCreateCurso, useUpdateCurso, validateCursoData } from '../../hooks/useCursos';
import { useUploadDocumento, useTiposDocumentos, validateDocumentoData, createDocumentoFormData } from '../../hooks/useDocumentos';
import { Curso, CreateCursoData, UpdateCursoData, CreateDocumentoData } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CursoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  curso?: Curso | null; // Si se pasa un curso, es para editar
  rutPersona: string; // RUT de la persona para quien se agrega el curso
  nombrePersona: string; // Nombre de la persona para mostrar en el título
  personalId: string; // ID del personal para la API
}

export const CursoModal: React.FC<CursoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  curso = null,
  rutPersona,
  nombrePersona,
  personalId
}) => {
  const [formData, setFormData] = useState({
    nombre_curso: '',
    fecha_inicio: '',
    fecha_fin: '',
    fecha_vencimiento: '',
    fecha_obtencion: '', // Campo legacy para compatibilidad
    estado: 'completado',
    institucion: '',
    descripcion: '',
    tipo_documento: '',
    archivo: null as File | null,
    // Campos de validez del documento
    fecha_emision_documento: '',
    fecha_vencimiento_documento: '',
    dias_validez_documento: '',
    estado_documento: '',
    institucion_emisora: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const createMutation = useCreateCurso();
  const updateMutation = useUpdateCurso();
  const uploadMutation = useUploadDocumento();
  const { data: tiposDocumento, isLoading: loadingTipos } = useTiposDocumentos();

  const isEditing = !!curso;
  const isLoading = createMutation.isLoading || updateMutation.isLoading || uploadMutation.isLoading || loadingTipos;

  // Llenar formulario si es edición
  useEffect(() => {
    if (curso && isOpen) {
      setFormData({
        nombre_curso: curso.nombre_curso || '',
        fecha_inicio: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : '',
        fecha_fin: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : '',
        fecha_vencimiento: curso.fecha_vencimiento ? curso.fecha_vencimiento.split('T')[0] : '',
        fecha_obtencion: curso.fecha_obtencion ? curso.fecha_obtencion.split('T')[0] : '', // Campo legacy
        estado: curso.estado || 'completado',
        institucion: curso.institucion || '',
        descripcion: curso.descripcion || '',
        tipo_documento: '',
        archivo: null,
        // Campos de validez del documento
        fecha_emision_documento: '',
        fecha_vencimiento_documento: '',
        dias_validez_documento: '',
        estado_documento: '',
        institucion_emisora: '',
      });
    } else if (isOpen && !curso) {
      // Reset para nuevo curso
      setFormData({
        nombre_curso: '',
        fecha_inicio: '',
        fecha_fin: '',
        fecha_vencimiento: '',
        fecha_obtencion: '', // Campo legacy
        estado: 'completado',
        institucion: '',
        descripcion: '',
        tipo_documento: '',
        archivo: null,
        // Campos de validez del documento
        fecha_emision_documento: '',
        fecha_vencimiento_documento: '',
        dias_validez_documento: '',
        estado_documento: '',
        institucion_emisora: '',
      });
    }
    setErrors([]);
  }, [curso, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar errores al cambiar input
    setErrors([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        archivo: file
      }));

      // Limpiar errores
      if (errors.length > 0) {
        setErrors([]);
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar datos básicos del curso
    const validationData = isEditing 
      ? { nombre_curso: formData.nombre_curso, fecha_obtencion: formData.fecha_obtencion } as UpdateCursoData
      : { rut_persona: rutPersona, nombre_curso: formData.nombre_curso, fecha_obtencion: formData.fecha_obtencion } as CreateCursoData;
    
    const validationErrors = validateCursoData(validationData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Validar que si se selecciona tipo de documento, también se suba un archivo
    if (formData.tipo_documento && !formData.archivo) {
      setErrors(['Debe seleccionar un archivo si especifica el tipo de documento.']);
      return;
    }

    try {
      if (isEditing && curso) {
        // Actualizar curso existente
        await updateMutation.mutateAsync({
          id: curso.id,
          data: { nombre_curso: formData.nombre_curso, fecha_obtencion: formData.fecha_obtencion } as UpdateCursoData
        });
      } else {
        // Crear nuevo curso
        // Validar que el RUT no esté vacío
        if (!rutPersona || rutPersona.trim() === '') {
          setErrors(['Error: RUT de la persona no está disponible.']);
          return;
        }

        const cursoData = {
          rut_persona: rutPersona.trim(),
          nombre_curso: formData.nombre_curso.trim(),
          fecha_inicio: formData.fecha_inicio || undefined,
          fecha_fin: formData.fecha_fin || undefined,
          fecha_vencimiento: formData.fecha_vencimiento || undefined,
          estado: formData.estado || 'completado',
          institucion: formData.institucion || undefined,
          descripcion: formData.descripcion || undefined,
          // Mantener compatibilidad con campo legacy
          fecha_obtencion: formData.fecha_obtencion
        } as CreateCursoData;
        
        // eslint-disable-next-line no-console
        console.log('🔍 Datos del curso a crear:', cursoData);
        // eslint-disable-next-line no-console
        console.log('🔍 RUT persona:', rutPersona);
        // eslint-disable-next-line no-console
        console.log('🔍 Nombre curso:', formData.nombre_curso);
        // eslint-disable-next-line no-console
        console.log('🔍 Fecha obtención:', formData.fecha_obtencion);
        
        await createMutation.mutateAsync(cursoData);
      }

      // Si hay documento, subirlo usando la nueva API
      if (formData.archivo && formData.tipo_documento) {
        const documentoData: CreateDocumentoData = {
          personal_id: personalId,
          nombre_documento: `${formData.nombre_curso} - ${formData.tipo_documento}`,
          tipo_documento: formData.tipo_documento,
          archivo: formData.archivo,
          fecha_emision: formData.fecha_emision_documento || undefined,
          fecha_vencimiento: formData.fecha_vencimiento_documento || undefined,
          dias_validez: formData.dias_validez_documento ? parseInt(formData.dias_validez_documento) : undefined,
          estado_documento: formData.estado_documento || undefined,
          institucion_emisora: formData.institucion_emisora || undefined
        };

        const documentValidationErrors = validateDocumentoData(documentoData);
        if (documentValidationErrors.length > 0) {
          setErrors([...errors, ...documentValidationErrors]);
          return;
        }

        try {
          const formDataToSend = createDocumentoFormData(documentoData);
          await uploadMutation.mutateAsync(formDataToSend);
        } catch (docError) {
          // eslint-disable-next-line no-console
          console.error('Error al subir documento:', docError);
          setErrors(['Curso guardado exitosamente, pero hubo un error al subir el documento.']);
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('❌ Error al guardar curso:', error);
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 409) {
        const cursoNombre = formData.nombre_curso || 'este curso';
        const mensajeBackend = error.response?.data?.message || '';
        setErrors([
          `⚠️ El curso "${cursoNombre}" ya está registrado para esta persona.`,
          mensajeBackend ? `📋 Detalle: ${mensajeBackend}` : '',
          '💡 Opciones disponibles:',
          '• Editar el curso existente desde la lista de cursos',
          '• Cambiar el nombre del curso por uno diferente',
          '• Verificar si ya tiene este certificado registrado',
          '• Usar un nombre más específico (ej: "Curso Básico 2025")'
        ].filter(Boolean)); // Filtrar strings vacíos
      } else if (error.response?.status === 400) {
        setErrors(['❌ Los datos ingresados no son válidos. Por favor, verifique la información.']);
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.error || '';
        if (errorMessage.includes('no existe la columna «nombre»')) {
          setErrors([
            '❌ Error del servidor: La base de datos necesita ser actualizada.',
            'El backend está intentando usar una columna que ya no existe.',
            'Contacta al administrador del sistema para corregir este problema.'
          ]);
        } else {
          setErrors(['🔧 Error del servidor. Por favor, intente nuevamente más tarde.']);
        }
      } else {
        setErrors([`❌ Error inesperado: ${error.message || 'Error desconocido'}`]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">
                  {isEditing ? 'Editar Curso' : 'Agregar Curso'}
                </h2>
                <p className="text-purple-100 text-sm">
                  {nombrePersona} ({rutPersona})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Información del modal */}
          {!isEditing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded">
              <p className="text-sm">
                <strong>💡 Información:</strong> Si esta persona ya tiene un curso con el mismo nombre, 
                se mostrará un error. En ese caso, puedes editar el curso existente desde la lista.
              </p>
            </div>
          )}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error) => (
                  <li key={`error-${error.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre del Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Curso *
              </label>
              <input
                type="text"
                value={formData.nombre_curso}
                onChange={(e) => handleInputChange('nombre_curso', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ej: Prevención de Riesgos Laborales"
                disabled={isLoading}
                required
              />
            </div>

            {/* Fecha de Obtención */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha de Obtención *
              </label>
              <input
                type="date"
                value={formData.fecha_obtencion}
                onChange={(e) => handleInputChange('fecha_obtencion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={isLoading}
                max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                required
              />
            </div>

            {/* Sección de Documentación */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Documentación del Curso
              </h3>
              
              {/* Tipo de Documento */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={formData.tipo_documento}
                  onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isLoading}
                >
                  <option key="default" value="">Seleccionar tipo de documento</option>
                  {tiposDocumento?.data && Array.isArray(tiposDocumento.data) && tiposDocumento.data.map((tipo: any) => (
                    <option key={tipo.value || tipo.id} value={tipo.value || tipo.nombre}>
                      {tipo.label || tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Carga de Archivo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="h-4 w-4 inline mr-1" />
                  Archivo del Documento
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-purple-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                      >
                        <span>Subir archivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          disabled={isLoading}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, JPEG, PNG hasta 5MB
                    </p>
                  </div>
                </div>
                
                {/* Mostrar archivo seleccionado */}
                {formData.archivo && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {formData.archivo.name}
                    </p>
                  </div>
                )}
                
              </div>

              {/* Información de Validez del Documento */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">Información de Validez del Documento</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha de Emisión del Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Emisión del Documento
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_emision_documento}
                      onChange={(e) => handleInputChange('fecha_emision_documento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Fecha de Vencimiento del Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Vencimiento del Documento
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_vencimiento_documento}
                      onChange={(e) => handleInputChange('fecha_vencimiento_documento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Días de Validez del Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Validez del Documento
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.dias_validez_documento}
                      onChange={(e) => handleInputChange('dias_validez_documento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ej: 365"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Estado del Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado del Documento
                    </label>
                    <select
                      value={formData.estado_documento}
                      onChange={(e) => handleInputChange('estado_documento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="vigente">Vigente</option>
                      <option value="vencido">Vencido</option>
                      <option value="por_vencer">Por Vencer</option>
                      <option value="sin_fecha">Sin Fecha</option>
                    </select>
                  </div>
                </div>

                {/* Institución Emisora del Documento */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institución Emisora del Documento
                  </label>
                  <input
                    type="text"
                    value={formData.institucion_emisora}
                    onChange={(e) => handleInputChange('institucion_emisora', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Ministerio del Trabajo, SII, etc."
                    disabled={isLoading}
                  />
                </div>

                {/* Información adicional sobre validez */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Los campos de validez del documento son opcionales. Si no se especifican fechas, 
                    el documento se considerará sin fecha de vencimiento.
                  </p>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600">
                <strong>Nota:</strong> La fecha de obtención no puede ser futura. 
                Este registro se asociará al personal {nombrePersona}.
                {formData.tipo_documento && formData.archivo && (
                  <><br /><strong>Documento:</strong> Se subirá {formData.tipo_documento} junto con el curso.</>
                )}
              </p>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Actualizar' : 'Agregar'} Curso
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


