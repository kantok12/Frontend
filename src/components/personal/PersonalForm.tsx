import React, { useState, useEffect } from 'react';
import { Personal, CreatePersonalData, UpdatePersonalData, CreatePersonalDisponibleData } from '../../types';
import { useCreatePersonal, useUpdatePersonal } from '../../hooks/usePersonal';
import { apiService } from '../../services/api';
import { useProfileImage, validateImageFile } from '../../hooks/useProfileImage';
import { useUploadDocumento, validateDocumentoData, createDocumentoFormData, useTiposDocumentos } from '../../hooks/useDocumentos';
import { useEstados } from '../../hooks/useEstados';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { X } from 'lucide-react';

interface PersonalFormProps {
  personal?: Personal | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PersonalForm: React.FC<PersonalFormProps> = ({
  personal,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreatePersonalData>({
    nombre: '',
    apellido: '',
    rut: '',
    fecha_nacimiento: '',
    edad: '', // Campo de edad editable
    cargo: '',
    sexo: 'M',
    licencia_conducir: '',
    estado_id: 1, // Estado "Activo" por defecto
    email: '', // Campo de contacto
    telefono: '', // Campo de contacto
    talla_zapatos: '',
    talla_pantalones: '',
    talla_poleras: '',
    zona_geografica: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para manejar selección de imagen en el modal
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const profileImageHook = useProfileImage(formData.rut || '');

  // Manejar selección de archivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrors((prev) => ({ ...prev, image: validation.error || 'Archivo no válido' }));
      return;
    }

    setSelectedImageFile(file);
    try {
      const url = URL.createObjectURL(file);
      setSelectedImagePreview(url);
    } catch (err) {
      setSelectedImagePreview(null);
    }

    // Si estamos editando (personal ya existe), subir inmediatamente
    if (personal && file) {
      try {
        await profileImageHook.uploadImage(file);
        profileImageHook.refetch();
      } catch (err) {
        setErrors((prev) => ({ ...prev, image: 'Error al subir imagen' }));
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Limpiar preview al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedImageFile(null);
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
        setSelectedImagePreview(null);
      }
    }
  }, [isOpen]);

  // Documentos pendientes para subir junto con la creación
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const initialDocState = () => ({
    nombre_documento: '',
    tipo_documento: '',
    archivo: null as File | null,
    fecha_emision_documento: '',
    fecha_vencimiento_documento: '',
    dias_validez_documento: '',
    estado_documento: '',
    institucion_emisora: '',
  });
  const [docForm, setDocForm] = useState(initialDocState());
  const [docErrors, setDocErrors] = useState<string[]>([]);
  const uploadDocMutation = useUploadDocumento();
  const { data: tiposDocumentos } = useTiposDocumentos();

  const createMutation = useCreatePersonal();
  const updateMutation = useUpdatePersonal();
  const { data: estadosData, isLoading: estadosLoading, error: estadosError } = useEstados({ limit: 100 });
  
  // Log para debug
  console.log('🔍 PersonalForm - Estados:', estadosData);
  console.log('🔍 PersonalForm - Data completo:', estadosData?.data);
  console.log('🔍 PersonalForm - Loading:', estadosLoading);
  console.log('🔍 PersonalForm - Error:', estadosError);

  // Función para calcular la edad basada en la fecha de nacimiento
  const calculateAge = (fechaNacimiento: string): string => {
    if (!fechaNacimiento) return '';
    
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    
    // Verificar si la fecha es válida
    if (isNaN(birthDate.getTime())) return '';
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Ajustar si aún no ha cumplido años este año
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age.toString() : '0';
  };

  // Poblar formulario si estamos editando
  useEffect(() => {
    if (personal) {
      const fechaNacimiento = personal.fecha_nacimiento.split('T')[0];
      setFormData({
        nombre: personal.nombre || '',
        apellido: personal.apellido || '',
        rut: personal.rut,
        fecha_nacimiento: fechaNacimiento, // Formato para input date
        edad: calculateAge(fechaNacimiento), // Calcular edad automáticamente
        cargo: personal.cargo,
        sexo: personal.sexo,
        licencia_conducir: personal.licencia_conducir,
        estado_id: personal.estado_id || 1,
        email: personal.email || '',
        telefono: personal.contacto?.telefono || '',
        talla_zapatos: personal.talla_zapatos,
        talla_pantalones: personal.talla_pantalones,
        talla_poleras: personal.talla_poleras,
        zona_geografica: personal.zona_geografica,
      });
    } else {
      // Reset form for creating new personal
      setFormData({
        nombre: '',
        apellido: '',
        rut: '',
        fecha_nacimiento: '',
        edad: '', // Campo de edad editable
        cargo: '',
        sexo: 'M',
        licencia_conducir: '',
        estado_id: 1, // Estado "Activo" por defecto
        email: '', // Campo de contacto
        telefono: '', // Campo de contacto
        talla_zapatos: '',
        talla_pantalones: '',
        talla_poleras: '',
        zona_geografica: '',
      });
    }
    setErrors({});
  }, [personal, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }
    if (!formData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    }
    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    }
    if (!formData.cargo.trim()) {
      newErrors.cargo = 'El cargo es requerido';
    }
    if (!formData.licencia_conducir.trim()) {
      newErrors.licencia_conducir = 'La licencia de conducir es requerida';
    }
    if (!formData.zona_geografica.trim()) {
      newErrors.zona_geografica = 'La zona geográfica es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (personal) {
        // Actualizar personal existente
        await updateMutation.mutateAsync({
          id: personal.id || personal.rut,
          data: formData as UpdatePersonalData,
        });
      } else {
        // Crear nuevo personal - convertir a formato de personal disponible
        // Combinar nombre y apellido en un solo campo 'nombres' como espera el backend
        const nombreCompleto = `${formData.nombre} ${formData.apellido}`.trim();
        
        const personalDisponibleData: CreatePersonalDisponibleData = {
          rut: formData.rut,
          sexo: formData.sexo,
          fecha_nacimiento: formData.fecha_nacimiento,
          licencia_conducir: formData.licencia_conducir,
          cargo: formData.cargo,
          estado_id: formData.estado_id, // Usar el estado seleccionado
          talla_zapatos: formData.talla_zapatos,
          talla_pantalones: formData.talla_pantalones,
          talla_poleras: formData.talla_poleras,
          zona_geografica: formData.zona_geografica,
          nombres: nombreCompleto, // Campo combinado que espera el backend
          // Campos de contacto
          ...(formData.email && { email: formData.email }),
          ...(formData.telefono && { telefono: formData.telefono }),
        };
        
        // Log para debuggear
        console.log('🔍 Datos del formulario:', formData);
        console.log('🔍 Nombre completo generado:', nombreCompleto);
        console.log('🔍 Fecha de nacimiento:', formData.fecha_nacimiento);
        console.log('🔍 Datos que se envían al backend:', personalDisponibleData);
        
        const createResp: any = await createMutation.mutateAsync(personalDisponibleData);

        // Si la creación fue exitosa, intentar subir una imagen de perfil seleccionada
        // Si no hay imagen seleccionada, generar avatar por defecto (DiceBear)
        try {
          const createdRut = createResp?.data?.rut || createResp?.data?.id || formData.rut;
          if (createdRut) {
            if (selectedImageFile) {
              try {
                await apiService.uploadProfileImage(createdRut, selectedImageFile);
                console.log('✅ Imagen seleccionada subida para', createdRut);
              } catch (err) {
                console.warn('⚠️ Error subiendo la imagen seleccionada tras creación:', err);
              }
            } else {
              // Generar avatar basado en iniciales mediante DiceBear y subirlo
              const avatarName = nombreCompleto || formData.rut;
              try {
                const avatarUrl = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(avatarName)}.png?background=%23ffffff&size=256`;
                const resp = await fetch(avatarUrl);
                if (resp.ok) {
                  const blob = await resp.blob();
                  const file = new File([blob], `${createdRut}.png`, { type: blob.type });
                  await apiService.uploadProfileImage(createdRut, file);
                  console.log('✅ Avatar generado y subido para', createdRut);
                } else {
                  console.warn('⚠️ No se pudo descargar avatar desde DiceBear:', resp.status);
                }
              } catch (err) {
                console.warn('⚠️ Error generando/subiendo avatar:', err);
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ Error en upload de imagen por defecto tras creación:', err);
        }

        // Si hay documentos pendientes, subirlos usando la misma lógica que SubirDocumentoModal
        try {
          const createdRut = createResp?.data?.rut || createResp?.data?.id || formData.rut;
          if (createdRut && pendingDocs && pendingDocs.length > 0) {
            for (let idx = 0; idx < pendingDocs.length; idx++) {
              const pd = pendingDocs[idx];
              try {
                // mark uploading
                setPendingDocs((prev: any[]) => {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx], status: 'uploading', message: '' };
                  return copy;
                });

                const docData: any = {
                  personal_id: createdRut,
                  nombre_documento: pd.nombre_documento || (pd.archivo && (pd.archivo.name || 'documento')),
                  tipo_documento: pd.tipo_documento || undefined,
                  archivo: pd.archivo,
                  fecha_emision: pd.fecha_emision_documento || undefined,
                  fecha_vencimiento: pd.fecha_vencimiento_documento || undefined,
                  dias_validez: pd.dias_validez_documento ? parseInt(pd.dias_validez_documento) : undefined,
                  estado_documento: pd.estado_documento || undefined,
                  institucion_emisora: pd.institucion_emisora || undefined,
                };

                const validationErrs = validateDocumentoData(docData as any);
                if (validationErrs.length > 0) {
                  console.warn('⚠️ Documento pendiente inválido, se omite:', validationErrs);
                  setPendingDocs((prev: any[]) => {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], status: 'error', message: validationErrs.join('; ') };
                    return copy;
                  });
                  continue;
                }

                const fd = createDocumentoFormData(docData as any);
                await uploadDocMutation.mutateAsync(fd);

                setPendingDocs((prev: any[]) => {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx], status: 'success', message: 'Subido correctamente' };
                  return copy;
                });

                console.log('✅ Documento subido tras creación:', docData.nombre_documento);
              } catch (err: any) {
                console.warn('⚠️ Error subiendo documento pendiente tras creación:', err);
                setPendingDocs((prev: any[]) => {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx], status: 'error', message: err?.message || String(err) };
                  return copy;
                });
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ Error procesando documentos pendientes tras creación:', err);
        }

        // Mensaje de éxito específico para creación
        alert(`✅ Personal creado exitosamente:\n• Nombre: ${nombreCompleto}\n• RUT: ${formData.rut}\n• Fecha de nacimiento: ${formData.fecha_nacimiento}`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar personal:', error);
      // Manejar errores del servidor
      if (error?.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Error al guardar el personal' });
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      };
      
      // Si cambió la fecha de nacimiento, calcular la edad automáticamente
      if (name === 'fecha_nacimiento') {
        newData.edad = calculateAge(value);
      }
      
      return newData;
    });

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleDocInputChange = (field: string, value: any) => {
    setDocForm((p: any) => ({ ...p, [field]: value }));
    setDocErrors([]);
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    handleDocInputChange('archivo', f);
  };

  const addPendingDoc = () => {
    // Validar mínimo
    const data = {
      personal_id: formData.rut,
      nombre_documento: docForm.nombre_documento,
      tipo_documento: docForm.tipo_documento || undefined,
      archivo: docForm.archivo,
      fecha_emision: docForm.fecha_emision_documento || undefined,
      fecha_vencimiento: docForm.fecha_vencimiento_documento || undefined,
      dias_validez: docForm.dias_validez_documento ? parseInt(docForm.dias_validez_documento) : undefined,
      estado_documento: docForm.estado_documento || undefined,
      institucion_emisora: docForm.institucion_emisora || undefined,
    };

    const errs = validateDocumentoData(data as any);
    if (errs.length > 0) {
      setDocErrors(errs);
      return;
    }

    setPendingDocs((p) => [...p, { ...docForm, status: 'idle', message: '' }]);
    setDocForm(initialDocState());
    setShowAddDocForm(false);
  };

  const removePendingDoc = (idx: number) => {
    setPendingDocs((p) => p.filter((_, i) => i !== idx));
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  const formatEstadoName = (name: string) => {
    if (!name) return name;
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {personal ? 'Editar Personal' : 'Nuevo Personal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Subir foto de perfil
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedImagePreview && (
                  <img src={selectedImagePreview} alt="Preview" className="h-12 w-12 rounded-full object-cover border" />
                )}
              </div>
              {errors.image && (
                <p className="text-xs text-red-600">{errors.image}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre del empleado"
                />
                {errors.nombre && (
                  <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.apellido ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Apellido del empleado"
                />
                {errors.apellido && (
                  <p className="mt-1 text-xs text-red-600">{errors.apellido}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT *
                </label>
                <input
                  type="text"
                  name="rut"
                  value={formData.rut}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rut ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="12.345.678-9"
                />
                {errors.rut && (
                  <p className="mt-1 text-xs text-red-600">{errors.rut}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo *
                </label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fecha_nacimiento && (
                  <p className="mt-1 text-xs text-red-600">{errors.fecha_nacimiento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad
                </label>
                <input
                  type="number"
                  name="edad"
                  value={formData.edad}
                  readOnly
                  min="0"
                  max="120"
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300"
                  placeholder="Se calcula automáticamente"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Se calcula automáticamente al cambiar la fecha de nacimiento
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo *
                </label>
                <input
                  type="text"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cargo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Ingeniero, Técnico, etc."
                />
                {errors.cargo && (
                  <p className="mt-1 text-xs text-red-600">{errors.cargo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ejemplo@empresa.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.telefono ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+56 9 1234 5678"
                />
                {errors.telefono && (
                  <p className="mt-1 text-xs text-red-600">{errors.telefono}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Laboral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Licencia de Conducir *
                </label>
                <select
                  name="licencia_conducir"
                  value={formData.licencia_conducir}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licencia_conducir ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione una clase</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="A3">A3</option>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                </select>
                {errors.licencia_conducir && (
                  <p className="mt-1 text-xs text-red-600">{errors.licencia_conducir}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona Geográfica *
                </label>
                <input
                  type="text"
                  name="zona_geografica"
                  value={formData.zona_geografica}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.zona_geografica ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Metropolitana de Santiago"
                />
                {errors.zona_geografica && (
                  <p className="mt-1 text-xs text-red-600">{errors.zona_geografica}</p>
                )}
              </div>


            </div>
          </div>

          {/* Tallas de Vestuario */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tallas de Vestuario</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talla de Zapatos
                </label>
                <input
                  type="text"
                  name="talla_zapatos"
                  value={formData.talla_zapatos}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  placeholder="Ej: 42, 38, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talla de Pantalones
                </label>
                <input
                  type="text"
                  name="talla_pantalones"
                  value={formData.talla_pantalones}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  placeholder="Ej: M, 32, L, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talla de Poleras
                </label>
                <input
                  type="text"
                  name="talla_poleras"
                  value={formData.talla_poleras}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  placeholder="Ej: S, M, L, XL, etc."
                />
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estado del Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  name="estado_id"
                  value={formData.estado_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.estado_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={estadosLoading}
                >
                  {estadosLoading ? (
                      <option value="">Cargando estados...</option>
                    ) : (
                      (estadosData?.data || []).map((estado: any) => (
                        <option key={estado.id} value={estado.id}>
                          {formatEstadoName(String(estado.nombre || ''))}
                        </option>
                      ))
                    )}
                </select>
                {errors.estado_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.estado_id}</p>
                )}
                {!estadosLoading && estadosData?.data && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selecciona el estado actual del personal
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading && <LoadingSpinner />}
              {personal ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
          {/* Documentación: agregar documentos antes de crear */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 mt-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Documentación</h3>
            <p className="text-sm text-gray-600 mb-3">Puedes agregar documentos que se subirán automáticamente después de crear el personal.</p>
            <div className="mb-3">
              <button type="button" onClick={() => setShowAddDocForm((s) => !s)} className="px-3 py-2 bg-white border rounded-md hover:bg-gray-100">{showAddDocForm ? 'Cancelar' : 'Agregar documento'}</button>
            </div>

            {showAddDocForm && (
              <div className="mb-3 p-3 border rounded bg-white">
                {docErrors.length > 0 && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                    <ul>
                      {docErrors.map((d, i) => (<li key={i}>{d}</li>))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Nombre del documento</label>
                    <input type="text" value={docForm.nombre_documento} onChange={(e) => handleDocInputChange('nombre_documento', e.target.value)} className="w-full px-2 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Tipo de documento</label>
                    <select value={docForm.tipo_documento} onChange={(e) => handleDocInputChange('tipo_documento', e.target.value)} className="w-full px-2 py-2 border rounded">
                      <option value="">Seleccione</option>
                      {(tiposDocumentos?.data || []).map((t: any) => (<option key={t.value} value={t.value}>{t.label || t.value}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Archivo</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocFileChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Institución emisora</label>
                    <input type="text" value={docForm.institucion_emisora} onChange={(e) => handleDocInputChange('institucion_emisora', e.target.value)} className="w-full px-2 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Fecha emisión</label>
                    <input type="date" value={docForm.fecha_emision_documento} onChange={(e) => handleDocInputChange('fecha_emision_documento', e.target.value)} className="w-full px-2 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Fecha vencimiento</label>
                    <input type="date" value={docForm.fecha_vencimiento_documento} onChange={(e) => handleDocInputChange('fecha_vencimiento_documento', e.target.value)} className="w-full px-2 py-2 border rounded" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={addPendingDoc} className="px-3 py-2 bg-blue-600 text-white rounded">Agregar</button>
                  <button type="button" onClick={() => { setShowAddDocForm(false); setDocForm(initialDocState()); setDocErrors([]); }} className="px-3 py-2 border rounded">Cancelar</button>
                </div>
              </div>
            )}

            {pendingDocs.length > 0 && (
              <div className="space-y-2">
                {pendingDocs.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white border rounded">
                    <div>
                      <div className="text-sm font-medium">{d.nombre_documento || d.archivo?.name}</div>
                      <div className="text-xs text-gray-500">{d.tipo_documento || ''} {d.archivo ? `· ${Math.round((d.archivo.size||0)/1024)} KB` : ''}</div>
                      {d.message && <div className="text-xs mt-1 text-gray-500">{d.message}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {d.status === 'uploading' && <div className="flex items-center text-sm text-gray-600"><LoadingSpinner /></div>}
                      {d.status === 'success' && <div className="text-sm text-green-600">Subido</div>}
                      {d.status === 'error' && <div className="text-sm text-red-600">Error</div>}
                      <button type="button" onClick={() => removePendingDoc(i)} className="px-2 py-1 text-sm border rounded">Quitar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
