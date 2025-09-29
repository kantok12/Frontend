import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Building, Save, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { usePersonal } from '../../hooks/useNombres';
import { useCarteras } from '../../hooks/useCarteras';

interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (evento: any) => void;
  evento?: any; // Para edición
}

export const EventoModal: React.FC<EventoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  evento
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    duracion: '',
    ubicacion: '',
    zonaGestion: '',
    categoria: '',
    personalAsignado: [] as string[],
    cartera: '',
    cliente: '',
    estado: 'programado'
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener datos del backend
  const { data: personalResponse } = usePersonal({ limit: 100 });
  const { data: carterasResponse } = useCarteras({ limit: 100 });
  
  const personal = personalResponse?.data || [];
  const carteras = carterasResponse?.data || [];

  // Obtener clientes de la cartera seleccionada
  const carteraSeleccionada = carteras.find(c => c.id === formData.cartera);
  const clientes = carteraSeleccionada?.clientes || [];

  // Categorías por zona de gestión
  const categoriasPorZona = {
    'Minería': ['Mantenimiento', 'Servicio Spot', 'Inspección', 'Emergencia'],
    'Industria': ['Servicio Integral', 'Programa de Lubricación', 'Levantamiento', 'Instalaciones']
  };

  // Resetear formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      if (evento) {
        // Cargar datos del evento para edición
        setFormData({
          titulo: evento.titulo || '',
          descripcion: evento.descripcion || '',
          fecha: evento.fecha || '',
          hora: evento.hora || '',
          duracion: evento.duracion || '',
          ubicacion: evento.ubicacion || '',
          zonaGestion: evento.zonaGestion || '',
          categoria: evento.categoria || '',
          personalAsignado: evento.personal || [],
          cartera: evento.cartera || '',
          cliente: evento.cliente || '',
          estado: evento.estado || 'programado'
        });
      } else {
        // Resetear formulario para nuevo evento
        setFormData({
          titulo: '',
          descripcion: '',
          fecha: new Date().toISOString().split('T')[0], // Fecha actual
          hora: '08:00',
          duracion: '4',
          ubicacion: '',
          zonaGestion: '',
          categoria: '',
          personalAsignado: [],
          cartera: '',
          cliente: '',
          estado: 'programado'
        });
      }
      setErrors([]);
    }
  }, [isOpen, evento]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores al cambiar input
    setErrors([]);
  };

  const handlePersonalChange = (personalId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      personalAsignado: checked 
        ? [...prev.personalAsignado, personalId]
        : prev.personalAsignado.filter(id => id !== personalId)
    }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!formData.titulo.trim()) newErrors.push('El título es requerido');
    if (!formData.fecha) newErrors.push('La fecha es requerida');
    if (!formData.hora) newErrors.push('La hora es requerida');
    if (!formData.duracion) newErrors.push('La duración es requerida');
    if (!formData.ubicacion.trim()) newErrors.push('La ubicación es requerida');
    if (!formData.zonaGestion) newErrors.push('La zona de gestión es requerida');
    if (!formData.categoria) newErrors.push('La categoría es requerida');
    if (formData.personalAsignado.length === 0) newErrors.push('Debe asignar al menos un personal');
    
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
      // Simular creación/actualización del evento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const eventoData = {
        ...formData,
        id: evento?.id || `evento_${Date.now()}`,
        personal: formData.personalAsignado,
        fechaCreacion: evento?.fechaCreacion || new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      };
      
      // eslint-disable-next-line no-console
      console.log('Evento guardado:', eventoData);
      
      onSuccess(eventoData);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al guardar evento:', error);
      setErrors(['Error al guardar el evento. Intente nuevamente.']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            {evento ? 'Editar Evento' : 'Nuevo Evento'}
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
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-red-800 font-medium">Errores de validación:</h3>
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={`error-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Evento *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Mantenimiento Sistema Minero"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada del evento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Hora *
              </label>
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => handleInputChange('hora', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (horas) *
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.duracion}
                onChange={(e) => handleInputChange('duracion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Ubicación *
              </label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Planta Minera Norte"
              />
            </div>
          </div>

          {/* Zona y categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona de Gestión *
              </label>
              <select
                value={formData.zonaGestion}
                onChange={(e) => {
                  handleInputChange('zonaGestion', e.target.value);
                  handleInputChange('categoria', ''); // Reset categoría
                }}
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
                {formData.zonaGestion && categoriasPorZona[formData.zonaGestion as keyof typeof categoriasPorZona]?.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cartera y cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                Cartera
              </label>
              <select
                value={formData.cartera}
                onChange={(e) => {
                  handleInputChange('cartera', e.target.value);
                  handleInputChange('cliente', ''); // Reset cliente
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar cartera</option>
                {carteras.map(cartera => (
                  <option key={cartera.id} value={cartera.id}>
                    {cartera.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                value={formData.cliente}
                onChange={(e) => handleInputChange('cliente', e.target.value)}
                disabled={!formData.cartera}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map((cliente: any) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Personal asignado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-1" />
              Personal Asignado *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {personal.map((persona: any) => (
                <label key={persona.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.personalAsignado.includes(persona.id)}
                    onChange={(e) => handlePersonalChange(persona.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {persona.nombre} {persona.apellido}
                  </span>
                </label>
              ))}
            </div>
            {formData.personalAsignado.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">Seleccione al menos un personal</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="programado">Programado</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {evento ? 'Actualizar' : 'Crear'} Evento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
