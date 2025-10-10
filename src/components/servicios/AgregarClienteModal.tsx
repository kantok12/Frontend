import React, { useState, useEffect } from 'react';
import { X, Plus, User, Building, MapPin, Phone, Mail, Save } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Cliente {
  id?: string;
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  direccion: string;
  tipo: 'Empresa' | 'Persona';
  ubicacion?: string;
  seccion?: string;
}

interface AgregarClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (carteraId: string, clientes: Cliente[]) => void;
  carteras: any[];
}

export const AgregarClienteModal: React.FC<AgregarClienteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  carteras
}) => {
  const [carteraSeleccionada, setCarteraSeleccionada] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nuevoCliente, setNuevoCliente] = useState<Cliente>({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: '',
    tipo: 'Empresa',
    ubicacion: '',
    seccion: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClienteForm, setShowClienteForm] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCarteraSeleccionada('');
      setClientes([]);
      setNuevoCliente({
        nombre: '',
        rut: '',
        email: '',
        telefono: '',
        direccion: '',
        tipo: 'Empresa',
        ubicacion: '',
        seccion: ''
      });
      setErrors([]);
      setShowClienteForm(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!carteraSeleccionada) {
      newErrors.push('Debe seleccionar una cartera');
    }

    if (clientes.length === 0) {
      newErrors.push('Debe agregar al menos un cliente');
    }

    return newErrors;
  };

  const validateCliente = (cliente: Cliente) => {
    const errors: string[] = [];

    if (!cliente.nombre.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!cliente.rut.trim()) {
      errors.push('El RUT es requerido');
    }

    if (!cliente.email.trim()) {
      errors.push('El email es requerido');
    } else if (!/\S+@\S+\.\S+/.test(cliente.email)) {
      errors.push('El email no es válido');
    }

    if (!cliente.telefono.trim()) {
      errors.push('El teléfono es requerido');
    }

    if (!cliente.ubicacion?.trim()) {
      errors.push('La ubicación es requerida');
    }

    if (!cliente.seccion?.trim()) {
      errors.push('La sección es requerida');
    }

    return errors;
  };

  const handleCarteraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCarteraSeleccionada(e.target.value);
    setClientes([]); // Limpiar clientes al cambiar cartera
  };

  const handleClienteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCliente = () => {
    const clienteErrors = validateCliente(nuevoCliente);
    
    if (clienteErrors.length > 0) {
      setErrors(clienteErrors);
      return;
    }

    // Verificar si el RUT ya existe en la lista actual
    if (clientes.some(c => c.rut === nuevoCliente.rut)) {
      setErrors(['Ya existe un cliente con este RUT en la lista']);
      return;
    }

    const clienteConId = {
      ...nuevoCliente,
      id: Date.now().toString()
    };

    setClientes(prev => [...prev, clienteConId]);
    setNuevoCliente({
      nombre: '',
      rut: '',
      email: '',
      telefono: '',
      direccion: '',
      tipo: 'Empresa',
      ubicacion: '',
      seccion: ''
    });
    setShowClienteForm(false);
    setErrors([]);
  };

  const handleRemoveCliente = (clienteId: string) => {
    setClientes(prev => prev.filter(c => c.id !== clienteId));
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

      onSuccess(carteraSeleccionada, clientes);
      onClose();
    } catch (error) {
      setErrors(['Error al agregar los clientes']);
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
            Agregar Clientes a Cartera
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Cartera */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              Seleccionar Cartera
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cartera *
              </label>
              <select
                value={carteraSeleccionada}
                onChange={handleCarteraChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar cartera...</option>
                {carteras.map((cartera) => (
                  <option key={cartera.id} value={cartera.id}>
                    {cartera.name?.replace('_', ' ') || cartera.nombre || 'Sin nombre'} - {cartera.total_clientes || 0} clientes
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gestión de Clientes */}
          {carteraSeleccionada && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  Clientes a Agregar ({clientes.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowClienteForm(!showClienteForm)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showClienteForm ? 'Cancelar' : 'Agregar Cliente'}
                </button>
              </div>

              {/* Formulario de Nuevo Cliente */}
              {showClienteForm && (
                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Nuevo Cliente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre/Razón Social *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={nuevoCliente.nombre}
                        onChange={handleClienteInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre completo o razón social"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RUT *
                      </label>
                      <input
                        type="text"
                        name="rut"
                        value={nuevoCliente.rut}
                        onChange={handleClienteInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="12.345.678-9"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={nuevoCliente.email}
                        onChange={handleClienteInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="cliente@empresa.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={nuevoCliente.telefono}
                        onChange={handleClienteInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+56 9 1234 5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ubicación *
                      </label>
                      <input
                        type="text"
                        name="ubicacion"
                        value={nuevoCliente.ubicacion}
                        onChange={handleClienteInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Santiago, Antofagasta, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sección *
                      </label>
                      <input
                        type="text"
                        name="seccion"
                        value={nuevoCliente.seccion}
                        onChange={handleClienteInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Norte, Centro, Sur, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        name="tipo"
                        value={nuevoCliente.tipo}
                        onChange={handleClienteInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Empresa">Empresa</option>
                        <option value="Persona">Persona</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        name="direccion"
                        value={nuevoCliente.direccion}
                        onChange={handleClienteInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dirección completa"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowClienteForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCliente}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Cliente
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Clientes */}
              {clientes.length > 0 ? (
                <div className="space-y-3">
                  {clientes.map((cliente) => (
                    <div key={cliente.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                              cliente.tipo === 'Empresa' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {cliente.tipo === 'Empresa' ? (
                                <Building className="h-4 w-4 text-blue-600" />
                              ) : (
                                <User className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{cliente.nombre}</h5>
                              <p className="text-sm text-gray-500">RUT: {cliente.rut}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {cliente.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {cliente.telefono}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {cliente.ubicacion}
                            </div>
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {cliente.seccion}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCliente(cliente.id!)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Eliminar cliente"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay clientes agregados</p>
                  <p className="text-sm">Haz clic en "Agregar Cliente" para comenzar</p>
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
                  Agregar Clientes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
