import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { X } from 'lucide-react';
import apiService from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clienteId: number | null;
  rut: string | null;
  prereqData: any | null;
  onAfterAssign?: () => void;
  onOpenUpload?: () => void;
}

export const PrereqAssignModal: React.FC<Props> = ({ isOpen, onClose, clienteId, rut, prereqData, onAfterAssign, onOpenUpload }) => {
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  if (!isOpen || !clienteId || !rut || !prereqData) return null;

  // El backend puede devolver un array de resultados por rut o un objeto.
  // Normalizar a un solo objeto para uso en la UI.
  const entry = Array.isArray(prereqData) ? (prereqData[0] || {}) : (prereqData || {});

  // faltantes puede venir como `faltantes: string[]` o como `missing_docs: [{ value, label, required }]`
  const missingDocsList: any[] = entry?.missing_docs || [];
  const faltantes: string[] = Array.isArray(entry?.faltantes) ? entry.faltantes : (missingDocsList.length ? missingDocsList.map((m: any) => m.value || m) : []);
  const requisitos = entry?.requisitos || [];
  const documentos = entry?.documentos || [];

  const handleForceAssign = async () => {
    setLoading(true);
    try {
      const resp: any = await apiService.assignClienteToPersona(rut, clienteId, { enforce: true });
      // Backend may return payload even on conflict; treat as success if payload indicates assignment
      if (resp && resp.success === false && resp.data && resp.data.cliente_id) {
        // server returned structured payload; treat as informative
      }
      alert('Asignación forzada realizada. Refresque la lista si es necesario.');
      onClose();
      if (onAfterAssign) onAfterAssign();
    } catch (e: any) {
      alert(e?.message || 'Error al forzar asignación');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpload = () => {
    onClose();
    if (onOpenUpload) onOpenUpload();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Revisión de prerrequisitos para ${rut}`} size="lg">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Faltantes: {faltantes.length} {typeof entry?.provided_count !== 'undefined' || typeof entry?.required_count !== 'undefined' ? `• ${entry?.provided_count ?? documentos.length} / ${entry?.required_count ?? '?'} requisitos cumplidos` : ''}</h3>
            <p className="text-sm text-gray-600">Cliente ID: {clienteId} • RUT: {rut}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X /></button>
        </div>

        {faltantes.length === 0 ? (
          <div className="text-sm text-green-700">No hay faltantes. El personal cumple los prerrequisitos.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Documentos faltantes:</div>
            <ul className="list-disc list-inside text-sm text-gray-800 max-h-48 overflow-y-auto border rounded p-2 bg-white">
              {missingDocsList.length > 0 ? (
                missingDocsList.map((m: any, idx: number) => (
                  <li key={idx}>{m.label || m.value || JSON.stringify(m)}{m.required ? ' (obligatorio)' : ''}</li>
                ))
              ) : (
                faltantes.map((f: any, idx: number) => (
                  <li key={idx}>{typeof f === 'string' ? f : JSON.stringify(f)}</li>
                ))
              )}
            </ul>

            <div className="text-sm text-gray-500">Requisitos originales:</div>
            <ul className="text-xs text-gray-600 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
              {requisitos.map((r: any, i: number) => (
                <li key={i}>{r.tipo_documento || r.tipo || r.nombre_documento || JSON.stringify(r)}</li>
              ))}
            </ul>

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-3 py-2 bg-white border rounded text-sm">Cancelar</button>
              <button onClick={handleOpenUpload} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">Ir a subir documentos</button>
              <button onClick={handleForceAssign} disabled={loading} className="px-3 py-2 bg-red-600 text-white rounded text-sm">{loading ? 'Forzando...' : 'Forzar asignación'}</button>
            </div>
          </div>
        )}

        {/* Debug toggle para ver JSON crudo y facilitar diagnóstico */}
        <div className="mt-4 border-t pt-3">
          <button onClick={() => setShowDebug(s => !s)} className="text-xs text-gray-600 underline">{showDebug ? 'Ocultar datos (debug)' : 'Ver datos (debug)'}</button>
          {showDebug && (
            <pre className="mt-2 p-2 bg-gray-800 text-white text-xs overflow-auto max-h-64 rounded">{JSON.stringify(entry || prereqData, null, 2)}</pre>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PrereqAssignModal;
