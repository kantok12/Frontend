import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Calendar, Save } from 'lucide-react';
import { useCreateCurso, useUpdateCurso, validateCursoData } from '../../hooks/useCursos';
import { Curso, CreateCursoData, UpdateCursoData } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CursoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  curso?: Curso | null; // Si se pasa un curso, es para editar
  rutPersona: string; // RUT de la persona para quien se agrega el curso
  nombrePersona: string; // Nombre de la persona para mostrar en el título
}

export const CursoModal: React.FC<CursoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  curso = null,
  rutPersona,
  nombrePersona
}) => {
  const [formData, setFormData] = useState({
    nombre_curso: '',
    fecha_obtencion: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const createMutation = useCreateCurso();
  const updateMutation = useUpdateCurso();

  const isEditing = !!curso;
  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  // Llenar formulario si es edición
  useEffect(() => {
    if (curso && isOpen) {
      setFormData({
        nombre_curso: curso.nombre_curso,
        fecha_obtencion: curso.fecha_obtencion.split('T')[0], // Formato YYYY-MM-DD para input date
      });
    } else if (isOpen && !curso) {
      // Reset para nuevo curso
      setFormData({
        nombre_curso: '',
        fecha_obtencion: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar datos
    const validationData = isEditing 
      ? { ...formData } as UpdateCursoData
      : { rut_persona: rutPersona, ...formData } as CreateCursoData;
    
    const validationErrors = validateCursoData(validationData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isEditing && curso) {
        // Actualizar curso existente
        await updateMutation.mutateAsync({
          id: curso.id,
          data: formData as UpdateCursoData
        });
      } else {
        // Crear nuevo curso
        await createMutation.mutateAsync({
          rut_persona: rutPersona,
          ...formData
        } as CreateCursoData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar curso:', error);
      setErrors(['Error al guardar el curso. Por favor, intente nuevamente.']);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Errores */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
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

            {/* Información adicional */}
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600">
                <strong>Nota:</strong> La fecha de obtención no puede ser futura. 
                Este registro se asociará al personal {nombrePersona}.
              </p>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
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
    </div>
  );
};


