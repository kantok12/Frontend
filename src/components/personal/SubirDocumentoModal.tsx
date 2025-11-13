import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, FileText, Upload, Save, Calendar, User } from 'lucide-react';
import UploadOptionsModal from './UploadOptionsModal';
import PendientesRegistroModal from './PendientesRegistroModal';
import { useDocumentosByPersona, useRegisterDocumentoExistente, useUploadDocumento } from '../../hooks/useDocumentos';
import { createDocumentoFormData, validateDocumentoData } from '../../hooks/useDocumentos';
import { CreateDocumentoData } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useAllPrerrequisitos } from '../../hooks/useGestionPrerrequisitos';

interface SubirDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rutPersona: string;
  nombrePersona: string;
}

const SubirDocumentoModal: React.FC<SubirDocumentoModalProps> = ({ isOpen, onClose, onSuccess, rutPersona, nombrePersona }) => {
  const initialFormState = () => ({
    nombre_documento: '',
    tipo_documento: '',
    archivo: null as File | null,
    fecha_emision_documento: '',
    fecha_vencimiento_documento: '',
    dias_validez_documento: '',
    estado_documento: '',
    institucion_emisora: '',
  });

  const [formData, setFormData] = useState(initialFormState());
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedPrerrequisitos, setSelectedPrerrequisitos] = useState<string[]>([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPendientesModal, setShowPendientesModal] = useState(false);
  const [selectedPendiente, setSelectedPendiente] = useState<{ file: any; displayName: string } | null>(null);

  const uploadMutation = useUploadDocumento();
  const registerExistingMutation = useRegisterDocumentoExistente();
  const { data: documentosPersonaData, refetch: refetchDocumentosPersona } = useDocumentosByPersona(rutPersona);
  const documentosData: any = (documentosPersonaData as any)?.data || {};
  const split = documentosData.documentos_locales_split || null;
  // Para la ventana de subir documentos (general), mostrar sólo los documentos comunes (no cursos)
  const documentosLocales: any[] = split ? (split.documentos || []) : (documentosData.documentos_locales || []);
  // Documentos ya registrados en la aplicación (puede venir en data.documentos o ser la propia data cuando es un array)
  const existingDocs: any[] = documentosData.documentos || (Array.isArray(documentosData) ? documentosData : []);

  const { data: prerrequisitos } = useAllPrerrequisitos();

  const isLoading = uploadMutation.isLoading || registerExistingMutation.isLoading;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const triggerFileSelect = () => fileInputRef.current?.click();
  const triggerSelectPending = () => setShowPendientesModal(true);

  useEffect(() => { if (formData.archivo) setShowOptionsModal(false); }, [formData.archivo]);

  const toUTCDate = (dateStr: string) => {
    const [y, m, d] = (dateStr || '').split('-').map((n) => parseInt(n, 10));
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, (m - 1), d, 0, 0, 0));
  };
  const diffDaysUTC = (fromStr: string, toStr: string) => {
    const from = toUTCDate(fromStr);
    const to = toUTCDate(toStr);
    if (!from || !to) return NaN;
    const ms = to.getTime() - from.getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  };
  const getEstadoFromVencimiento = (vencStr?: string) => {
    if (!vencStr) return 'sin_fecha';
    const hoy = new Date();
    const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
    const vencUTC = toUTCDate(vencStr);
    if (!vencUTC) return 'sin_fecha';
    const diff = Math.round((vencUTC.getTime() - hoyUTC.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'vencido';
    const THRESHOLD_POR_VENCER = 30;
    if (diff <= THRESHOLD_POR_VENCER) return 'por_vencer';
    return 'vigente';
  };

  useEffect(() => {
    const { fecha_emision_documento, fecha_vencimiento_documento } = formData;
    let nextDias = formData.dias_validez_documento;
    if (fecha_emision_documento && fecha_vencimiento_documento) {
      const days = diffDaysUTC(fecha_emision_documento, fecha_vencimiento_documento);
      if (!Number.isNaN(days)) {
        const daysStr = String(days);
        if (daysStr !== formData.dias_validez_documento) nextDias = daysStr;
      }
    }
    const nextEstado = getEstadoFromVencimiento(formData.fecha_vencimiento_documento || undefined);
    if (nextDias !== formData.dias_validez_documento || nextEstado !== formData.estado_documento) {
      setFormData((prev) => ({ ...prev, dias_validez_documento: nextDias, estado_documento: nextEstado }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fecha_emision_documento, formData.fecha_vencimiento_documento]);

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
    setErrors([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleInputChange('archivo', file);
  };

  const resetModalState = () => {
    setFormData(initialFormState());
    setSelectedPendiente(null);
    setErrors([]);
    setShowOptionsModal(false);
    setShowPendientesModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleClose = () => { resetModalState(); onClose(); };

  const tiposDocumentoUnicos = useMemo(() => {
    const tiposEstaticos = ["cv", "epp", "examen_preocupacional", "otro"];
    const tiposDinamicos = prerrequisitos?.map(p => p.tipo_documento.toLowerCase()) || [];
    return Array.from(new Set([...tiposEstaticos, ...tiposDinamicos]));
  }, [prerrequisitos]);

  // Helper: unique prerrequisitos tipos (texto) available
  const prerrequisitosTiposUnicos = useMemo(() => {
    if (!prerrequisitos) return [] as string[];
    return Array.from(new Set(prerrequisitos.map((p: any) => p.tipo_documento)));
  }, [prerrequisitos]);

  const shouldShowPrerrequisitosPicker = useMemo(() => {
    if (!formData.tipo_documento) return false;
    const tipo = formData.tipo_documento.toString().toLowerCase();
    if (tipo === 'prerrequisitos') return true;
    // show if selected tipo matches any prerrequisito tipo (case-insensitive)
    return prerrequisitosTiposUnicos.some(t => t.toLowerCase() === tipo);
  }, [formData.tipo_documento, prerrequisitosTiposUnicos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reglas básicas
    if (!formData.nombre_documento || formData.nombre_documento.trim() === '') {
      setErrors(['El nombre del documento es obligatorio.']);
      return;
    }
    if (!formData.archivo && !selectedPendiente) {
      setErrors(['Debes seleccionar un archivo (desde tu equipo o desde pendientes).']);
      return;
    }
    // No mezclar local + pendiente
    if (formData.archivo && selectedPendiente) {
      setErrors(['No puedes subir un archivo y seleccionar uno pendiente al mismo tiempo.']);
      return;
    }

    try {
      if (formData.archivo) {
        const data: CreateDocumentoData = {
          personal_id: rutPersona, // backend espera rut_persona en formData helper
          nombre_documento: formData.nombre_documento,
          tipo_documento: formData.tipo_documento || undefined,
          archivo: formData.archivo,
          fecha_emision: formData.fecha_emision_documento || undefined,
          fecha_vencimiento: formData.fecha_vencimiento_documento || undefined,
          dias_validez: formData.dias_validez_documento ? parseInt(formData.dias_validez_documento) : undefined,
          estado_documento: formData.estado_documento || undefined,
          institucion_emisora: formData.institucion_emisora || undefined,
        };
        // Añadir prerrequisitos seleccionados si los hay
        if (selectedPrerrequisitos && selectedPrerrequisitos.length > 0) {
          (data as any).prerrequisitos = selectedPrerrequisitos;
        }
        const docErrors = validateDocumentoData(data);
        if (docErrors.length > 0) { setErrors(docErrors); return; }
        const payload = createDocumentoFormData(data);
        await uploadMutation.mutateAsync(payload);
      }
      if (selectedPendiente) {
        await registerExistingMutation.mutateAsync({
          rut_persona: rutPersona,
          file: selectedPendiente.file,
          nombre_documento: formData.nombre_documento,
          tipo_documento: formData.tipo_documento || undefined,
          fecha_emision: formData.fecha_emision_documento || undefined,
          fecha_vencimiento: formData.fecha_vencimiento_documento || undefined,
          dias_validez: formData.dias_validez_documento ? parseInt(formData.dias_validez_documento) : undefined,
          estado_documento: formData.estado_documento || undefined,
          institucion_emisora: formData.institucion_emisora || undefined,
          prerrequisitos: selectedPrerrequisitos && selectedPrerrequisitos.length > 0 ? selectedPrerrequisitos : undefined,
        });
        await refetchDocumentosPersona();
      }

      onSuccess();
      resetModalState();
      onClose();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error al subir documento:', err);
      setErrors([err?.message || 'No se pudo subir el documento.']);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-5 rounded-t-xl flex items-start justify-between">
          <div className="flex items-center">
            <FileText className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Subir Documento</h2>
              <p className="text-orange-100 text-sm">
                {nombrePersona} ({rutPersona})
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white hover:text-orange-200 transition-colors p-1 rounded-full hover:bg-white/20" disabled={isLoading}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((e) => (<li key={e}>{e}</li>))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Documento *</label>
              <input
                type="text"
                value={formData.nombre_documento}
                onChange={(e) => handleInputChange('nombre_documento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ej: Contrato de Trabajo 2024"
                required
                disabled={isLoading}
              />
            </div>

            {/* Tipo de documento (seleccionable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento *</label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={isLoading}
              >
                <option value="">Seleccione un tipo de documento</option>
                {tiposDocumentoUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Seleccione el tipo de documento que desea subir.
              </p>
            </div>

            {/* Prerrequisitos picker: aparece cuando el tipo seleccionado es prerrequisitos o coincide con un tipo definido en prerrequisitos */}
            {shouldShowPrerrequisitosPicker && (
              <div className="mt-3 p-3 border border-dashed rounded bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">Prerrequisitos asociados (marque los aplicables)</label>
                {prerrequisitosTiposUnicos.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay prerrequisitos definidos.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {prerrequisitosTiposUnicos.map((tipo: string) => (
                      <label key={tipo} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPrerrequisitos.includes(tipo)}
                          onChange={() => {
                            setSelectedPrerrequisitos(prev => prev.includes(tipo) ? prev.filter(p => p !== tipo) : [...prev, tipo]);
                          }}
                        />
                        <span>{tipo}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-400">Los prerrequisitos seleccionados se enviarán como parte del documento.</p>
              </div>
            )}

            {/* Subida/selección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Archivo</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-orange-400 transition-colors">
                <div className="space-y-1 text-center relative">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setShowOptionsModal(true)}
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-orange-600 hover:bg-gray-50 focus:outline-none"
                      disabled={isLoading}
                    >
                      Subir archivo
                    </button>
                    <p className="pl-3 text-sm text-gray-600">o arrastra y suelta</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, JPG, JPEG, PNG hasta 5MB</p>
                  <input ref={fileInputRef} id="file-upload-doc" name="file-upload-doc" type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} disabled={isLoading} />
                </div>
              </div>
              {formData.archivo && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 flex items-center">
                    <FileText className="h-4 w-4 mr-2" /> {formData.archivo.name}
                  </p>
                </div>
              )}
              {!formData.archivo && selectedPendiente && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between">
                  <p className="text-sm text-amber-800 flex items-center">
                    <FileText className="h-4 w-4 mr-2" /> Archivo seleccionado (Drive): {selectedPendiente.displayName}
                  </p>
                  <button type="button" onClick={() => setSelectedPendiente(null)} className="text-xs px-2 py-1 border rounded hover:bg-amber-100">Quitar</button>
                </div>
              )}
            </div>

            {/* Validez */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Información de Validez</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Emisión</label>
                  <input type="date" value={formData.fecha_emision_documento} onChange={(e) => handleInputChange('fecha_emision_documento', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" disabled={isLoading} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Vencimiento</label>
                  <input type="date" value={formData.fecha_vencimiento_documento} onChange={(e) => handleInputChange('fecha_vencimiento_documento', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" disabled={isLoading} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Días de Validez</label>
                  <input type="number" min="1" value={formData.dias_validez_documento} onChange={(e) => handleInputChange('dias_validez_documento', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder={formData.fecha_emision_documento && formData.fecha_vencimiento_documento ? 'Calculado automáticamente' : 'Ej: 365'} disabled={isLoading || (!!formData.fecha_emision_documento && !!formData.fecha_vencimiento_documento)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Documento</label>
                  <select value={formData.estado_documento} onChange={(e) => handleInputChange('estado_documento', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" disabled={isLoading}>
                    <option value="">Seleccionar estado</option>
                    <option value="vigente">Vigente</option>
                    <option value="vencido">Vencido</option>
                    <option value="por_vencer">Por Vencer</option>
                    <option value="sin_fecha">Sin Fecha</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Institución Emisora</label>
                <input type="text" value={formData.institucion_emisora} onChange={(e) => handleInputChange('institucion_emisora', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Ej: Ministerio del Trabajo, SII, etc." disabled={isLoading} />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" disabled={isLoading}>Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? (<><LoadingSpinner /><span className="ml-2">Subiendo...</span></>) : (<><Save className="h-4 w-4 mr-2" /> Subir Documento</>)}
            </button>
          </div>
        </form>
      </div>

      {/* Ventanas auxiliares */}
      <UploadOptionsModal isOpen={showOptionsModal} onClose={() => setShowOptionsModal(false)} onSubirDesdeEquipo={triggerFileSelect} onSeleccionarPendiente={triggerSelectPending} />
    <PendientesRegistroModal
      isOpen={showPendientesModal}
      onClose={() => setShowPendientesModal(false)}
      documentos={documentosLocales} /* documentos generales (no cursos) */
      existingDocs={existingDocs}
      onSelect={async (f, displayName) => {
            // Registro inmediato del archivo seleccionado como existente
            setShowPendientesModal(false);
            setSelectedPendiente({ file: f, displayName });

            try {
              // Construir payload mínimo según docs
              await registerExistingMutation.mutateAsync({
                rut_persona: rutPersona,
                file: f,
                nombre_documento: formData.nombre_documento || displayName || (f.nombre_original || f.nombre_archivo || f.name || f.title),
                tipo_documento: formData.tipo_documento || 'otro',
                fecha_emision: formData.fecha_emision_documento || undefined,
                fecha_vencimiento: formData.fecha_vencimiento_documento || undefined,
                dias_validez: formData.dias_validez_documento ? parseInt(formData.dias_validez_documento) : undefined,
                estado_documento: formData.estado_documento || undefined,
                institucion_emisora: formData.institucion_emisora || undefined,
              });

              // Refrescar documentos de la persona para que el UI muestre el nuevo registro
              await refetchDocumentosPersona();
            } catch (err: any) {
              // Mostrar error en pantalla
              // eslint-disable-next-line no-console
              console.error('Error al registrar pendiente automáticamente:', err);
              setErrors([err?.message || 'Error al registrar el documento pendiente.']);
              // dejar selectedPendiente para permitir reintento manual
            }
          }}
      />
    </div>
  );
};

export default SubirDocumentoModal;
