import React, { useState } from 'react';
import { FileText, Image, File, Download, Eye } from 'lucide-react';

interface DocumentThumbnailProps {
  documento: {
    id: string;
    nombre_documento: string;
    tipo_documento: string;
    archivo?: string;
    descripcion?: string;
  };
  onView: (documento: any) => void;
  onDownload: (documentId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const DocumentThumbnail: React.FC<DocumentThumbnailProps> = ({
  documento,
  onView,
  onDownload,
  size = 'md'
}) => {
  const [imageError, setImageError] = useState(false);

  const getFileIcon = (tipo: string, archivo?: string) => {
    // Si tenemos el archivo, usar su extensión para determinar el icono
    if (archivo) {
      const extension = archivo.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        return <FileText className="h-6 w-6 text-red-500" />;
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
        return <Image className="h-6 w-6 text-blue-500" />;
      }
    }
    
    // Fallback al tipo de documento
    if (tipo.includes('pdf') || tipo.includes('documento')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (tipo.includes('imagen') || tipo.includes('foto')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    }
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const getFileType = (archivo: string | undefined) => {
    if (!archivo) return 'Archivo';
    const extension = archivo.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'Imagen';
      case 'doc':
      case 'docx':
        return 'Word';
      case 'xls':
      case 'xlsx':
        return 'Excel';
      default:
        return 'Archivo';
    }
  };

  const isImage = (archivo: string | undefined) => {
    if (!archivo) return false;
    const extension = archivo.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-16 w-16';
      case 'lg':
        return 'h-24 w-24';
      default:
        return 'h-20 w-20';
    }
  };

  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(documento);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(documento.id);
  };

  return (
    <div className={`${getSizeClasses()} bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden`}>
      {/* Contenido principal */}
      <div className="h-full w-full flex flex-col items-center justify-center p-2">
        {isImage(documento.archivo) && !imageError ? (
          <div className="h-full w-full relative">
            <img
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/documentos/${documento.id}/download`}
              alt={documento.nombre_documento}
              className="h-full w-full object-cover rounded"
              onError={handleImageError}
            />
            {/* Overlay para acciones */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                <button
                  onClick={handleView}
                  className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                  title="Ver documento"
                >
                  <Eye className="h-3 w-3 text-gray-700" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                  title="Descargar"
                >
                  <Download className="h-3 w-3 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center">
            {getFileIcon(documento.tipo_documento, documento.archivo)}
            <span className={`${getTextSizeClasses()} text-gray-600 mt-1 text-center leading-tight`}>
              {getFileType(documento.archivo)}
            </span>
          </div>
        )}
      </div>

      {/* Overlay de acciones para archivos no-imagen */}
      {!isImage(documento.archivo) && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
            <button
              onClick={handleView}
              className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
              title="Ver documento"
            >
              <Eye className="h-3 w-3 text-gray-700" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
              title="Descargar"
            >
              <Download className="h-3 w-3 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* Badge de tipo de archivo */}
      <div className="absolute top-1 right-1">
        <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
          {getFileType(documento.archivo)}
        </span>
      </div>
    </div>
  );
};
