import React, { useState, useMemo } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, Eye, X } from 'lucide-react';
import { useBelrayList, useDeleteBelray } from '../../hooks/useBelray';
import { LoadingSpinner } from '../common/LoadingSpinner';
import apiService from '../../services/api';

interface BelrayListProps {
  onAddClick: () => void;
  onEditClick: (empresa: any) => void;
}

export const BelrayList: React.FC<BelrayListProps> = ({ onAddClick, onEditClick }) => {
  const [search, setSearch] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<any | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewEmpresa, setViewEmpresa] = useState<any | null>(null);

  const { data: empresas, isLoading, error } = useBelrayList();

  const deleteMutation = useDeleteBelray();

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

  const handleToggleExpand = (id: number, empresa?: any) => {
    setExpandedId(prev => {
      const next = prev === id ? null : id;
      if (next === id && empresa) setSelectedEmpresa(empresa);
      if (next === null) setSelectedEmpresa(null);
      return next;
    });
  };

  // removed separate modal: documents open inside card dropdown via handleToggleExpand

  // documents UI removed from panel; keep selectedEmpresa for view modal

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
            {filteredEmpresas.map((empresa: any) => {
              const expanded = expandedId === empresa.id;
              return (
                <div
                  key={empresa.id}
                  className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow flex h-80 relative overflow-hidden`}
                >
                  <div className="flex-1 flex flex-col p-4">
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

                    <div className="space-y-2 mb-4 text-sm flex-1 overflow-hidden">
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
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                      <button
                        onClick={() => handleToggleExpand(empresa.id, empresa)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        title="Mostrar"
                      >
                        Mostrar
                      </button>

                      <button
                        onClick={() => onEditClick(empresa)}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        title="Editar empresa"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setViewEmpresa(empresa); setShowViewModal(true); }}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                        title="Ver empresa"
                      >
                        <Eye className="h-4 w-4" />
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

                  {/* Inline dropdown panel inside the card (fixed height, scrollable) */}
                    {expanded && (
                      <div className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200 p-4 h-40 overflow-auto z-10">
                        <div className="text-sm text-gray-700">
                          {empresa.giro && (
                            <p className="mb-2"><span className="font-medium">Giro:</span> {empresa.giro}</p>
                          )}
                          {empresa.correo_electronico && (
                            <p><span className="font-medium">Email:</span> {empresa.correo_electronico}</p>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Read-only view modal for empresa details */}
      {showViewModal && viewEmpresa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold">{viewEmpresa.nombre || 'Empresa'}</h3>
                <p className="text-xs text-gray-500">RUT: {viewEmpresa.rut_empresa || 'N/A'}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {Object.entries(viewEmpresa).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</div>
                  <div className="text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
