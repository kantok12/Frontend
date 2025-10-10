import React, { useState, useEffect } from 'react';
import { X, Plus, MapPin, Building, User, Save } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Nodo {
  id?: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  tipo: 'Oficina' | 'Sucursal' | 'Almacén' | 'Otro';
}

interface AgregarNodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clienteId: string, nodos: Nodo[]) => void;
  clientes: any[];
}

export const AgregarNodoModal: React.FC<AgregarNodoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientes
}) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [nodos, setNodos] = useState<Nodo[]>([]);
  const [nuevoNodo, setNuevoNodo] = useState<Nodo>({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    tipo: 'Oficina'
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNodoForm, setShowNodoForm] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setClienteSeleccionado('');
      setNodos([]);
      setNuevoNodo({
        nombre: '',
        descripcion: '',
        ubicacion: '',
        tipo: 'Oficina'
      });
      setErrors([]);
      setShowNodoForm(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!clienteSeleccionado) {
      newErrors.push('Debe seleccionar un cliente');
    }

    if (nodos.length === 0) {
      newErrors.push('Debe agregar al menos un nodo');
    }

    return newErrors;
  };

  const validateNodo = (nodo: Nodo) => {
    const errors: string[] = [];

    if (!nodo.nombre.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!nodo.ubicacion?.trim()) {
      errors.push('La ubicación es requerida');
    }

    return errors;
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClienteSeleccionado(e.target.value);
    setNodos([]); // Limpiar nodos al cambiar cliente
  };

  const handleNodoInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoNodo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNodo = () => {
    const nodoErrors = validateNodo(nuevoNodo);
    
    if (nodoErrors.length > 0) {
      setErrors(nodoErrors);
      return;
    }

    // Verificar si el nombre ya existe en la lista actual
    if (nodos.some(n => n.nombre === nuevoNodo.nombre)) {
      setErrors(['Ya existe un nodo con este nombre en la lista']);
      return;
    }

    const nodoConId = {
      ...nuevoNodo,
      id: Date.now().toString()
    };

    setNodos(prev => [...prev, nodoConId]);
    setNuevoNodo({
      nombre: '',
      descripcion: '',
      ubicacion: '',
      tipo: 'Oficina'
    });
    setShowNodoForm(false);
    setErrors([]);
  };

  const handleRemoveNodo = (nodoId: string) => {
    setNodos(prev => prev.filter(n => n.id !== nodoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSuccess(clienteSeleccionado, nodos);
      onClose();
    } catch (error) {
      setErrors(['Error al agregar los nodos']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Agregar Nodos a Cliente
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Seleccionar Cliente
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={clienteSeleccionado}
                onChange={handleClienteChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre || 'Sin nombre'} - {cliente.total_nodos || 0} nodos
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gestión de Nodos */}
          {clienteSeleccionado && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Nodos a Agregar ({nodos.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNodoForm(!showNodoForm)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showNodoForm ? 'Cancelar' : 'Agregar Nodo'}
                </button>
              </div>

              {/* Formulario de Nuevo Nodo */}
              {showNodoForm && (
                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Nuevo Nodo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Nodo *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={nuevoNodo.nombre}
                        onChange={handleNodoInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre del nodo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Nodo
                      </label>
                      <select
                        name="tipo"
                        value={nuevoNodo.tipo}
                        onChange={handleNodoInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Oficina">Oficina</option>
                        <option value="Sucursal">Sucursal</option>
                        <option value="Almacén">Almacén</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ubicación *
                      </label>
                      <input
                        type="text"
                        name="ubicacion"
                        value={nuevoNodo.ubicacion}
                        onChange={handleNodoInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dirección o ubicación del nodo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <input
                        type="text"
                        name="descripcion"
                        value={nuevoNodo.descripcion}
                        onChange={handleNodoInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción opcional del nodo"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowNodoForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNodo}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Nodo
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Nodos */}
              {nodos.length > 0 ? (
                <div className="space-y-3">
                  {nodos.map((nodo) => (
                    <div key={nodo.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{nodo.nombre}</h5>
                              <p className="text-sm text-gray-500">{nodo.tipo}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {nodo.ubicacion}
                            </div>
                            {nodo.descripcion && (
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {nodo.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNodo(nodo.id!)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Eliminar nodo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay nodos agregados</p>
                  <p className="text-sm">Haz clic en "Agregar Nodo" para comenzar</p>
                </div>
              )}
            </div>
          )}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-red-800 font-semibold mb-2">Errores encontrados:</h4>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={`error-${error.replace(/\s+/g, '-').toLowerCase()}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}

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
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Agregando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Agregar Nodos
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
