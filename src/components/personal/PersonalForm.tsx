import React, { useState, useEffect } from 'react';
import { Personal, CreatePersonalData, UpdatePersonalData, CreatePersonalDisponibleData } from '../../types';
import { useCreatePersonal, useUpdatePersonal } from '../../hooks/usePersonal';
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
    cargo: '',
    sexo: 'M',
    licencia_conducir: '',
    talla_zapatos: '',
    talla_pantalones: '',
    talla_poleras: '',
    zona_geografica: '',
    empresa_id: '',
    servicio_id: '',
    activo: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreatePersonal();
  const updateMutation = useUpdatePersonal();

  // Poblar formulario si estamos editando
  useEffect(() => {
    if (personal) {
      setFormData({
        nombre: personal.nombre || '',
        apellido: personal.apellido || '',
        rut: personal.rut,
        fecha_nacimiento: personal.fecha_nacimiento.split('T')[0], // Formato para input date
        cargo: personal.cargo,
        sexo: personal.sexo,
        licencia_conducir: personal.licencia_conducir,
        talla_zapatos: personal.talla_zapatos,
        talla_pantalones: personal.talla_pantalones,
        talla_poleras: personal.talla_poleras,
        zona_geografica: personal.zona_geografica,
        empresa_id: personal.empresa_id || '',
        servicio_id: personal.servicio_id || '',
        activo: personal.activo || true,
      });
    } else {
      // Reset form for creating new personal
      setFormData({
        nombre: '',
        apellido: '',
        rut: '',
        fecha_nacimiento: '',
        cargo: '',
        sexo: 'M',
        licencia_conducir: '',
        talla_zapatos: '',
        talla_pantalones: '',
        talla_poleras: '',
        zona_geografica: '',
        empresa_id: '',
        servicio_id: '',
        activo: true,
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
        const personalDisponibleData: CreatePersonalDisponibleData = {
          rut: formData.rut,
          sexo: formData.sexo,
          fecha_nacimiento: formData.fecha_nacimiento,
          licencia_conducir: formData.licencia_conducir,
          cargo: formData.cargo,
          estado_id: 1, // Estado "Activo" por defecto
          talla_zapatos: formData.talla_zapatos,
          talla_pantalones: formData.talla_pantalones,
          talla_poleras: formData.talla_poleras,
          zona_geografica: formData.zona_geografica,
          nombre: formData.nombre,
          apellido: formData.apellido,
          // Si hay campos adicionales en el formData que correspondan
          ...(formData.empresa_id && { empresa_id: formData.empresa_id }),
          ...(formData.servicio_id && { servicio_id: formData.servicio_id }),
        };
        await createMutation.mutateAsync(personalDisponibleData);
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

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
                <input
                  type="text"
                  name="licencia_conducir"
                  value={formData.licencia_conducir}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.licencia_conducir ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: B, A1, C, etc."
                />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Empresa
                </label>
                <input
                  type="text"
                  name="empresa_id"
                  value={formData.empresa_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  placeholder="ID de la empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Servicio
                </label>
                <input
                  type="text"
                  name="servicio_id"
                  value={formData.servicio_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  placeholder="ID del servicio"
                />
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estado</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Empleado activo
              </label>
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
      </div>
    </div>
  );
};
