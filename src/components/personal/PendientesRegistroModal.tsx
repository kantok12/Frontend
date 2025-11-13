import React, { useEffect, useMemo, useState } from 'react';
import { FileText, X, Check } from 'lucide-react';

interface PendientesRegistroModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentos: any[];
  // Documentos ya registrados (para comparar)
  existingDocs?: any[];
  // En este flujo, el usuario solo selecciona el archivo (sin tipo)
  onSelect: (file: any, displayName: string) => void;
}

const PendientesRegistroModal: React.FC<PendientesRegistroModalProps> = ({
  isOpen,
  onClose,
  documentos,
  existingDocs,
  onSelect,
}) => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { setItems(documentos || []); }, [JSON.stringify(documentos)]);

  // Always show only pendientes (no mostrar archivos ya registrados)
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getKey = (f: any) => (f.id || f.drive_id || f.fileId || f.path || f.ruta || f.nombre_archivo || f.nombre_original || f.title || f.name || '') + '|' + (f.size || f.tamaño_bytes || '');

  const total = useMemo(() => items.length, [items]);

  // Annotate items with registration status using existingDocs
  const annotated = useMemo(() => {
    const existingArr: any[] = existingDocs || [];
    const driveIdSet = new Set(existingArr.map((d: any) => String(d.drive_file_id || d.driveId || d.fileId || '').trim()).filter(Boolean));
    // Normalize names by stripping timestamp-like suffixes to match backend renames
    const stripTimestampSuffix = (filename: string) => {
      if (!filename) return '';
      const idx = filename.lastIndexOf('.');
      const name = idx === -1 ? filename : filename.substring(0, idx);
      const ext = idx === -1 ? '' : filename.substring(idx);

      // Normalizar y eliminar sufijos comunes que resultan de renombrados automáticos
      // - sufijos numéricos: _123456, -20251110, _1617181920
      // - marcas de copia: (1), (2), - copia, - copy, _copy
      // - sufijos con guiones/underscores
      let stripped = name
        .replace(/[\u0300-\u036f]/g, '') // quitar diacríticos por si acaso
        .replace(/[_-]\d{6,}$/, '') // largas secuencias numéricas al final
        .replace(/[_-]\d+(?:_\d+)?$/, '') // _123 o -123_456
        .replace(/\s*\(\d+\)$/, '') // (1) (2)
        .replace(/\s*-\s*copia$/i, '') // - copia
        .replace(/\s*-\s*copy$/i, '') // - copy
        .replace(/_copy$/i, '') // _copy
        .replace(/\s*\[\d+\]$/, '') // [1]
        .replace(/\s+$/,'')
        .trim();

      // También collapse repeated spaces and replace with single underscore for stable comparison
      stripped = stripped.replace(/\s+/g, '_');

      return (stripped + ext).toString().trim();
    };

  const nameSet = new Set(existingArr.map((d: any) => stripTimestampSuffix(String(d.nombre_archivo || d.nombre_original || d.name || d.title || '').trim()).toLowerCase()).filter(Boolean));

    return items.map((f) => {
      const fileId = String(f.id || f.drive_id || f.fileId || '').trim();
      const filename = String(f.nombre_original || f.nombre_archivo || f.name || f.title || f.filename || '').trim();
      const normalizedFilename = stripTimestampSuffix(filename).toLowerCase();
      const isRegistered = Boolean(
        (fileId && driveIdSet.has(fileId)) ||
        (normalizedFilename && nameSet.has(normalizedFilename))
      );
      return { file: f, displayName: filename || `Archivo`, isRegistered };
    });
  }, [items, existingDocs]);

  // Only show items that are not registered
  const itemsToShow = useMemo(() => annotated.filter(a => !a.isRegistered), [annotated]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Pendientes de registro ({total})</h3>
            {/* Se muestran sólo pendientes — archivos ya registrados se ocultan */}
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
          {itemsToShow.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No hay archivos para mostrar.</div>
          ) : (
            <div className="space-y-2">
              {itemsToShow.map((a: any, idx: number) => {
                const f = a.file;
                const displayName = a.displayName || (f.nombre_original || f.nombre_archivo || f.name || f.title || `Archivo ${idx+1}`);
                const key = getKey(f) + '|' + idx;

                // Detectar si es un archivo de curso/certificación por la carpeta (heurístico)
                const carpeta = (f?.carpeta || f?.folder || '').toString().toLowerCase();
                const isCurso = carpeta.includes('curso') || carpeta.includes('certific') || carpeta.includes('cursos_certificaciones');

                return (
                  <div key={key} className="flex items-center justify-between bg-white border rounded p-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className={`h-4 w-4 ${isCurso ? 'text-purple-600' : 'text-amber-600'}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate" title={displayName}>{displayName}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{f.mimeType || f.tipo_mime || ''}</span>
                          {f.size ? <span>• {(f.size/1024).toFixed(1)} KB</span> : null}
                          {a.isRegistered ? (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Registrado</span>
                          ) : (
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${isCurso ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>Pendiente</span>
                          )}
                        </div>
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
                        className={`px-3 py-1 text-white rounded text-sm disabled:opacity-60 ${isCurso ? 'bg-purple-600 hover:bg-purple-700' : 'bg-amber-600 hover:bg-amber-700'}`}
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
