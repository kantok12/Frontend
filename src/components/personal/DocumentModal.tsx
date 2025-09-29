import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { useUploadDocumento, useTiposDocumentos, useFormatosDocumentos } from '../../hooks/useDocumentos';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: any) => void;
  rutPersona: string;
  nombrePersona: string;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rutPersona,
  nombrePersona,
}) => {
  const [formData, setFormData] = useState({
    nombre_documento: '',
    tipo_documento: 'certificado_curso',
    descripcion: '',
    archivo: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const uploadMutation = useUploadDocumento();
  const { data: tiposData } = useTiposDocumentos();
  const { data: formatosData } = useFormatosDocumentos();

  const tipos = tiposData && Array.isArray(tiposData.data) ? tiposData.data : [];
  const formatos = formatosData && Array.isArray(formatosData.data) ? formatosData.data : [];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validar formato
    const extension = file.name.split('.').pop()?.toLowerCase();
    const formatoValido = Array.isArray(formatos) ? formatos.some((f: any) => f.extension === extension) : true;

    if (!formatoValido) {
      alert('Formato de archivo no soportado');
      return;
    }

    // Validar tamaño
    const formato = Array.isArray(formatos) ? formatos.find((f: any) => f.extension === extension) : null;
    if (formato && file.size > formato.tamaño_maximo) {
      alert(`El archivo es demasiado grande. Tamaño máximo: ${(formato.tamaño_maximo / 1024 / 1024).toFixed(1)} MB`);
      return;
    }

    setFormData(prev => ({ ...prev, archivo: file }));
    if (!formData.nombre_documento) {
      setFormData(prev => ({ ...prev, nombre_documento: file.name.split('.')[0] }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre_documento.trim()) {
      newErrors.nombre_documento = 'El nombre del documento es requerido';
    }

    if (!formData.tipo_documento) {
      newErrors.tipo_documento = 'Debe seleccionar un tipo de documento';
    }

    if (!formData.archivo) {
      newErrors.archivo = 'Debe seleccionar un archivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!formData.archivo) {
      alert('Debe seleccionar un archivo');
      return;
    }

    try {
      const documentoData = {
        archivo: formData.archivo,
        rut_persona: rutPersona,
        nombre_documento: formData.nombre_documento,
        tipo_documento: formData.tipo_documento,
        descripcion: formData.descripcion || undefined,
      };

      const resultado = await uploadMutation.mutateAsync(documentoData);
      
      onSuccess(resultado.data);
      
      // Limpiar formulario
      setFormData({
        nombre_documento: '',
        tipo_documento: 'certificado_curso',
        descripcion: '',
        archivo: null,
      });
      setErrors({});
      onClose();
      
    } catch (error) {
      console.error('Error al subir documento:', error);
      setErrors({ general: 'Error al subir el documento. Intente nuevamente.' });
    }
  };

  const handleClose = () => {
    setFormData({
      nombre_documento: '',
      tipo_documento: 'certificado_curso',
      descripcion: '',
      archivo: null,
    });
    setErrors({});
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre del documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Documento *
            </label>
            <input
              type="text"
              value={formData.nombre_documento}
              onChange={(e) => handleInputChange('nombre_documento', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.nombre_documento ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Certificado de Capacitación"
            />
            {errors.nombre_documento && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.nombre_documento}
              </p>
            )}
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
            >
              <option value="">Selecciona un tipo</option>
              {tipos?.map((tipo: string) => (
                <option key={tipo} value={tipo}>
                  {tipo.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción adicional del documento..."
            />
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {formData.archivo ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{formData.archivo.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.archivo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, archivo: null }))}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar archivo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Arrastra y suelta tu archivo aquí, o{' '}
                    <button
                      type="button"
                      onClick={() => document.getElementById('file-input')?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      haz clic para seleccionar
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    Formatos soportados: {Array.isArray(formatos) ? formatos.map((f: any) => f.extension).join(', ') : 'Cargando...'}
                  </p>
                </div>
              )}
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={Array.isArray(formatos) ? formatos.map((f: any) => `.${f.extension}`).join(',') : ''}
              />
            </div>
            {errors.archivo && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.archivo}
              </p>
            )}
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.general}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploadMutation.isLoading ? (
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

export default DocumentModal;
