import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Save, Edit } from 'lucide-react';
import { useUpdateDocumento, useTiposDocumentos, validateDocumentoData, createDocumentoFormData, getTiposDocumentosCursos } from '../../hooks/useDocumentos';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documento: any; // Documento a editar
  personalId: string; // ID del personal para la API
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  documento,
  personalId,
}) => {
  const [formData, setFormData] = useState({
    nombre_documento: '',
    tipo_documento: '',
    archivo: null as File | null,
    fecha_emision: '',
    fecha_vencimiento: '',
    dias_validez: '',
    estado_documento: '',
    institucion_emisora: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const updateMutation = useUpdateDocumento();
  const { data: tiposDocumento, isLoading: loadingTipos } = useTiposDocumentos();
  
  // Filtrar solo tipos de documentos de cursos
  const tiposDocumentosCursos = getTiposDocumentosCursos();

  const isLoading = updateMutation.isLoading || loadingTipos;

  // Llenar formulario con datos del documento
  useEffect(() => {
    if (documento && isOpen) {
      setFormData({
        nombre_documento: documento.nombre_documento || '',
        tipo_documento: documento.tipo_documento || '',
        archivo: null, // No pre-cargar archivo, permitir subir uno nuevo
        fecha_emision: documento.fecha_emision ? documento.fecha_emision.split('T')[0] : '',
        fecha_vencimiento: documento.fecha_vencimiento ? documento.fecha_vencimiento.split('T')[0] : '',
        dias_validez: documento.dias_validez ? documento.dias_validez.toString() : '',
        estado_documento: documento.estado_documento || '',
        institucion_emisora: documento.institucion_emisora || '',
      });
    }
    setErrors([]);
  }, [documento, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar errores al cambiar input
    if (errors.length > 0) {
      setErrors([]);
    }
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

    // Validar datos básicos
    if (!formData.nombre_documento.trim()) {
      setErrors(['El nombre del documento es requerido.']);
      return;
    }

    if (!formData.tipo_documento) {
      setErrors(['El tipo de documento es requerido.']);
      return;
    }

    try {
      // Preparar datos para actualización
      const updateData: any = {
        nombre_documento: formData.nombre_documento.trim(),
        tipo_documento: formData.tipo_documento,
        fecha_emision: formData.fecha_emision || undefined,
        fecha_vencimiento: formData.fecha_vencimiento || undefined,
        dias_validez: formData.dias_validez ? parseInt(formData.dias_validez) : undefined,
        estado_documento: formData.estado_documento || undefined,
        institucion_emisora: formData.institucion_emisora || undefined,
      };

      // Si hay un nuevo archivo, incluirlo
      if (formData.archivo) {
        updateData.archivo = formData.archivo;
      }

      // Actualizar documento
      await updateMutation.mutateAsync({
        id: documento.id,
        data: updateData
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al actualizar documento:', error);
      
      if (error.response?.status === 400) {
        setErrors(['Los datos ingresados no son válidos. Por favor, verifique la información.']);
      } else if (error.response?.status === 404) {
        setErrors(['El documento no fue encontrado.']);
      } else if (error.response?.status === 500) {
        setErrors(['Error del servidor. Por favor, intente nuevamente más tarde.']);
      } else {
        setErrors([`Error inesperado: ${error.message || 'Error desconocido'}`]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Edit className="h-6 w-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Editar Documento</h2>
                <p className="text-green-100 text-sm">
                  {documento?.nombre_documento || 'Documento'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
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
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre del Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Documento *
              </label>
              <input
                type="text"
                value={formData.nombre_documento}
                onChange={(e) => handleInputChange('nombre_documento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Certificado de Prevención de Riesgos"
                disabled={isLoading}
                required
              />
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento *
              </label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isLoading}
                required
              >
                <option value="">Seleccionar tipo de documento</option>
                {tiposDocumentosCursos.map((tipo: any) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Archivo Actual */}
            {documento?.nombre_original && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Archivo actual:</strong> {documento.nombre_original}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Si no selecciona un nuevo archivo, se mantendrá el archivo actual.
                </p>
              </div>
            )}

            {/* Carga de Nuevo Archivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="h-4 w-4 inline mr-1" />
                Nuevo Archivo (Opcional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload-edit"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>Subir nuevo archivo</span>
                      <input
                        id="file-upload-edit"
                        name="file-upload-edit"
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
                {/* Fecha de Emisión */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_emision}
                    onChange={(e) => handleInputChange('fecha_emision', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={isLoading}
                  />
                </div>

                {/* Fecha de Vencimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) => handleInputChange('fecha_vencimiento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={isLoading}
                  />
                </div>

                {/* Días de Validez */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de Validez
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.dias_validez}
                    onChange={(e) => handleInputChange('dias_validez', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

              {/* Institución Emisora */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institución Emisora
                </label>
                <input
                  type="text"
                  value={formData.institucion_emisora}
                  onChange={(e) => handleInputChange('institucion_emisora', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Ministerio del Trabajo, SII, etc."
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600">
                <strong>Nota:</strong> Los campos marcados con * son obligatorios. 
                Si no selecciona un nuevo archivo, se mantendrá el archivo actual.
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Actualizar Documento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDocumentModal;
