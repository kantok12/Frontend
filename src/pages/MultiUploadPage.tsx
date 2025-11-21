import React, { useEffect, useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { usePersonalList } from '../hooks/usePersonal';
import { useUploadDocumento, useTiposDocumentos, createDocumentoFormData, validateDocumentoData, getTiposDocumentosCursos, getTiposDocumentosPersonal } from '../hooks/useDocumentos';
import { mapTipoDocumentoToFolder, folderLabel } from '../utils/documentFolders';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const MultiUploadPage: React.FC = () => {
  const [selectedRuts, setSelectedRuts] = useState<string[]>([]);
  // Soporte para múltiples archivos: cada entrada tiene el file, nombre destino y tipo
  const [files, setFiles] = useState<Array<{ file: File; nombre_destino: string; tipo: string; prerrequisitos?: number[]; carpeta_destino?: string }>>([]);
  const [prerrequisitosOptions, setPrerrequisitosOptions] = useState<Array<any>>([]);
  // (No global default tipo — cada archivo elegirá su propio tipo)
  const [errors, setErrors] = useState<string[]>([]);
  const [results, setResults] = useState<Array<{ rut: string; success: boolean; message?: string }>>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Load personal list (server supports pagination) — start with page 1
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10; // show 10 per page as requested
  // Pass search term to hook so backend can filter; reset to page 1 when search changes
  const { data: personalData, isLoading } = usePersonalList(page, pageSize, search);
  const personas = personalData?.data?.items || [];
  const total = personalData?.data?.total || personas.length;

  const uploadMutation = useUploadDocumento();
  const tiposQuery = useTiposDocumentos();

  const tiposBackend = tiposQuery.data?.data || [];
  const [openTypeIndex, setOpenTypeIndex] = useState<number | null>(null);
  const [defaultType, setDefaultType] = useState<string>('');
  const [defaultFolder, setDefaultFolder] = useState<string>('');

  // No category separation: all tipos se muestran juntos

  // If category changes and there is a single available type, preselect it
  useEffect(() => {
    const opts = getAvailableTypesFor();
    if (opts && opts.length === 1) setDefaultType(opts[0].value || opts[0]);
    else setDefaultType('');
  }, [tiposBackend]);

  const getAvailableTypesFor = () => {
    // Return all available types (no separation by category)
    if (tiposBackend && tiposBackend.length > 0) return tiposBackend;
    // Fallback: combine both defaults
    return [...getTiposDocumentosPersonal(), ...getTiposDocumentosCursos()];
  };

  // (Removed prerrequisitos panel per request — only files are shown)

  const toggleRut = (rut: string) => setSelectedRuts(prev => prev.includes(rut) ? prev.filter(r => r !== rut) : [...prev, rut]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) return;
    // require a default type before allowing selection so files inherit a valid tipo
    if (!defaultType || defaultType.trim() === '') {
      setErrors(["Selecciona un 'Tipo por defecto' antes de elegir archivos."]);
      return;
    }
    const entries = chosen.map(f => ({
      file: f,
      nombre_destino: f.name,
      tipo: defaultType,
      carpeta_destino: defaultFolder ? defaultFolder : (defaultType ? mapTipoDocumentoToFolder(defaultType) : undefined)
    }));
    setFiles(prev => [...prev, ...entries]);
    // reset input so same files can be reselected if needed
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFileAt = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileField = (index: number, patch: Partial<{ nombre_destino: string; tipo: string; categoria?: 'personal' | 'cursos'; prerrequisitos?: number[]; carpeta_destino?: string }>) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
  };

  // Helper to load global prerrequisitos once
  const loadGlobalPrerrequisitosIfNeeded = async () => {
    if (prerrequisitosOptions.length > 0) return;
    try {
      const resp: any = await apiService.getGlobalPrerrequisitos();
      const rawList: any[] = resp?.data || resp || [];
      // Filtrar prerrequisitos indeseados (no mostrar en UI de MultiUpload)
      // Usar JSON stringify para capturar variantes en diferentes campos
      const filtered = rawList.filter((pr) => {
        try {
          const text = JSON.stringify(pr).toLowerCase();
          // Excluir cualquier prerrequisito que mencione 'carnet' o 'contrato' (palabras clave)
          if (text.includes('carnet')) return false;
          if (text.includes('contrato')) return false;
        } catch (e) {
          // Si no se puede serializar, intentar extraer campos comunes
          const label = (pr?.nombre || pr?.descripcion || pr?.label || pr?.name || '').toString().toLowerCase();
          if (label.includes('carnet') || label.includes('contrato')) return false;
        }
        return true;
      });
      setPrerrequisitosOptions(filtered);
    } catch (err) {
      console.error('Error loading global prerrequisitos via apiService:', err);
      setPrerrequisitosOptions([]);
    }
  };

  // Preload global prerrequisitos on mount so checkboxes are ready
  useEffect(() => {
    void loadGlobalPrerrequisitosIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setResults([]);

    if (files.length === 0) return setErrors(['Debes seleccionar al menos un archivo.']);
    // validar que todos los archivos tengan nombre destino
    for (const f of files) {
      if (!f.nombre_destino || f.nombre_destino.trim() === '') return setErrors(['Todos los archivos deben tener un nombre destino.']);
    }
    // validar que todos los archivos tengan tipo seleccionado (el backend requiere tipo_documento)
    for (const f of files) {
      if (!f.tipo || f.tipo.trim() === '') return setErrors(['Todos los archivos deben tener un tipo seleccionado. Selecciona el tipo en el campo "Tipo" de cada archivo.']);
    }
    if (selectedRuts.length === 0) return setErrors(['Selecciona al menos una persona.']);

  // Build list of upload promises: for each persona x cada archivo
  const tasks: Array<Promise<{ rut: string; fileName: string; success: boolean; message?: string }>> = [];

    for (const rut of selectedRuts) {
      for (const fEntry of files) {
        tasks.push((async () => {
            try {
              const data: any = {
                personal_id: rut,
                nombre_documento: fEntry.nombre_destino,
                tipo_documento: fEntry.tipo || undefined,
                archivo: fEntry.file,
                prerrequisitos: fEntry.prerrequisitos && fEntry.prerrequisitos.length ? fEntry.prerrequisitos : undefined,
                carpeta_destino: fEntry.carpeta_destino || undefined,
              };
              const v = validateDocumentoData(data);
              if (v.length) return { rut, fileName: fEntry.nombre_destino, success: false, message: v.join('; ') };
              const fd = createDocumentoFormData(data);
              await uploadMutation.mutateAsync(fd);
              return { rut, fileName: fEntry.nombre_destino, success: true };
            } catch (err: any) {
              return { rut, fileName: fEntry.nombre_destino, success: false, message: err?.message || 'Error' };
            }
        })());
      }
    }

    const settled = await Promise.all(tasks);
    // Aggregate results per rut (simplified: last status wins) and store detailed messages
    const byRut: Record<string, { success: boolean; messages: string[] }> = {};
    for (const r of settled) {
      if (!byRut[r.rut]) byRut[r.rut] = { success: true, messages: [] };
      if (!r.success) {
        byRut[r.rut].success = false;
        byRut[r.rut].messages.push(`${r.fileName}: ${r.message || 'Error'}`);
      } else {
        byRut[r.rut].messages.push(`${r.fileName}: OK`);
      }
    }
    const final = Object.entries(byRut).map(([rut, info]) => ({ rut, success: info.success, message: info.messages.join('; ') }));
    setResults(final);
  };

  if (isLoading) return <div className="flex justify-center p-8"><LoadingSpinner /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <FileText className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold">Subir archivo a múltiples personas</h1>
        </div>
        <Link to="/personal" className="text-sm text-blue-600">Volver a Personal</Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            <ul>
              {errors.map(e => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Selecciona los archivos abajo. Para cada archivo podrás elegir el tipo individualmente.</p>

            {/* La categoría se selecciona individualmente por archivo más abajo. */}

            {/* Se ha eliminado el selector global de tipo; elegir tipo por archivo más abajo. */}

            {/* Prerrequisitos panel eliminado — interfaz reducida a archivos y selección de personas */}

            <label className="block text-sm font-medium text-gray-700 mt-4">Archivos *</label>

            <div className="flex items-center space-x-3 mb-2">
              <label className="text-sm text-gray-600">Tipo por defecto:</label>
              <select value={defaultType} onChange={(e) => setDefaultType(e.target.value)} className="text-sm px-2 py-1 border rounded">
                <option value="">-- Seleccione tipo por defecto --</option>
                {getAvailableTypesFor().map((t: any) => (
                  <option key={t.value || t} value={t.value || t}>{t.label || t}</option>
                ))}
              </select>

              <label className="text-sm text-gray-600">Carpeta por defecto:</label>
              <select value={defaultFolder} onChange={(e) => setDefaultFolder(e.target.value)} className="text-sm px-2 py-1 border rounded">
                <option value="">(Inferir desde tipo)</option>
                <option value="documentos">{folderLabel('documentos')}</option>
                <option value="cursos_certificaciones">{folderLabel('cursos_certificaciones')}</option>
              </select>
            </div>
            
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFilesChange} multiple />

            {/* Lista editable de archivos añadidos */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((fEntry, idx) => (
                  <div key={`${fEntry.file.name}-${idx}`} className="p-3 border rounded bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{fEntry.file.name}</div>
                        <div className="text-xs text-gray-500 mb-2">Tamaño: {(fEntry.file.size / 1024).toFixed(0)} KB — Tipo MIME: {fEntry.file.type || '—'}</div>
                        {(() => {
                          const resolved = fEntry.carpeta_destino || (fEntry.tipo ? mapTipoDocumentoToFolder(fEntry.tipo) : (defaultFolder ? defaultFolder : mapTipoDocumentoToFolder(null)));
                          return (
                            <div className="text-xs mt-1">Subirá a: <span className="px-2 py-0.5 ml-2 bg-gray-100 rounded text-xs">{folderLabel(resolved as any)}</span></div>
                          );
                        })()}

                        <label className="text-xs text-gray-600">Nombre destino</label>
                        <input className="w-full px-2 py-1 border rounded text-sm" value={fEntry.nombre_destino} onChange={(e) => updateFileField(idx, { nombre_destino: e.target.value })} />

                        {/* Mostrar tipo por archivo (sin distinción de categoría) */}

                        <label className="text-xs text-gray-600 mt-2 block">Tipo</label>
                        {(() => {
                          const availableTypes = getAvailableTypesFor();
                          return (
                            <>
                              <select
                                className="w-full px-2 py-1 border rounded text-sm"
                                value={fEntry.tipo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateFileField(idx, { tipo: val });
                                }}
                              >
                                <option value="" disabled>Seleccione tipo...</option>
                                {availableTypes.map((t: any) => (
                                  <option key={t.value || t} value={t.value || t} title={t.label || t}>{t.label || t}</option>
                                ))}
                              </select>
                              {/* Indicador por archivo si no se ha seleccionado tipo */}
                              {(!fEntry.tipo || fEntry.tipo.trim() === '') && (
                                <div className="text-xs text-red-600 mt-1">Sin tipo seleccionado. Selecciona un tipo en este campo.</div>
                              )}
                            </>
                          );
                        })()}

                        {/* Selector para carpeta destino (override opcional) */}
                        <label className="text-xs text-gray-600 mt-2 block">Carpeta destino</label>
                        <select
                          className="w-full px-2 py-1 border rounded text-sm"
                          value={fEntry.carpeta_destino || ''}
                          onChange={(e) => updateFileField(idx, { carpeta_destino: e.target.value || undefined })}
                        >
                          <option value="">(Inferir desde tipo)</option>
                          <option value="documentos">{folderLabel('documentos')}</option>
                          <option value="cursos_certificaciones">{folderLabel('cursos_certificaciones')}</option>
                        </select>

                        {/* Mostrar directamente los nombres de prerrequisitos (sin requerir seleccionar "Prerrequisitos" en el select) */}
                        {prerrequisitosOptions.length > 0 && (
                          <div className="mt-2 border rounded p-2 bg-gray-50 max-h-40 overflow-y-auto">
                            {prerrequisitosOptions.map((pr: any) => {
                              const selected = files[idx].prerrequisitos || [];
                              const checked = selected.includes(pr.id);
                              const displayLabel = pr.nombre || pr.descripcion || pr.tipo_documento || pr.label || (pr.name) || `ID ${pr.id}`;
                              return (
                                <label key={pr.id} className="flex items-center space-x-2 py-1">
                                  <input type="checkbox" checked={checked} onChange={() => {
                                    const current = files[idx].prerrequisitos || [];
                                    if (checked) {
                                      updateFileField(idx, { prerrequisitos: current.filter((x: number) => x !== pr.id) });
                                    } else {
                                      updateFileField(idx, { prerrequisitos: [...current, pr.id] });
                                    }
                                  }} />
                                  <span className="text-sm">{displayLabel}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <button type="button" onClick={() => removeFileAt(idx)} className="text-red-600 hover:text-red-800">
                          <X />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Seleccionar personas *</label>
            <div className="border rounded p-2 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Mostrando {Math.min((page-1)*pageSize + 1, total)}-{Math.min(page*pageSize, total)} de {total}</div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Buscar por nombre o RUT"
                    className="text-sm px-2 py-1 border rounded w-56"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto p-1">
                {personas.map((p: any) => {
                  const id = (p.rut || p.id?.toString());
                  return (
                    <label key={id} className="flex items-center space-x-2 py-1 text-sm">
                      <input type="checkbox" checked={selectedRuts.includes(id)} onChange={() => toggleRut(id)} />
                      <span className="truncate">{p.nombre} {p.apellido} — {p.rut}</span>
                    </label>
                  );
                })}
              </div>

              {/* Pagination controls */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-2 py-1 bg-white border rounded text-sm">Anterior</button>
                </div>

                <div className="text-sm text-gray-600">Página {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>

                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(total / pageSize)), p+1))} disabled={page >= Math.ceil(total / pageSize)} className="px-2 py-1 bg-white border rounded text-sm">Siguiente</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button type="submit" disabled={uploadMutation.isLoading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {uploadMutation.isLoading ? (<><LoadingSpinner /><span className="ml-2">Subiendo...</span></>) : (<><Upload className="h-4 w-4 mr-2 inline" />Subir a {selectedRuts.length} persona{selectedRuts.length !== 1 ? 's' : ''}</>)}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded border">
            <h3 className="font-medium mb-2">Resultados</h3>
            <ul className="text-sm">
              {results.map(r => (
                <li key={r.rut} className={r.success ? 'text-green-700' : 'text-red-700'}>
                  {r.rut}: {r.success ? 'OK' : `Error - ${r.message}`}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Prerrequisitos handled inline per-file (no modal) */}
      </form>
    </div>
  );
};

export default MultiUploadPage;
