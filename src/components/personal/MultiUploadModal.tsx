import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, FileText, Upload, Save } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useUploadDocumento, useTiposDocumentos, createDocumentoFormData, validateDocumentoData } from '../../hooks/useDocumentos';
import { Personal, CreateDocumentoData } from '../../types';

interface MultiUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  personas: Personal[];
}

const MultiUploadModal: React.FC<MultiUploadModalProps> = ({ isOpen, onClose, onSuccess, personas }) => {
  const [selectedRuts, setSelectedRuts] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [results, setResults] = useState<Array<{ rut: string; success: boolean; message?: string }>>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = useUploadDocumento();
  const tiposQuery = useTiposDocumentos();

  useEffect(() => {
    if (!isOpen) {
      // reset
      setSelectedRuts([]);
      setFile(null);
      setNombreDocumento('');
      setTipoDocumento('');
      setErrors([]);
      setResults([]);
    }
  }, [isOpen]);

  const toggleRut = (rut: string) => {
    setSelectedRuts(prev => prev.includes(rut) ? prev.filter(r => r !== rut) : [...prev, rut]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setResults([]);

    if (!file) {
      setErrors(['Debes seleccionar un archivo.']);
      return;
    }
    if (!nombreDocumento || nombreDocumento.trim() === '') {
      setErrors(['El nombre del documento es obligatorio.']);
      return;
    }
    if (selectedRuts.length === 0) {
      setErrors(['Selecciona al menos una persona.']);
      return;
    }

    // Prepare payloads per persona
    const promises = selectedRuts.map(async (rut) => {
      try {
        const data: CreateDocumentoData = {
          personal_id: rut,
          nombre_documento: nombreDocumento,
          tipo_documento: tipoDocumento || undefined,
          archivo: file as File,
        };

        const vErrors = validateDocumentoData(data);
        if (vErrors.length > 0) {
          return { rut, success: false, message: vErrors.join('; ') };
        }

        const fd = createDocumentoFormData(data);
        await uploadMutation.mutateAsync(fd);
        return { rut, success: true };
      } catch (err: any) {
        const msg = err?.message || (err?.response?.data?.message) || 'Error desconocido';
        return { rut, success: false, message: msg };
      }
    });

    const settled = await Promise.all(promises);
    setResults(settled);

    // If at least one success, call onSuccess and close
    const anySuccess = settled.some(r => r.success);
    if (anySuccess) {
      onSuccess?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Subir archivo a múltiples personas</h2>
              <p className="text-blue-100 text-sm">Selecciona las personas y sube un único archivo que se asociará a cada una.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-200 transition-colors p-1 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <ul className="list-disc list-inside space-y-1">
                {errors.map(e => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Documento *</label>
              <input type="text" value={nombreDocumento} onChange={(e) => setNombreDocumento(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ej: Contrato de Trabajo 2024" />

              <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Tipo de Documento</label>
              <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">(No especificar)</option>
                {(tiposQuery.data?.data || []).map((t: any) => (
                  <option key={t.value || t} value={t.value || t}>{t.label || (t.charAt ? t : '')}</option>
                ))}
              </select>

              <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Archivo *</label>
              <div className="flex items-center space-x-3">
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                {file && <div className="text-sm text-gray-700">{file.name}</div>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Personas *</label>
              <div className="max-h-56 overflow-y-auto border rounded p-2 bg-gray-50">
                {personas.length === 0 ? (
                  <div className="text-sm text-gray-500">No hay personas disponibles</div>
                ) : (
                  personas.map(p => (
                    <label key={p.rut || p.id} className="flex items-center space-x-2 py-1 text-sm">
                      <input type="checkbox" checked={selectedRuts.includes(p.rut || p.id?.toString())} onChange={() => toggleRut(p.rut || p.id?.toString())} />
                      <span className="truncate">{p.nombre} {p.apellido} — {p.rut}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center" disabled={uploadMutation.isLoading}>
              {uploadMutation.isLoading ? (<><LoadingSpinner /><span className="ml-2">Subiendo...</span></>) : (<><Upload className="h-4 w-4 mr-2" /> Subir a {selectedRuts.length} persona{selectedRuts.length !== 1 ? 's' : ''}</>)}
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-6 p-3 bg-gray-50 border rounded">
              <h4 className="font-medium mb-2">Resultados</h4>
              <ul className="text-sm">
                {results.map(r => (
                  <li key={r.rut} className={r.success ? 'text-green-700' : 'text-red-700'}>
                    {r.rut}: {r.success ? 'OK' : `Error - ${r.message}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default MultiUploadModal;
