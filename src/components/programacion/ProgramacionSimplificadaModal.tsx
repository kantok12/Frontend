import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useQueryClient } from '@tanstack/react-query';

interface ProgramacionSimplificadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  carteras: any[];
  clientes: any[];
  nodos: any[];
  personal: any[];
  carteraId?: number;
  semanaInicio?: string;
}

export const ProgramacionSimplificadaModal: React.FC<ProgramacionSimplificadaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  carteras,
  clientes,
  nodos,
  personal,
  carteraId = 0,
  semanaInicio = ''
}) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Estado para el formulario
  const [formData, setFormData] = useState({
    rut: '',
    cartera_id: carteraId || 0,
    cliente_id: undefined as number | undefined,
    nodo_id: undefined as number | undefined,
    fecha_trabajo: '',
    horas_estimadas: 8,
    observaciones: '',
    estado: 'programado'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        rut: '',
        cartera_id: carteraId || 0,
        cliente_id: undefined,
        nodo_id: undefined,
        fecha_trabajo: semanaInicio || new Date().toISOString().split('T')[0],
        horas_estimadas: 8,
        observaciones: '',
        estado: 'programado'
      });
      setErrors([]);
    }
  }, [isOpen, carteraId, semanaInicio]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      const { apiService } = await import('../../services/api');
      
      // Crear la programación con array de fechas
      const response = await apiService.crearProgramacionOptimizada({
        rut: formData.rut,
        cartera_id: Number(formData.cartera_id),
        cliente_id: formData.cliente_id ? Number(formData.cliente_id) : undefined,
        nodo_id: formData.nodo_id ? Number(formData.nodo_id) : undefined,
        fechas_trabajo: [formData.fecha_trabajo], // Convertir fecha única en array
        horas_estimadas: Number(formData.horas_estimadas),
        observaciones: formData.observaciones,
        estado: formData.estado
      });

      if (response.success) {
        // Invalidar queries para refrescar los datos
        await queryClient.invalidateQueries({ queryKey: ['programacion-optimizada'] });
        onSuccess();
        onClose();
      } else {
        setErrors(['Error al crear la programación: ' + response.message]);
      }
    } catch (error: any) {
      setErrors([error.message || 'Error al crear la programación']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Nueva Asignación
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
            <ul className="list-disc list-inside text-red-600 text-sm">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal *
            </label>
            <select
              name="rut"
              value={formData.rut}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar personal...</option>
              {personal.map(p => (
                <option key={p.rut} value={p.rut}>
                  {p.nombre} {p.apellido} - {p.rut}
                </option>
              ))}
            </select>
          </div>

          {/* Cartera */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cartera *
            </label>
            <select
              name="cartera_id"
              value={formData.cartera_id}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar cartera...</option>
              {carteras.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              name="cliente_id"
              value={formData.cliente_id || ''}
              onChange={handleInputChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar cliente (opcional)...</option>
              {clientes.filter(c => c.cartera_id === formData.cartera_id).map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Nodo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nodo
            </label>
            <select
              name="nodo_id"
              value={formData.nodo_id || ''}
              onChange={handleInputChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar nodo (opcional)...</option>
              {nodos.filter(n => n.cliente_id === formData.cliente_id).map(n => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              name="fecha_trabajo"
              value={formData.fecha_trabajo}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Horas estimadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horas estimadas *
            </label>
            <input
              type="number"
              name="horas_estimadas"
              value={formData.horas_estimadas}
              onChange={handleInputChange}
              min="1"
              max="24"
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <input
              type="text"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Observaciones opcionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Asignación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};