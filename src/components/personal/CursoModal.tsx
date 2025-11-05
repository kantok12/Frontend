import React, { useState, useEffect, useRef } from 'react';
import { X, GraduationCap, Calendar, Save, Upload, FileText } from 'lucide-react';
import { useCreateCurso, useUpdateCurso, validateCursoData } from '../../hooks/useCursos';
import { useUploadDocumento, validateDocumentoData, createDocumentoFormData, useDocumentosByPersona, useRegisterDocumentoExistente } from '../../hooks/useDocumentos';
import { Curso, CreateCursoData, UpdateCursoData, CreateDocumentoData } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import UploadOptionsModal from './UploadOptionsModal';
import PendientesRegistroModal from './PendientesRegistroModal';

interface CursoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  curso?: Curso | null; // Si se pasa un curso, es para editar
  rutPersona: string; // RUT de la persona para quien se agrega el curso
  nombrePersona: string; // Nombre de la persona para mostrar en el título
  personalId: string; // ID del personal para la API
}

export const CursoModal: React.FC<CursoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  curso = null,
  rutPersona,
  nombrePersona,
  personalId
}) => {
  const initialFormState = () => ({
    nombre_curso: '',
    fecha_inicio: '',
    fecha_fin: '',
    fecha_vencimiento: '',
    fecha_obtencion: '', // Campo legacy para compatibilidad
    estado: 'completado',
    institucion: '',
    descripcion: '',
    tipo_documento: '',
    archivo: null as File | null,
    // Campos de validez del documento
    fecha_emision_documento: '',
    fecha_vencimiento_documento: '',
    dias_validez_documento: '',
    estado_documento: '',
    institucion_emisora: '',
  });

  const [formData, setFormData] = useState(initialFormState());
  const [errors, setErrors] = useState<string[]>([]);

  const createMutation = useCreateCurso();
  const updateMutation = useUpdateCurso();
  const uploadMutation = useUploadDocumento();

  // Documentos locales (pendientes de registro) obtenidos desde Google Drive / almacenamiento externo
  const { data: documentosPersonaData, isLoading: loadingDocumentosPersona, refetch: refetchDocumentosPersona } = useDocumentosByPersona(rutPersona);
  const registerExistingMutation = useRegisterDocumentoExistente();

  // Extraer lista de archivos locales/pendientes según la estructura devuelta por el backend
  const documentosLocales: any[] = (documentosPersonaData as any)?.data?.documentos_locales || [];

  // Modal de opciones y selección de pendientes
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPendientesModal, setShowPendientesModal] = useState(false);
  const [selectedPendiente, setSelectedPendiente] = useState<{ file: any; displayName: string } | null>(null);

  const isEditing = !!curso;
  const isLoading = createMutation.isLoading || updateMutation.isLoading || uploadMutation.isLoading;

  // Llenar formulario si es edición
  useEffect(() => {
    if (curso && isOpen) {
      setFormData({
        nombre_curso: curso.nombre_curso || '',
        fecha_inicio: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : '',
        fecha_fin: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : '',
        fecha_vencimiento: curso.fecha_vencimiento ? curso.fecha_vencimiento.split('T')[0] : '',
        fecha_obtencion: curso.fecha_obtencion ? curso.fecha_obtencion.split('T')[0] : '', // Campo legacy
        estado: curso.estado || 'completado',
        institucion: curso.institucion || '',
  descripcion: curso.descripcion || '',
        tipo_documento: '',
        archivo: null,
        // Campos de validez del documento
        fecha_emision_documento: '',
        fecha_vencimiento_documento: '',
        dias_validez_documento: '',
        estado_documento: '',
        institucion_emisora: '',
      });
    } else if (isOpen && !curso) {
      // Reset para nuevo curso
      setFormData({
        nombre_curso: '',
        fecha_inicio: '',
        fecha_fin: '',
        fecha_vencimiento: '',
        fecha_obtencion: '', // Campo legacy
        estado: 'completado',
        institucion: '',
  descripcion: '',
        tipo_documento: '',
        archivo: null,
        // Campos de validez del documento
        fecha_emision_documento: '',
        fecha_vencimiento_documento: '',
        dias_validez_documento: '',
        estado_documento: '',
        institucion_emisora: '',
      });
    }
    setErrors([]);
  }, [curso, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar errores al cambiar input
    setErrors([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        archivo: file
      }));

      // Limpiar errores
      if (errors.length > 0) {
        setErrors([]);
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileSelect = () => { fileInputRef.current?.click(); };

  const triggerSelectPending = () => { setShowPendientesModal(true); };

  // Cerrar el panel cuando se elige un archivo (por si el file-picker no cierra inmediatamente la UI)
  useEffect(() => {
    if (formData.archivo) setShowOptionsModal(false);
  }, [formData.archivo]);

  // Utilidades para cálculo de días válidos y estado
  const toUTCDate = (dateStr: string) => {
    // Espera formato YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
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

  // Calcular automáticamente días de validez y estado cuando cambien fechas
  useEffect(() => {
    const { fecha_emision_documento, fecha_vencimiento_documento } = formData;
    let nextDias = formData.dias_validez_documento;
    if (fecha_emision_documento && fecha_vencimiento_documento) {
      const days = diffDaysUTC(fecha_emision_documento, fecha_vencimiento_documento);
      if (!Number.isNaN(days)) {
        const daysStr = String(days);
        if (daysStr !== formData.dias_validez_documento) {
          nextDias = daysStr;
        }
      }
    }

    const nextEstado = getEstadoFromVencimiento(formData.fecha_vencimiento_documento || undefined);

    if (nextDias !== formData.dias_validez_documento || nextEstado !== formData.estado_documento) {
      setFormData((prev) => ({
        ...prev,
        dias_validez_documento: nextDias,
        estado_documento: nextEstado,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fecha_emision_documento, formData.fecha_vencimiento_documento]);

  const resetModalState = () => {
    setFormData(initialFormState());
    setSelectedPendiente(null);
    setErrors([]);
    setShowOptionsModal(false);
    setShowPendientesModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar datos básicos del curso
    const validationData = isEditing 
      ? { nombre_curso: formData.nombre_curso, fecha_obtencion: formData.fecha_obtencion } as UpdateCursoData
      : { rut_persona: rutPersona, nombre_curso: formData.nombre_curso, fecha_obtencion: formData.fecha_obtencion } as CreateCursoData;
    
    const validationErrors = validateCursoData(validationData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Validaciones de documento:
    // - No permitir seleccionar un archivo local y un pendiente al mismo tiempo
    if (formData.archivo && selectedPendiente) {
      setErrors(['No puedes subir un archivo y seleccionar uno pendiente al mismo tiempo. Elige solo una opción.']);
      return;
    }
    // (Sin tipo de documento requerido)

    try {
      if (isEditing && curso) {
        // Actualizar curso existente
        await updateMutation.mutateAsync({
          id: curso.id,
          data: { nombre_curso: formData.nombre_curso, fecha_obtencion: formData.fecha_obtencion } as UpdateCursoData
        });
      } else {
        // Crear nuevo curso
        // Validar que el RUT no esté vacío
        if (!rutPersona || rutPersona.trim() === '') {
          setErrors(['Error: RUT de la persona no está disponible.']);
          return;
        }

        const cursoData = {
          rut_persona: rutPersona.trim(),
          nombre_curso: formData.nombre_curso.trim(),
          fecha_inicio: formData.fecha_inicio || undefined,
          fecha_fin: formData.fecha_fin || undefined,
          fecha_vencimiento: formData.fecha_vencimiento || undefined,
          estado: formData.estado || 'completado',
          institucion: formData.institucion || undefined,
          descripcion: formData.descripcion || undefined,
          // Mantener compatibilidad con campo legacy
          fecha_obtencion: formData.fecha_obtencion
        } as CreateCursoData;
        
        // eslint-disable-next-line no-console
        console.log('🔍 Datos del curso a crear:', cursoData);
        // eslint-disable-next-line no-console
        console.log('🔍 RUT persona:', rutPersona);
        // eslint-disable-next-line no-console
        console.log('🔍 Nombre curso:', formData.nombre_curso);
        // eslint-disable-next-line no-console
        console.log('🔍 Fecha obtención:', formData.fecha_obtencion);
        
        await createMutation.mutateAsync(cursoData);
      }

      // Si hay documento local, subirlo
      if (formData.archivo) {
        const documentoData: CreateDocumentoData = {
          personal_id: personalId,
          nombre_documento: `${formData.nombre_curso}`,
          tipo_documento: 'certificado_curso', // ⭐ Backend guardará automáticamente en cursos_certificaciones/
          archivo: formData.archivo,
          fecha_emision: formData.fecha_emision_documento || undefined,
          fecha_vencimiento: formData.fecha_vencimiento_documento || undefined,
          dias_validez: formData.dias_validez_documento ? parseInt(formData.dias_validez_documento) : undefined,
          estado_documento: formData.estado_documento || undefined,
          institucion_emisora: formData.institucion_emisora || undefined
        };

        const documentValidationErrors = validateDocumentoData(documentoData);
        if (documentValidationErrors.length > 0) {
          setErrors([...errors, ...documentValidationErrors]);
          return;
        }

        try {
          const formDataToSend = createDocumentoFormData(documentoData);
          await uploadMutation.mutateAsync(formDataToSend);
        } catch (docError) {
          // eslint-disable-next-line no-console
          console.error('Error al subir documento:', docError);
          setErrors(['Curso guardado exitosamente, pero hubo un error al subir el documento.']);
        }
      }

      // Si seleccionó un archivo pendiente, registrar existente
      if (selectedPendiente) {
        try {
          await registerExistingMutation.mutateAsync({
            rut_persona: rutPersona,
            file: selectedPendiente.file,
            nombre_documento: `${formData.nombre_curso}`,
            tipo_documento: 'certificado_curso', // ⭐ Backend copiará automáticamente a cursos_certificaciones/
            // Metadatos opcionales si el backend los soporta
            fecha_emision: formData.fecha_emision_documento || undefined,
            fecha_vencimiento: formData.fecha_vencimiento_documento || undefined,
            dias_validez: formData.dias_validez_documento ? parseInt(formData.dias_validez_documento) : undefined,
            estado_documento: formData.estado_documento || undefined,
            institucion_emisora: formData.institucion_emisora || undefined,
          });
          await refetchDocumentosPersona();
        } catch (docErr) {
          console.error('Error al registrar documento existente:', docErr);
          setErrors(['El curso se guardó, pero hubo un error al registrar el documento existente.']);
        }
      }

  onSuccess();
  resetModalState();
  onClose();
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('❌ Error al guardar curso:', error);
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 409) {
        const cursoNombre = formData.nombre_curso || 'este curso';
        const mensajeBackend = error.response?.data?.message || '';
        setErrors([
          `⚠️ El curso "${cursoNombre}" ya está registrado para esta persona.`,
          mensajeBackend ? `📋 Detalle: ${mensajeBackend}` : '',
          '💡 Opciones disponibles:',
          '• Editar el curso existente desde la lista de cursos',
          '• Cambiar el nombre del curso por uno diferente',
          '• Verificar si ya tiene este certificado registrado',
          '• Usar un nombre más específico (ej: "Curso Básico 2025")'
        ].filter(Boolean)); // Filtrar strings vacíos
      } else if (error.response?.status === 400) {
        setErrors(['❌ Los datos ingresados no son válidos. Por favor, verifique la información.']);
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.error || '';
        if (errorMessage.includes('no existe la columna «nombre»')) {
          setErrors([
            '❌ Error del servidor: La base de datos necesita ser actualizada.',
            'El backend está intentando usar una columna que ya no existe.',
            'Contacta al administrador del sistema para corregir este problema.'
          ]);
        } else {
          setErrors(['🔧 Error del servidor. Por favor, intente nuevamente más tarde.']);
        }
      } else {
        setErrors([`❌ Error inesperado: ${error.message || 'Error desconocido'}`]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">
                  {isEditing ? 'Editar Curso' : 'Agregar Curso'}
                </h2>
                <p className="text-purple-100 text-sm">
                  {nombrePersona} ({rutPersona})
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-purple-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Información del modal eliminada por requerimiento */}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error) => (
                  <li key={`error-${error.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre del Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Curso *
              </label>
              <input
                type="text"
                value={formData.nombre_curso}
                onChange={(e) => handleInputChange('nombre_curso', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ej: Prevención de Riesgos Laborales"
                disabled={isLoading}
                required
              />
            </div>

            {/* Fecha de Obtención */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha de Obtención *
              </label>
              <input
                type="date"
                value={formData.fecha_obtencion}
                onChange={(e) => handleInputChange('fecha_obtencion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={isLoading}
                max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                required
              />
            </div>

            {/* Sección de Documentación */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Documentación del Curso
              </h3>
              
              {/* (Tipo de Documento eliminado por requerimiento) */}

              {/* Carga de Archivo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="h-4 w-4 inline mr-1" />
                  Archivo del Documento
                </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-purple-400 transition-colors">
                  <div className="space-y-1 text-center relative">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setShowOptionsModal(true)}
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-purple-600 hover:bg-gray-50 focus:outline-none"
                        disabled={isLoading}
                      >
                        Subir archivo
                      </button>
                      <p className="pl-3 text-sm text-gray-600">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, JPEG, PNG hasta 5MB
                    </p>

                    {/* Hidden file input triggered by the menu */}
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                {/* Mostrar archivo seleccionado */}
                {formData.archivo && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {formData.archivo.name}
                    </p>
                  </div>
                )}
                {/* Mostrar archivo pendiente seleccionado */}
                {!formData.archivo && selectedPendiente && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between">
                    <p className="text-sm text-amber-800 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Archivo seleccionado (Drive): {selectedPendiente.displayName}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedPendiente(null)}
                      className="text-xs px-2 py-1 border rounded hover:bg-amber-100"
                    >
                      Quitar
                    </button>
                  </div>
                )}
                {/* Pendientes ahora se gestionan en una ventana aparte */}

              </div>

              {/* Información de Validez del Documento */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">Información de Validez del Documento</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha de Emisión del Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Emisión del Documento
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_emision_documento}
                      onChange={(e) => handleInputChange('fecha_emision_documento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Fecha de Vencimiento del Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Vencimiento del Documento
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_vencimiento_documento}
                      onChange={(e) => handleInputChange('fecha_vencimiento_documento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Días de Validez del Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Validez del Documento
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.dias_validez_documento}
                      onChange={(e) => handleInputChange('dias_validez_documento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={formData.fecha_emision_documento && formData.fecha_vencimiento_documento ? 'Calculado automáticamente' : 'Ej: 365'}
                      disabled={isLoading || (!!formData.fecha_emision_documento && !!formData.fecha_vencimiento_documento)}
                    />
                  </div>

                  {/* Estado del Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado del Documento
                    </label>
                    <select
                      value={formData.estado_documento}
                      onChange={(e) => handleInputChange('estado_documento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLoading}
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="vigente">Vigente</option>
                      <option value="vencido">Vencido</option>
                      <option value="por_vencer">Por Vencer</option>
                      <option value="sin_fecha">Sin Fecha</option>
                    </select>
                  </div>
                </div>

                {/* Institución Emisora del Documento */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institución Emisora del Documento
                  </label>
                  <input
                    type="text"
                    value={formData.institucion_emisora}
                    onChange={(e) => handleInputChange('institucion_emisora', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Ministerio del Trabajo, SII, etc."
                    disabled={isLoading}
                  />
                </div>

                {/* Nota sobre validez eliminada por requerimiento */}
              </div>
            </div>
            {/* Notas informativas eliminadas por requerimiento */}
          </div>

          {/* Footer con botones */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Actualizar' : 'Agregar'} Curso
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {/* Ventana de opciones */}
      <UploadOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onSubirDesdeEquipo={triggerFileSelect}
        onSeleccionarPendiente={triggerSelectPending}
      />

      {/* Ventana de selección de pendientes */}
      <PendientesRegistroModal
        isOpen={showPendientesModal}
        onClose={() => setShowPendientesModal(false)}
        documentos={documentosLocales}
        onSelect={(f, displayName) => {
          setSelectedPendiente({ file: f, displayName });
          setShowPendientesModal(false);
        }}
      />
    </div>
  );
};


