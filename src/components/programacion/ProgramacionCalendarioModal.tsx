import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Users, Building2, MapPin, Clock, Save, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Servicio {
  id: number;
  nombre: string;
  tipo: 'cartera' | 'cliente' | 'nodo';
  cartera_id?: number;
  cliente_id?: number;
  nodo_id?: number;
}

interface Personal {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
}

interface Asignacion {
  id?: string;
  personalId: string;
  carteraId: number;
  clienteId?: number;
  nodoId?: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  observaciones?: string;
}

interface ProgramacionCalendarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asignaciones: Asignacion[]) => void;
  carteras: any[];
  clientes: any[];
  nodos: any[];
  personal: Personal[];
}

export const ProgramacionCalendarioModal: React.FC<ProgramacionCalendarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  carteras,
  clientes,
  nodos,
  personal
}) => {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [nuevaAsignacion, setNuevaAsignacion] = useState<Asignacion>({
    personalId: '',
    carteraId: 0,
    clienteId: undefined,
    nodoId: undefined,
    dia: 'lunes',
    horaInicio: '08:00',
    horaFin: '17:00',
    observaciones: ''
  });
  const [showFormulario, setShowFormulario] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Días de la semana
  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('🚀 Modal abierto con datos:');
      console.log('📊 Carteras:', carteras);
      console.log('👥 Clientes:', clientes);
      console.log('📍 Nodos:', nodos);
      console.log('👤 Personal:', personal);
      
      setAsignaciones([]);
      setNuevaAsignacion({
        personalId: '',
        carteraId: 0,
        clienteId: undefined,
        nodoId: undefined,
        dia: 'lunes',
        horaInicio: '08:00',
        horaFin: '17:00',
        observaciones: ''
      });
      setShowFormulario(false);
      setErrors([]);
    }
  }, [isOpen, carteras, clientes, nodos, personal]);

  // Obtener clientes de una cartera específica
  const getClientesByCartera = (carteraId: number) => {
    console.log('🔍 Buscando clientes para cartera:', carteraId, 'tipo:', typeof carteraId);
    console.log('📋 Todos los clientes:', clientes);
    console.log('📋 Estructura del primer cliente:', clientes[0]);
    
    const clientesFiltrados = clientes.filter(c => {
      console.log(`🔍 Comparando: cliente.cartera_id (${c.cartera_id}, tipo: ${typeof c.cartera_id}) === carteraId (${carteraId}, tipo: ${typeof carteraId})`);
      return c.cartera_id === carteraId;
    });
    
    console.log('✅ Clientes filtrados:', clientesFiltrados);
    return clientesFiltrados;
  };

  // Obtener nodos de un cliente específico
  const getNodosByCliente = (clienteId: number) => {
    console.log('🔍 Buscando nodos para cliente:', clienteId);
    console.log('📋 Todos los nodos:', nodos);
    const nodosFiltrados = nodos.filter(n => n.cliente_id === clienteId);
    console.log('✅ Nodos filtrados:', nodosFiltrados);
    return nodosFiltrados;
  };

  const validateAsignacion = (asignacion: Asignacion) => {
    const errors: string[] = [];

    if (!asignacion.personalId || asignacion.personalId === '') {
      errors.push('Debe seleccionar una persona');
    }

    if (!asignacion.carteraId) {
      errors.push('Debe seleccionar una cartera');
    }

    if (!asignacion.dia) {
      errors.push('Debe seleccionar un día');
    }

    if (!asignacion.horaInicio) {
      errors.push('Debe especificar la hora de inicio');
    }

    if (!asignacion.horaFin) {
      errors.push('Debe especificar la hora de fin');
    }

    if (asignacion.horaInicio >= asignacion.horaFin) {
      errors.push('La hora de fin debe ser posterior a la hora de inicio');
    }

    // Verificar conflictos de horario
    const conflicto = asignaciones.find(a => 
      a.personalId === asignacion.personalId &&
      a.dia === asignacion.dia &&
      ((asignacion.horaInicio >= a.horaInicio && asignacion.horaInicio < a.horaFin) ||
       (asignacion.horaFin > a.horaInicio && asignacion.horaFin <= a.horaFin) ||
       (asignacion.horaInicio <= a.horaInicio && asignacion.horaFin >= a.horaFin))
    );

    if (conflicto) {
      errors.push('Ya existe una asignación para esta persona en el mismo horario');
    }

    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'carteraId') {
      // Al cambiar cartera, limpiar cliente y nodo
      const carteraId = parseInt(value);
      console.log('🔄 Cambiando cartera a:', carteraId, 'tipo:', typeof carteraId);
      setNuevaAsignacion(prev => ({
        ...prev,
        carteraId: carteraId,
        clienteId: undefined,
        nodoId: undefined
      }));
    } else if (name === 'clienteId') {
      // Al cambiar cliente, limpiar nodo
      setNuevaAsignacion(prev => ({
        ...prev,
        clienteId: value ? parseInt(value) : undefined,
        nodoId: undefined
      }));
    } else {
      setNuevaAsignacion(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAgregarAsignacion = () => {
    const errors = validateAsignacion(nuevaAsignacion);
    
    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    const asignacionConId = {
      ...nuevaAsignacion,
      id: Date.now().toString()
    };

    setAsignaciones(prev => [...prev, asignacionConId]);
    setNuevaAsignacion({
      personalId: '',
      carteraId: 0,
      clienteId: undefined,
      nodoId: undefined,
      dia: 'lunes',
      horaInicio: '08:00',
      horaFin: '17:00',
      observaciones: ''
    });
    setShowFormulario(false);
    setErrors([]);
  };

  const handleEliminarAsignacion = (asignacionId: string) => {
    setAsignaciones(prev => prev.filter(a => a.id !== asignacionId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (asignaciones.length === 0) {
      setErrors(['Debe agregar al menos una asignación']);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSuccess(asignaciones);
      onClose();
    } catch (error) {
      setErrors(['Error al guardar las asignaciones']);
    } finally {
      setIsLoading(false);
    }
  };

  const getAsignacionesPorDia = (dia: string) => {
    return asignaciones.filter(a => a.dia === dia);
  };

  const getNombrePersonal = (personalId: string) => {
    const persona = personal.find(p => p.id === personalId);
    return persona ? `${persona.nombre} ${persona.apellido}` : 'Desconocido';
  };

  const getNombreCartera = (carteraId: number) => {
    const cartera = carteras.find(c => c.id === carteraId);
    return cartera?.nombre || cartera?.name || 'Desconocido';
  };

  const getNombreCliente = (clienteId: number) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nombre || 'Desconocido';
  };

  const getNombreNodo = (nodoId: number) => {
    const nodo = nodos.find(n => n.id === nodoId);
    return nodo?.nombre || 'Desconocido';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            Programación Semanal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-red-800 font-semibold mb-2">Errores encontrados:</h4>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={`error-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Formulario para nueva asignación */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-green-600" />
                Nueva Asignación
              </h3>
              <button
                type="button"
                onClick={() => setShowFormulario(!showFormulario)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                {showFormulario ? 'Cancelar' : 'Agregar Asignación'}
              </button>
            </div>

            {showFormulario && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Personal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal *
                    </label>
                    <select
                      name="personalId"
                      value={nuevaAsignacion.personalId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar personal...</option>
                      {personal.map((persona) => (
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
                      value={nuevaAsignacion.carteraId}
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
                      value={nuevaAsignacion.clienteId || ''}
                      onChange={handleInputChange}
                      disabled={!nuevaAsignacion.carteraId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar cliente (opcional)...</option>
                      {nuevaAsignacion.carteraId && (() => {
                        const clientesDisponibles = getClientesByCartera(nuevaAsignacion.carteraId);
                        console.log('🎯 Renderizando select de clientes. CarteraId:', nuevaAsignacion.carteraId, 'Clientes disponibles:', clientesDisponibles);
                        return clientesDisponibles.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Nodo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nodo
                    </label>
                    <select
                      name="nodoId"
                      value={nuevaAsignacion.nodoId || ''}
                      onChange={handleInputChange}
                      disabled={!nuevaAsignacion.clienteId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar nodo (opcional)...</option>
                      {nuevaAsignacion.clienteId && getNodosByCliente(nuevaAsignacion.clienteId).map((nodo) => (
                        <option key={nodo.id} value={nodo.id}>
                          {nodo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Día */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día *
                    </label>
                    <select
                      name="dia"
                      value={nuevaAsignacion.dia}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {diasSemana.map((dia) => (
                        <option key={dia.key} value={dia.key}>
                          {dia.label}
                        </option>
                      ))}
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
                      value={nuevaAsignacion.horaInicio}
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
                      value={nuevaAsignacion.horaFin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <input
                      type="text"
                      name="observaciones"
                      value={nuevaAsignacion.observaciones}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Observaciones opcionales..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowFormulario(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAgregarAsignacion}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Asignación
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Calendario Semanal */}
          <div className="bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Calendario Semanal ({asignaciones.length} asignaciones)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Día
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asignaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {diasSemana.map((dia) => {
                    const asignacionesDia = getAsignacionesPorDia(dia.key);
                    return (
                      <tr key={dia.key}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{dia.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {asignacionesDia.length > 0 ? (
                            <div className="space-y-2">
                              {asignacionesDia.map((asignacion) => (
                                <div key={asignacion.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <Users className="h-4 w-4 mr-1 text-green-500" />
                                        <span className="text-sm font-medium text-gray-900">
                                          {getNombrePersonal(asignacion.personalId)}
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center">
                                          <Building2 className="h-4 w-4 mr-1 text-blue-500" />
                                          <span className="text-sm text-gray-600">
                                            {getNombreCartera(asignacion.carteraId)}
                                          </span>
                                        </div>
                                        {asignacion.clienteId && (
                                          <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-1 text-green-500" />
                                            <span className="text-sm text-gray-600">
                                              {getNombreCliente(asignacion.clienteId)}
                                            </span>
                                          </div>
                                        )}
                                        {asignacion.nodoId && (
                                          <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1 text-orange-500" />
                                            <span className="text-sm text-gray-600">
                                              {getNombreNodo(asignacion.nodoId)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                        <span className="text-sm text-gray-500">
                                          {asignacion.horaInicio} - {asignacion.horaFin}
                                        </span>
                                      </div>
                                      {asignacion.observaciones && (
                                        <p className="text-xs text-gray-500 mt-1">{asignacion.observaciones}</p>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarAsignacion(asignacion.id!)}
                                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                      title="Eliminar asignación"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">Sin asignaciones</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || asignaciones.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Programación ({asignaciones.length})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
