import React, { useState } from 'react';
import { X, AlertTriangle, Clock, CheckCircle, Calendar, User, FileText, Building } from 'lucide-react';
import { useDocumentosVencidosManager } from '../../hooks/useDocumentosVencidos';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DocumentoVencido } from '../../types';

interface DocumentosVencidosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentosVencidosModal: React.FC<DocumentosVencidosModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'vencidos' | 'por-vencer'>('vencidos');
  
  const {
    documentosVencidos,
    documentosPorVencer,
    isLoadingVencidos,
    isLoadingPorVencer,
    errorVencidos,
    errorPorVencer,
    getEstadoDocumento,
    getColorEstado,
    getTextoEstado,
    formatearFecha,
    calcularDiasRestantes
  } = useDocumentosVencidosManager();

  if (!isOpen) return null;

  const renderDocumento = (documento: DocumentoVencido) => {
    const diasRestantes = documento.dias_restantes || calcularDiasRestantes(documento.fecha_vencimiento || '');
    const estado = getEstadoDocumento(diasRestantes);
    const colorEstado = getColorEstado(estado);
    const textoEstado = getTextoEstado(estado, diasRestantes);

    return (
      <div key={documento.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-gray-900">{documento.nombre_documento}</h4>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorEstado}`}>
                {textoEstado}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3" />
                  <span><strong>Personal:</strong> {documento.personal?.nombres || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span><strong>RUT:</strong> {documento.rut_persona}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span><strong>Cargo:</strong> {documento.personal?.cargo || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span><strong>Emisión:</strong> {documento.fecha_emision ? formatearFecha(documento.fecha_emision) : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span><strong>Vencimiento:</strong> {documento.fecha_vencimiento ? formatearFecha(documento.fecha_vencimiento) : 'N/A'}</span>
                </div>
                {documento.institucion_emisora && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-3 w-3" />
                    <span><strong>Institución:</strong> {documento.institucion_emisora}</span>
                  </div>
                )}
              </div>
            </div>
            
            {documento.descripcion && (
              <div className="mt-2 text-sm text-gray-600">
                <strong>Descripción:</strong> {documento.descripcion}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'vencidos') {
      if (isLoadingVencidos) {
        return (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600">Cargando documentos vencidos...</span>
          </div>
        );
      }

      if (errorVencidos) {
        return (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar documentos vencidos</h3>
            <p className="text-gray-600">No se pudieron cargar los documentos vencidos</p>
          </div>
        );
      }

      if (documentosVencidos.length === 0) {
        return (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Excelente!</h3>
            <p className="text-gray-600">No hay documentos vencidos</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {documentosVencidos.map(renderDocumento)}
        </div>
      );
    } else {
      if (isLoadingPorVencer) {
        return (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600">Cargando documentos por vencer...</span>
          </div>
        );
      }

      if (errorPorVencer) {
        return (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar documentos por vencer</h3>
            <p className="text-gray-600">No se pudieron cargar los documentos por vencer</p>
          </div>
        );
      }

      if (documentosPorVencer.length === 0) {
        return (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Perfecto!</h3>
            <p className="text-gray-600">No hay documentos próximos a vencer</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {documentosPorVencer.map(renderDocumento)}
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gestión de Documentos</h2>
            <p className="text-gray-600 mt-1">Documentos vencidos y próximos a vencer</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('vencidos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'vencidos'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Documentos Vencidos</span>
                {documentosVencidos.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {documentosVencidos.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('por-vencer')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'por-vencer'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Próximos a Vencer</span>
                {documentosPorVencer.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {documentosPorVencer.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
