import React, { useState, useMemo } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, FileText, Upload, Download, X } from 'lucide-react';
import { useBelrayList, useDeleteBelray, useBelrayDocuments, useUploadBelrayDocument, useDeleteBelrayDocument } from '../../hooks/useBelray';
import { LoadingSpinner } from '../common/LoadingSpinner';
import apiService from '../../services/api';

interface BelrayListProps {
  onAddClick: () => void;
  onEditClick: (empresa: any) => void;
}

export const BelrayList: React.FC<BelrayListProps> = ({ onAddClick, onEditClick }) => {
  const [search, setSearch] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<any | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: empresas, isLoading, error } = useBelrayList();
  const deleteMutation = useDeleteBelray();
  const { data: documents, isLoading: documentsLoading } = useBelrayDocuments(selectedEmpresa?.id || null);
  const uploadMutation = useUploadBelrayDocument();
  const deleteDocMutation = useDeleteBelrayDocument();

  const filteredEmpresas = useMemo(() => {
    if (!empresas || !Array.isArray(empresas)) return [];
    if (!search.trim()) return empresas;
    
    const searchLower = search.toLowerCase();
    return empresas.filter((emp: any) => 
      emp.nombre?.toLowerCase().includes(searchLower) ||
      emp.rut_empresa?.toLowerCase().includes(searchLower) ||
      emp.direccion?.toLowerCase().includes(searchLower) ||
      emp.giro?.toLowerCase().includes(searchLower) ||
      emp.representante_legal?.toLowerCase().includes(searchLower) ||
      emp.gerente_general?.toLowerCase().includes(searchLower)
    );
  }, [empresas, search]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta empresa Belray?')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      alert('Empresa eliminada exitosamente');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al eliminar empresa');
    }
  };

  const handleOpenDocuments = (empresa: any) => {
    setSelectedEmpresa(empresa);
    setShowDocumentsModal(true);
  };

  const handleCloseDocuments = () => {
    setSelectedEmpresa(null);
    setShowDocumentsModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedEmpresa) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('documento', file);
    
    try {
      setUploadingFile(true);
      await uploadMutation.mutateAsync({ id: selectedEmpresa.id, formData });
      alert('Documento subido exitosamente');
      e.target.value = ''; // Reset input
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al subir documento');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el documento "${filename}"?`)) return;
    if (!selectedEmpresa) return;
    
    try {
      await deleteDocMutation.mutateAsync({ id: selectedEmpresa.id, filename });
      alert('Documento eliminado exitosamente');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al eliminar documento');
    }
  };

  const handleDownloadDocument = async (filename: string) => {
    if (!selectedEmpresa) return;
    
    try {
      const blob = await apiService.downloadBelrayDocument(selectedEmpresa.id, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al descargar documento');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Cargando empresas Belray...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">Error al cargar empresas Belray</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header con búsqueda y botón agregar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Empresa
          </button>
        </div>

        {/* Lista de empresas */}
        {filteredEmpresas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {search ? 'No se encontraron empresas' : 'No hay empresas Belray registradas'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmpresas.map((empresa: any) => (
              <div
                key={empresa.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{empresa.nombre || 'Sin nombre'}</h3>
                      <p className="text-xs text-gray-500">RUT: {empresa.rut_empresa || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  {empresa.giro && (
                    <p className="text-gray-600">
                      <span className="font-medium">Giro:</span> {empresa.giro}
                    </p>
                  )}
                  {empresa.direccion && (
                    <p className="text-gray-600">
                      <span className="font-medium">Dirección:</span> {empresa.direccion}
                    </p>
                  )}
                  {empresa.numero_telefono && (
                    <p className="text-gray-600">
                      <span className="font-medium">Teléfono:</span> {empresa.numero_telefono}
                    </p>
                  )}
                  {empresa.correo_electronico && (
                    <p className="text-gray-600">
                      <span className="font-medium">Email:</span> {empresa.correo_electronico}
                    </p>
                  )}
                  {empresa.representante_legal && (
                    <p className="text-gray-600">
                      <span className="font-medium">Rep. Legal:</span> {empresa.representante_legal}
                    </p>
                  )}
                  {empresa.numero_trabajadores_obra && (
                    <p className="text-gray-600">
                      <span className="font-medium">N° Trabajadores:</span> {empresa.numero_trabajadores_obra}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenDocuments(empresa)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    title="Ver documentos"
                  >
                    <FileText className="h-4 w-4" />
                    Documentos
                  </button>
                  <button
                    onClick={() => onEditClick(empresa)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    title="Editar empresa"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(empresa.id)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                    title="Eliminar empresa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de documentos */}
      {showDocumentsModal && selectedEmpresa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Documentos - {selectedEmpresa.nombre}
                </h2>
                <p className="text-sm text-gray-500">RUT: {selectedEmpresa.rut_empresa || 'N/A'}</p>
              </div>
              <button
                onClick={handleCloseDocuments}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Upload section */}
              <div className="mb-6">
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border-2 border-dashed border-blue-300">
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">
                    {uploadingFile ? 'Subiendo...' : 'Subir Documento'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                </label>
              </div>

              {/* Documents list */}
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-gray-600">Cargando documentos...</span>
                </div>
              ) : !documents || documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay documentos para esta empresa
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 truncate">
                          {doc.filename || doc.nombre || doc}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleDownloadDocument(doc.filename || doc.nombre || doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.filename || doc.nombre || doc)}
                          disabled={deleteDocMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleCloseDocuments}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
