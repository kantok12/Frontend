import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle, Clock, User, Building2, MapPin } from 'lucide-react';
import { usePersonalList } from '../../hooks/usePersonal';
import { AsignacionSemanal, AsignacionFormData } from '../../types/programacion';
import { Personal } from '../../types';

interface AsignacionSemanalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asignacion: AsignacionSemanal) => void;
  dia: string;
  fecha: Date;
  carteras: any[];
  clientes: any[];
  nodos: any[];
  asignacionExistente?: AsignacionSemanal;
}

export const AsignacionSemanalModal: React.FC<AsignacionSemanalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dia,
  fecha,
  carteras,
  clientes,
  nodos,
  asignacionExistente
}) => {
  const [asignacion, setAsignacion] = useState<AsignacionFormData>({
    personalId: '',
    carteraId: 0,
    clienteId: '',
    nodoId: '',
    horaInicio: '08:00',
    horaFin: '17:00',
    observaciones: '',
    estado: 'pendiente'
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener personal con documentación
  const { data: personalData, isLoading: isLoadingPersonal } = usePersonalList(1, 1000, '');
  const personalConDocumentacion = personalData?.data?.items || [];
  const totalPersonal = personalData?.data?.total || 0;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (asignacionExistente) {
        setAsignacion({
          personalId: asignacionExistente.personalId || '',
          carteraId: asignacionExistente.carteraId || 0,
          clienteId: asignacionExistente.clienteId?.toString() || '',
          nodoId: asignacionExistente.nodoId?.toString() || '',
          horaInicio: asignacionExistente.horaInicio || '08:00',
          horaFin: asignacionExistente.horaFin || '17:00',
          observaciones: asignacionExistente.observaciones || '',
          estado: asignacionExistente.estado || 'pendiente'
        });
      } else {
        setAsignacion({
          personalId: '',
          carteraId: 0,
          clienteId: '',
          nodoId: '',
          horaInicio: '08:00',
          horaFin: '17:00',
          observaciones: '',
          estado: 'pendiente'
        });
      }
      setErrors([]);
    }
  }, [isOpen, asignacionExistente]);

  // Obtener clientes por cartera
  const getClientesByCartera = (carteraId: number) => {
    return clientes.filter(c => c.cartera_id === carteraId);
  };

  // Obtener nodos por cliente
  const getNodosByCliente = (clienteId: number) => {
    return nodos.filter(n => n.cliente_id === clienteId);
  };

  // Helper para convertir string | number a number
  const toNumber = (value: string | number): number => {
    return typeof value === 'string' ? parseInt(value) : value;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setAsignacion(prev => {
      const newAsignacion = { ...prev, [name]: value };
      
      // Reset cascading selects
      if (name === 'carteraId') {
        newAsignacion.clienteId = '';
        newAsignacion.nodoId = '';
      } else if (name === 'clienteId') {
        newAsignacion.nodoId = '';
      }
      
      return newAsignacion;
    });
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors: string[] = [];

    if (!asignacion.personalId) {
      newErrors.push('Debe seleccionar un personal');
    }

    if (!asignacion.carteraId) {
      newErrors.push('Debe seleccionar una cartera');
    }

    if (asignacion.horaInicio >= asignacion.horaFin) {
      newErrors.push('La hora de inicio debe ser anterior a la hora de fin');
    }

    if (personalConDocumentacion.length === 0) {
      newErrors.push('No hay personal disponible con documentación completa');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Manejar guardado
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const personalSeleccionado = personalConDocumentacion.find((p: Personal) => p.id === asignacion.personalId);
      const carteraSeleccionada = carteras.find(c => c.id === asignacion.carteraId);
      const clienteSeleccionado = asignacion.clienteId ? clientes.find(c => c.id === toNumber(asignacion.clienteId)) : undefined;
      const nodoSeleccionado = asignacion.nodoId ? nodos.find(n => n.id === toNumber(asignacion.nodoId)) : undefined;

      const asignacionCompleta: AsignacionSemanal = {
        id: asignacionExistente?.id || `asignacion_${Date.now()}`,
        personalId: asignacion.personalId,
        personalNombre: personalSeleccionado ? `${personalSeleccionado.nombre} ${personalSeleccionado.apellido}` : '',
        personalRut: personalSeleccionado?.rut || '',
        carteraId: asignacion.carteraId,
        carteraNombre: carteraSeleccionada?.nombre || carteraSeleccionada?.name || '',
        clienteId: asignacion.clienteId ? toNumber(asignacion.clienteId) : undefined,
        clienteNombre: clienteSeleccionado?.nombre,
        nodoId: asignacion.nodoId ? toNumber(asignacion.nodoId) : undefined,
        nodoNombre: nodoSeleccionado?.nombre,
        dia: dia.toLowerCase(),
        fecha: fecha.toISOString().split('T')[0],
        horaInicio: asignacion.horaInicio,
        horaFin: asignacion.horaFin,
        observaciones: asignacion.observaciones,
        estado: asignacion.estado
      };

      await onSave(asignacionCompleta);
      onClose();
    } catch (error) {
      console.error('Error al guardar asignación:', error);
      setErrors(['Error al guardar la asignación']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {asignacionExistente ? 'Editar Asignación' : 'Nueva Asignación'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {dia} {fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Información sobre documentación */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Personal con Documentación Completa
                </h4>
                <p className="text-xs text-blue-600 mt-1">
                  Solo se muestra personal con documentación personal completa y vigente
                </p>
                <p className="text-xs text-blue-600">
                  Disponibles: {personalConDocumentacion.length} de {totalPersonal} personas
                </p>
              </div>
            </div>
          </div>

          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Errores encontrados:</h4>
                  <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal *
              </label>
              <select
                name="personalId"
                value={asignacion.personalId}
                onChange={handleInputChange}
                disabled={isLoadingPersonal}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingPersonal 
                    ? 'Cargando personal con documentación...' 
                    : personalConDocumentacion.length === 0
                      ? 'No hay personal con documentación completa'
                      : 'Seleccionar personal...'
                  }
                </option>
                {personalConDocumentacion.map((persona: Personal) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.nombre} {persona.apellido} - {persona.rut}
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
                name="carteraId"
                value={asignacion.carteraId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Seleccionar cartera...</option>
                {carteras.map((cartera) => (
                  <option key={cartera.id} value={cartera.id}>
                    {cartera.nombre || cartera.name}
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
                value={asignacion.clienteId}
                onChange={handleInputChange}
                disabled={!asignacion.carteraId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar cliente (opcional)...</option>
                {asignacion.carteraId && getClientesByCartera(asignacion.carteraId).map((cliente) => (
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
                value={asignacion.nodoId}
                onChange={handleInputChange}
                disabled={!asignacion.clienteId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar nodo (opcional)...</option>
                {asignacion.clienteId && getNodosByCliente(toNumber(asignacion.clienteId)).map((nodo) => (
                  <option key={nodo.id} value={nodo.id}>
                    {nodo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={asignacion.estado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="completada">Completada</option>
              </select>
            </div>

            {/* Hora Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Inicio *
              </label>
              <input
                type="time"
                name="horaInicio"
                value={asignacion.horaInicio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Hora Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Fin *
              </label>
              <input
                type="time"
                name="horaFin"
                value={asignacion.horaFin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={asignacion.observaciones}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observaciones opcionales..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || personalConDocumentacion.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isLoading ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {asignacionExistente ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
