import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useUploadDocumento, useTiposDocumentos, useFormatosDocumentos } from '../../hooks/useDocumentos';
import { DocumentoUpload } from '../../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  rutPersona?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rutPersona = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rut, setRut] = useState(rutPersona);
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadDocumento();
  const { data: tiposData } = useTiposDocumentos();
  const { data: formatosData } = useFormatosDocumentos();

  const tipos = tiposData?.data || [];
  const formatos = formatosData?.data || [];

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
    const formatoValido = formatos?.some((f: any) => f.extension === extension);

    if (!formatoValido) {
      alert('Formato de archivo no soportado');
      return;
    }

    // Validar tamaño
    const formato = formatos?.find((f: any) => f.extension === extension);
    if (formato && file.size > formato.tamaño_maximo) {
      alert(`El archivo es demasiado grande. Tamaño máximo: ${(formato.tamaño_maximo / 1024 / 1024).toFixed(1)} MB`);
      return;
    }

    setSelectedFile(file);
    if (!nombreDocumento) {
      setNombreDocumento(file.name.split('.')[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !rut || !nombreDocumento || !tipoDocumento) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const documentoData: DocumentoUpload = {
      archivo: selectedFile,
      rut_persona: rut,
      nombre_documento: nombreDocumento,
      tipo_documento: tipoDocumento,
      descripcion: descripcion || undefined,
    };

    try {
      await uploadMutation.mutateAsync(documentoData);
      alert('Documento subido exitosamente');
      handleClose();
      onSuccess?.();
    } catch (error) {
      alert('Error al subir el documento');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setRut(rutPersona);
    setNombreDocumento('');
    setTipoDocumento('');
    setDescripcion('');
    setDragActive(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Subir Documento</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Área de subida de archivo */}
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
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
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
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      haz clic para seleccionar
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    Formatos soportados: {formatos?.map((f: any) => f.extension).join(', ')}
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept={formatos?.map((f: any) => `.${f.extension}`).join(',')}
              />
            </div>
          </div>

          {/* RUT de la persona */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUT de la Persona *
            </label>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="Ej: 12345678-9"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Nombre del documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Documento *
            </label>
            <input
              type="text"
              value={nombreDocumento}
              onChange={(e) => setNombreDocumento(e.target.value)}
              placeholder="Ej: Certificado de Capacitación"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Tipo de documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento *
            </label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción adicional del documento..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isLoading ? 'Subiendo...' : 'Subir Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
