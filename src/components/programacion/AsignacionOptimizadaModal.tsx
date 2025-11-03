import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Plus, Calendar, Users, Building2, MapPin, Clock, Save } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api';

interface AsignacionOptimizadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  carteraId: number;
  clientes: any[];
  nodos: any[];
  personal: any[];
  fechaSeleccionada: Date;
}

export const AsignacionOptimizadaModal: React.FC<AsignacionOptimizadaModalProps> = ({
  isOpen,
  onClose,
  carteraId,
  clientes,
  nodos,
  personal,
  fechaSeleccionada
}) => {
  const [formData, setFormData] = useState({
    rut: '',
    clienteId: '',
    nodoId: '',
    horasEstimadas: 8,
    observaciones: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { mutate: crearAsignacion, isPending } = useMutation({
    mutationFn: async (data: any) => {
      // 1. Validar que tengamos el carteraId correcto
      if (!carteraId) {
        throw new Error('No se ha seleccionado una cartera');
      }
      console.log('🏢 Cartera ID:', carteraId);

      // 2. Buscar y validar el cliente
      const cliente = clientes.find(c => c.id.toString() === data.clienteId);
      console.log('👥 Cliente encontrado:', cliente);
      
      if (data.clienteId && !cliente) {
        throw new Error('Cliente no encontrado');
      }
      
      // 3. Validar que el cliente pertenezca a la cartera seleccionada
      if (cliente) {
        const carteraIdCliente = parseInt(cliente.cartera_id);
        if (carteraIdCliente !== carteraId) {
          console.error('❌ Discrepancia de cartera:', {
            carteraIdCliente,
            carteraIdProp: carteraId,
            cliente
          });
          throw new Error(`El cliente seleccionado pertenece a la cartera ${carteraIdCliente} pero se está intentando asignar a la cartera ${carteraId}`);
        }
        console.log('✅ Cliente pertenece a la cartera correcta');
      }

      const programacionData = {
        rut: data.rut,
        cartera_id: parseInt(carteraId.toString()), // Asegurarnos de que sea un número
        cliente_id: data.clienteId ? parseInt(data.clienteId) : undefined,
        nodo_id: data.nodoId ? parseInt(data.nodoId) : undefined,
        fechas_trabajo: [format(fechaSeleccionada, 'yyyy-MM-dd')],
        horas_estimadas: parseInt(data.horasEstimadas.toString()),
        observaciones: data.observaciones || '',
        estado: 'programado'
      };

      console.log('📝 Datos de programación a enviar:', JSON.stringify(programacionData, null, 2));
      
      // Validación final de datos
      console.log('🔍 Validación final:', {
        rut: typeof programacionData.rut === 'string' ? '✅' : '❌',
        cartera_id: Number.isInteger(programacionData.cartera_id) ? '✅' : '❌',
        cliente_id: programacionData.cliente_id === undefined || Number.isInteger(programacionData.cliente_id) ? '✅' : '❌',
        nodo_id: programacionData.nodo_id === undefined || Number.isInteger(programacionData.nodo_id) ? '✅' : '❌',
        fechas_trabajo: Array.isArray(programacionData.fechas_trabajo) ? '✅' : '❌',
        horas_estimadas: Number.isInteger(programacionData.horas_estimadas) ? '✅' : '❌'
      });
      
      return apiService.crearProgramacionOptimizada(programacionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['programacion-optimizada', carteraId] 
      });
      onClose();
    },
    onError: (error: any) => {
      setErrors([error.message || 'Error al crear la asignación']);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = [];

    if (!formData.rut) {
      validationErrors.push('Debe seleccionar una persona');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    crearAsignacion(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            Nueva Asignación - {format(fechaSeleccionada, 'EEEE d MMMM yyyy')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal *
              </label>
              <select
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar personal...</option>
                {personal.map(persona => (
                  <option key={persona.rut} value={persona.rut}>
                    {persona.nombre} {persona.apellido}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                name="clienteId"
                value={formData.clienteId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar cliente...</option>
                {clientes
                  .filter(cliente => parseInt(cliente.cartera_id) === carteraId)
                  .map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
              </select>
            </div>

            {/* Nodo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nodo
              </label>
              <select
                name="nodoId"
                value={formData.nodoId}
                onChange={handleInputChange}
                disabled={!formData.clienteId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Seleccionar nodo...</option>
                {nodos
                  .filter(nodo => nodo.cliente_id === parseInt(formData.clienteId))
                  .map(nodo => (
                    <option key={nodo.id} value={nodo.id}>
                      {nodo.nombre}
                    </option>
                  ))}
              </select>
            </div>

            {/* Horas Estimadas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas Estimadas
              </label>
              <input
                type="number"
                name="horasEstimadas"
                value={formData.horasEstimadas}
                onChange={handleInputChange}
                min="1"
                max="24"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Asignación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};