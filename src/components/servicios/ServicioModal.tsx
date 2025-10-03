import React, { useState, useEffect } from 'react';
import { X, Settings, Users, MapPin, Clock, Calendar, Save, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useCarteras } from '../../hooks/useCarteras';
import { useClientesByCartera } from '../../hooks/useCarteras';
import { Cartera } from '../../types';

interface Personal {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  estado: string;
}

interface Cliente {
  id: string;
  nombre: string;
  rut: string;
  email: string;
  telefono: string;
  direccion: string;
  tipo: 'Empresa' | 'Persona';
  ubicacion?: string;
  seccion?: string;
}

interface ServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (servicio: any) => void;
}

export const ServicioModal: React.FC<ServicioModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    zonaGestion: '',
    categoria: '',
    cartera: '',
    cliente: '',
    lugar: '',
    duracion_horas: '',
    tiempoPlanificacion: '',
    personalRequerido: '',
    personalSeleccionado: [] as string[],
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personalActivo, setPersonalActivo] = useState<Personal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Obtener carteras del backend
  const { data: carterasResponse } = useCarteras({ limit: 100 });
  const carteras = carterasResponse?.data || [];

  // Obtener clientes de la cartera seleccionada
  const { data: clientesResponse, isLoading: isLoadingClientes } = useClientesByCartera(formData.cartera);

  // Actualizar clientes cuando cambie la respuesta del backend
  useEffect(() => {
    if (clientesResponse?.success && clientesResponse.data) {
      setClientes(clientesResponse.data);
    } else {
      setClientes([]);
    }
  }, [clientesResponse]);

  // Categorías por zona de gestión
  const categoriasPorZona = {
    'Minería': ['Mantenimiento', 'Servicio Spot'],
    'Industria': ['Servicio Integral', 'Programa de Lubricación', 'Levantamientos', 'Instalaciones']
  };


  // Cargar personal activo al abrir el modal
  useEffect(() => {
    if (isOpen) {
      // Simular carga de personal activo
      const personalMock: Personal[] = [
        { id: '1', rut: '12345678-9', nombre: 'Juan', apellido: 'Pérez', estado: 'Activo' },
        { id: '2', rut: '98765432-1', nombre: 'María', apellido: 'González', estado: 'Activo' },
        { id: '3', rut: '11223344-5', nombre: 'Carlos', apellido: 'López', estado: 'Activo' },
        { id: '4', rut: '55667788-9', nombre: 'Ana', apellido: 'Martínez', estado: 'Activo' },
        { id: '5', rut: '99887766-5', nombre: 'Luis', apellido: 'Rodríguez', estado: 'Activo' },
        { id: '6', rut: '44332211-9', nombre: 'Carmen', apellido: 'Fernández', estado: 'Activo' },
        { id: '7', rut: '77665544-3', nombre: 'Pedro', apellido: 'Sánchez', estado: 'Activo' },
        { id: '8', rut: '22334455-7', nombre: 'Laura', apellido: 'García', estado: 'Activo' },
      ];
      setPersonalActivo(personalMock);
    }
  }, [isOpen]);

  // Resetear formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: '',
        descripcion: '',
        zonaGestion: '',
        categoria: '',
        cartera: '',
        cliente: '',
        lugar: '',
        duracion_horas: '',
        tiempoPlanificacion: '',
        personalRequerido: '',
        personalSeleccionado: [],
      });
      setErrors([]);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores al cambiar input
    setErrors([]);
    
    // Si cambia la zona de gestión, resetear categoría
    if (field === 'zonaGestion') {
      setFormData(prev => ({
        ...prev,
        zonaGestion: value,
        categoria: ''
      }));
    }
    
    // Si cambia la cartera, resetear cliente
    if (field === 'cartera') {
      setFormData(prev => ({
        ...prev,
        cartera: value,
        cliente: ''
      }));
    }
  };

  const handlePersonalChange = (personalId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      personalSeleccionado: checked 
        ? [...prev.personalSeleccionado, personalId]
        : prev.personalSeleccionado.filter(id => id !== personalId)
    }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!formData.nombre.trim()) newErrors.push('El nombre del servicio es requerido');
    if (!formData.descripcion.trim()) newErrors.push('La descripción es requerida');
    if (!formData.zonaGestion) newErrors.push('La zona de gestión es requerida');
    if (!formData.categoria) newErrors.push('La categoría es requerida');
    if (!formData.cartera) newErrors.push('La cartera es requerida');
    if (!formData.cliente) newErrors.push('El cliente es requerido');
    if (!formData.lugar.trim()) newErrors.push('El lugar es requerido');
    if (!formData.duracion_horas || parseInt(formData.duracion_horas) <= 0) {
      newErrors.push('La duración en horas debe ser mayor a 0');
    }
    if (!formData.tiempoPlanificacion.trim()) newErrors.push('El tiempo de planificación es requerido');
    if (!formData.personalRequerido || parseInt(formData.personalRequerido) <= 0) {
      newErrors.push('El personal requerido debe ser mayor a 0');
    }
    if (formData.personalSeleccionado.length === 0) {
      newErrors.push('Debe seleccionar al menos un personal');
    } else if (formData.personalSeleccionado.length < parseInt(formData.personalRequerido)) {
      newErrors.push(`Debe seleccionar ${formData.personalRequerido} personas como mínimo. Actualmente ha seleccionado ${formData.personalSeleccionado.length} persona(s)`);
    } else if (formData.personalSeleccionado.length > parseInt(formData.personalRequerido)) {
      newErrors.push(`Ha seleccionado ${formData.personalSeleccionado.length} personas, pero solo se requieren ${formData.personalRequerido} persona(s)`);
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular creación del servicio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Preparar datos del servicio para enviar
      const servicioData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        zonaGestion: formData.zonaGestion,
        categoria: formData.categoria,
        cartera: formData.cartera,
        cliente: formData.cliente,
        lugar: formData.lugar,
        duracion_horas: parseInt(formData.duracion_horas),
        tiempoPlanificacion: formData.tiempoPlanificacion,
        personalRequerido: parseInt(formData.personalRequerido),
        personalSeleccionado: formData.personalSeleccionado
      };
      
      // eslint-disable-next-line no-console
      console.log('Servicio creado:', servicioData);
      
      onSuccess(servicioData);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al crear servicio:', error);
      setErrors(['Error al crear el servicio. Intente nuevamente.']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Servicio</h2>
              <p className="text-sm text-gray-500">Complete la información del servicio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Errores */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Por favor corrija los siguientes errores:</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((error) => (
                <li key={`error-${error.replace(/\s+/g, '-').toLowerCase()}`}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Servicio *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Mantenimiento Sistema de Lubricación"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cartera *
              </label>
              <select
                value={formData.cartera}
                onChange={(e) => handleInputChange('cartera', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar cartera</option>
                {carteras.map((cartera: Cartera) => (
                  <option key={cartera.id} value={cartera.id}>
                    {cartera.nombre?.replace('_', ' ').toUpperCase() || cartera.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción detallada del servicio"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={formData.cliente}
              onChange={(e) => handleInputChange('cliente', e.target.value)}
              disabled={!formData.cartera || isLoadingClientes}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!formData.cartera 
                  ? 'Primero seleccione una cartera' 
                  : isLoadingClientes 
                    ? 'Cargando clientes...' 
                    : 'Seleccionar cliente'
                }
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} ({cliente.tipo})
                </option>
              ))}
            </select>
            {formData.cartera && clientes.length === 0 && !isLoadingClientes && (
              <p className="text-sm text-gray-500 mt-1">
                No hay clientes disponibles en esta cartera
              </p>
            )}
          </div>

          {/* Zona de gestión y categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona de Gestión *
              </label>
              <select
                value={formData.zonaGestion}
                onChange={(e) => handleInputChange('zonaGestion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar zona</option>
                <option value="Minería">Minería</option>
                <option value="Industria">Industria</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                disabled={!formData.zonaGestion}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Seleccionar categoría</option>
                {formData.zonaGestion && categoriasPorZona[formData.zonaGestion as keyof typeof categoriasPorZona]?.map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ubicación y duración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Lugar *
              </label>
              <input
                type="text"
                value={formData.lugar}
                onChange={(e) => handleInputChange('lugar', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Planta Minera, Sitio Industrial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Duración (horas) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.duracion_horas}
                onChange={(e) => handleInputChange('duracion_horas', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 8"
              />
            </div>
          </div>

          {/* Planificación y personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Tiempo de Planificación *
              </label>
              <input
                type="text"
                value={formData.tiempoPlanificacion}
                onChange={(e) => handleInputChange('tiempoPlanificacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 1 semana, Emergencia, Mensual"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Personal Requerido *
              </label>
              <input
                type="number"
                min="1"
                value={formData.personalRequerido}
                onChange={(e) => handleInputChange('personalRequerido', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 3"
              />
            </div>
          </div>

          {/* Selección de personal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Users className="h-4 w-4 inline mr-1" />
              Seleccionar Personal Activo *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {personalActivo.map((persona) => (
                <label key={persona.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={formData.personalSeleccionado.includes(persona.id)}
                    onChange={(e) => handlePersonalChange(persona.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {persona.nombre} {persona.apellido}
                    </div>
                    <div className="text-xs text-gray-500">RUT: {persona.rut}</div>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {persona.estado}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Seleccionados: {formData.personalSeleccionado.length} de {formData.personalRequerido || 0} requeridos
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Creando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Servicio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
