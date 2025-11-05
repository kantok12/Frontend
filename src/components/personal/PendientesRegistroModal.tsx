import React, { useEffect, useMemo, useState } from 'react';
import { FileText, X, Check } from 'lucide-react';

interface PendientesRegistroModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentos: any[];
  // En este flujo, el usuario solo selecciona el archivo (sin tipo)
  onSelect: (file: any, displayName: string) => void;
}

const PendientesRegistroModal: React.FC<PendientesRegistroModalProps> = ({
  isOpen,
  onClose,
  documentos,
  onSelect,
}) => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { setItems(documentos || []); }, [JSON.stringify(documentos)]);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getKey = (f: any) => (f.id || f.drive_id || f.fileId || f.path || f.ruta || f.nombre_archivo || f.nombre_original || f.title || f.name || '') + '|' + (f.size || f.tamaño_bytes || '');

  const total = useMemo(() => items.length, [items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">Pendientes de registro ({total})</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
          {total === 0 ? (
            <div className="text-center text-gray-500 py-8">No hay archivos pendientes.</div>
          ) : (
            <div className="space-y-2">
              {items.map((f: any, idx: number) => {
                const displayName = f.nombre_original || f.nombre_archivo || f.name || f.title || f.filename || `Archivo ${idx + 1}`;
                const key = getKey(f);
                return (
                  <div key={key} className="flex items-center justify-between bg-white border rounded p-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate" title={displayName}>{displayName}</div>
                        <div className="text-xs text-gray-500">{f.mimeType || f.tipo_mime || ''} {f.size ? `• ${(f.size/1024).toFixed(1)} KB` : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setLoadingId(key);
                          try {
                            onSelect(f, displayName);
                          } finally {
                            setLoadingId(null);
                          }
                        }}
                        className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 disabled:opacity-60"
                        disabled={!!loadingId}
                        title={`Seleccionar ${displayName}`}
                      >
                        {loadingId === key ? 'Seleccionando...' : (
                          <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" /> Seleccionar</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default PendientesRegistroModal;
