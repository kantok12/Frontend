import React, { useState } from 'react';
import { X, Upload, FileText, GraduationCap } from 'lucide-react';
import { useUploadDocumento, useTiposDocumentos, validateDocumentoData, createDocumentoFormData, getTiposDocumentosCursos } from '../../hooks/useDocumentos';
import { CreateDocumentoData } from '../../types';

interface CourseDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: any) => void;
  rutPersona: string;
  nombrePersona: string;
  personalId: string; // ID del personal para la API
  cursoNombre?: string;
}

const CourseDocumentModal: React.FC<CourseDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rutPersona,
  nombrePersona,
  personalId,
  cursoNombre,
}) => {
  const [formData, setFormData] = useState({
    nombre_documento: '',
    tipo_documento: '',
    archivo: null as File | null,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const uploadMutation = useUploadDocumento();
  const { data: tiposDocumento, isLoading: loadingTipos } = useTiposDocumentos();
  
  // Filtrar solo tipos de documentos de cursos
  const tiposDocumentosCursos = getTiposDocumentosCursos();

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
      archivo: formData.archivo
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
        });
        setErrors([]);
        onClose();
      }
    } catch (error: any) {
      console.error('Error al subir documento de curso:', error);
      if (error.response?.status === 400) {
        setErrors(['Los datos ingresados no son válidos. Por favor, verifique la información.']);
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
    });
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <GraduationCap className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Subir Documento de Curso
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Personal:</span> {nombrePersona}
          </div>
          <div className="text-sm text-blue-800">
            <span className="font-medium">RUT:</span> {rutPersona}
          </div>
          {cursoNombre && (
            <div className="text-sm text-blue-800">
              <span className="font-medium">Curso:</span> {cursoNombre}
            </div>
          )}
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
              placeholder="Ej: Certificado de Seguridad Industrial"
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
              <option value="">Seleccionar tipo de certificado</option>
              {tiposDocumentosCursos.map((tipo: any) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
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
    </div>
  );
};

export default CourseDocumentModal;

