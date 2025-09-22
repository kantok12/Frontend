import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Calendar, Save, Upload, FileText } from 'lucide-react';
import { useCreateCurso, useUpdateCurso, validateCursoData } from '../../hooks/useCursos';
import { Curso, CreateCursoData, UpdateCursoData } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CursoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  curso?: Curso | null; // Si se pasa un curso, es para editar
  rutPersona: string; // RUT de la persona para quien se agrega el curso
  nombrePersona: string; // Nombre de la persona para mostrar en el título
}

export const CursoModal: React.FC<CursoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  curso = null,
  rutPersona,
  nombrePersona
}) => {
  const [formData, setFormData] = useState({
    nombre_curso: '',
    fecha_obtencion: '',
    tipo_documento: '',
    archivo: null as File | null,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string>('');

  const createMutation = useCreateCurso();
  const updateMutation = useUpdateCurso();

  const isEditing = !!curso;
  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  // Llenar formulario si es edición
  useEffect(() => {
    if (curso && isOpen) {
      setFormData({
        nombre_curso: curso.nombre_curso || '',
        fecha_obtencion: curso.fecha_obtencion ? curso.fecha_obtencion.split('T')[0] : '', // Formato YYYY-MM-DD para input date
        tipo_documento: '',
        archivo: null,
      });
    } else if (isOpen && !curso) {
      // Reset para nuevo curso
      setFormData({
        nombre_curso: '',
        fecha_obtencion: '',
        tipo_documento: '',
        archivo: null,
      });
    }
    setErrors([]);
    setFileError('');
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
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setFileError('Solo se permiten archivos PDF, JPG, JPEG o PNG');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('El archivo no puede ser mayor a 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        archivo: file
      }));
      setFileError('');
    }
  };

  // Tipos de documentos disponibles
  const tiposDocumento = [
    'Certificado de Curso',
    'Diploma',
    'Constancia de Participación',
    'Evaluación/Examen',
    'Material del Curso',
    'Otro'
  ];

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
        await createMutation.mutateAsync({
          rut_persona: rutPersona,
          nombre_curso: formData.nombre_curso,
          fecha_obtencion: formData.fecha_obtencion
        } as CreateCursoData);
      }

      // Si hay documento, simular la subida y agregar a la lista de documentos
      if (formData.archivo && formData.tipo_documento) {
        // Simular subida de documento
        // eslint-disable-next-line no-console
        console.log('Documento subido:', {
          nombre: formData.archivo.name,
          tipo: formData.tipo_documento,
          curso: formData.nombre_curso
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      // Manejar diferentes tipos de errores
      if (error.response?.status === 409) {
        setErrors(['Este curso ya está registrado para esta persona. Por favor, verifique los datos o edite el curso existente.']);
      } else if (error.response?.status === 400) {
        setErrors(['Los datos ingresados no son válidos. Por favor, verifique la información.']);
      } else {
        setErrors(['Error al guardar el curso. Por favor, intente nuevamente.']);
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
                  <option value="">Seleccionar tipo de documento</option>
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
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
                
                {/* Mostrar error de archivo */}
                {fileError && (
                  <p className="mt-1 text-sm text-red-600">{fileError}</p>
                )}
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


