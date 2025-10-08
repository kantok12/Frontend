import React, { useState } from 'react';
import { X, Upload, FileText, AlertTriangle } from 'lucide-react';
import { useUploadDocumento, useTiposDocumentos, validateDocumentoData, createDocumentoFormData } from '../../hooks/useDocumentos';
import { CreateDocumentoData } from '../../types';
import { DocumentosVencidosModal } from './DocumentosVencidosModal';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: any) => void;
  rutPersona: string;
  nombrePersona: string;
  personalId: string; // ID del personal para la API
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rutPersona,
  nombrePersona,
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
  const [showDocumentosVencidos, setShowDocumentosVencidos] = useState(false);

  const uploadMutation = useUploadDocumento();
  const { data: tiposDocumento, isLoading: loadingTipos } = useTiposDocumentos();

  const isLoading = uploadMutation.isLoading || loadingTipos;

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
    
    if (!formData.archivo) {
      setErrors(['Debe seleccionar un archivo']);
      return;
    }

    const documentoData: CreateDocumentoData = {
      personal_id: personalId || rutPersona, // Usar RUT si personalId no está disponible
      nombre_documento: formData.nombre_documento,
      tipo_documento: formData.tipo_documento,
      archivo: formData.archivo,
      fecha_emision: formData.fecha_emision || undefined,
      fecha_vencimiento: formData.fecha_vencimiento || undefined,
      dias_validez: formData.dias_validez ? parseInt(formData.dias_validez) : undefined,
      estado_documento: formData.estado_documento || undefined,
      institucion_emisora: formData.institucion_emisora || undefined
    };

    const validationErrors = validateDocumentoData(documentoData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const formDataToSend = createDocumentoFormData(documentoData);
      const response = await uploadMutation.mutateAsync(formDataToSend);

      if (response.success) {
        onSuccess(response.data);
        
        // Limpiar formulario
        setFormData({
          nombre_documento: '',
          tipo_documento: '',
          archivo: null,
          fecha_emision: '',
          fecha_vencimiento: '',
          dias_validez: '',
          estado_documento: '',
          institucion_emisora: '',
        });
        setErrors([]);
        onClose();
      }
    } catch (error: any) {
      console.error('Error al subir documento:', error);
      console.error('Error response data:', error.response?.data);
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Los datos ingresados no son válidos.';
        setErrors([`Error 400: ${errorMessage}`]);
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.error || '';
        if (errorMessage.includes('Multipart: Boundary not found')) {
          setErrors(['Error del servidor: Problema con el formato del archivo. Intente con otro archivo.']);
        } else if (errorMessage.includes('no existe la columna')) {
          setErrors(['Error del servidor: La base de datos necesita ser actualizada. Contacte al administrador del sistema.']);
        } else {
          setErrors(['Error del servidor. Por favor, intente nuevamente más tarde.']);
        }
      } else {
        setErrors(['Error al subir el documento. Por favor, intente nuevamente.']);
      }
    }
  };

  const handleClose = () => {
    setFormData({
      nombre_documento: '',
      tipo_documento: '',
      archivo: null,
      fecha_emision: '',
      fecha_vencimiento: '',
      dias_validez: '',
      estado_documento: '',
      institucion_emisora: '',
    });
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Subir Documento
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDocumentosVencidos(true)}
              className="flex items-center px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Documentos Vencidos
            </button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Personal:</span> {nombrePersona}
          </div>
          <div className="text-sm text-blue-800">
            <span className="font-medium">RUT:</span> {rutPersona}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Nombre del documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Documento *
            </label>
            <input
              type="text"
              value={formData.nombre_documento}
              onChange={(e) => handleInputChange('nombre_documento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Contrato de Trabajo 2024"
              disabled={isLoading}
              required
            />
          </div>

          {/* Tipo de documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento *
            </label>
            <select
              value={formData.tipo_documento}
              onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            >
              <option value="">Seleccionar tipo de documento</option>
              {tiposDocumento?.data?.map((tipo: any) => (
                <option key={tipo.value || tipo.id} value={tipo.value || tipo.nombre}>
                  {tipo.label || tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo *
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isLoading}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Formatos permitidos: PDF, JPG, JPEG, PNG (máximo 5MB)
            </p>
            
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Validez</h3>
            
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Ministerio del Trabajo, SII, etc."
                disabled={isLoading}
              />
            </div>

            {/* Información adicional */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Los campos de validez son opcionales. Si no se especifican fechas, 
                el documento se considerará sin fecha de vencimiento.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal de Documentos Vencidos */}
      <DocumentosVencidosModal
        isOpen={showDocumentosVencidos}
        onClose={() => setShowDocumentosVencidos(false)}
      />
    </div>
  );
};

export default DocumentModal;

