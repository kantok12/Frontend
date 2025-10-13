import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Building, Save, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useCarteras } from '../../hooks/useCarteras';
import { useClientesByCartera } from '../../hooks/useCarteras';

interface Personal {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  estado: string;
}

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  cartera: string;
  cliente: string;
  lugar: string;
  duracion_horas: number;
  personalRequerido: number;
}

interface Asignacion {
  id: string;
  personalId: string;
  servicioId: string;
  dia: 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'SAB' | 'DOM';
  horaInicio: string;
  horaFin: string;
  cliente: string;
  lugar: string;
  servicioNombre: string;
  personalNombre: string;
}

interface PlanificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asignacion: Asignacion) => void;
  fechaInicio: Date; // Lunes de la semana
  asignacionesExistentes?: Asignacion[]; // Para validar conflictos
  asignacionEditando?: Asignacion | null; // Para editar una asignación existente
}

export const PlanificacionModal: React.FC<PlanificacionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  fechaInicio,
  asignacionesExistentes = [],
  asignacionEditando = null
}) => {
  const [formData, setFormData] = useState({
    personalId: '',
    servicioId: '',
    dia: 'LUN' as 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'SAB' | 'DOM',
    horaInicio: '08:00',
    horaFin: '12:00'
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personalActivo, setPersonalActivo] = useState<Personal[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  // Obtener carteras del backend (para futuras integraciones)
  // const { data: carterasResponse } = useCarteras({ limit: 100 });
  // const carteras = carterasResponse?.data || [];

  // Obtener clientes de la cartera seleccionada (si hay un servicio seleccionado)
  const servicioSeleccionado = servicios.find(s => s.id === formData.servicioId);
  const { data: clientesResponse } = useClientesByCartera(servicioSeleccionado?.cartera || '');

  // Días de la semana
  const diasSemana = [
    { value: 'LUN', label: 'Lunes' },
    { value: 'MAR', label: 'Martes' },
    { value: 'MIE', label: 'Miércoles' },
    { value: 'JUE', label: 'Jueves' },
    { value: 'VIE', label: 'Viernes' },
    { value: 'SAB', label: 'Sábado' },
    { value: 'DOM', label: 'Domingo' }
  ];

  // Cargar datos reales al abrir el modal
  useEffect(() => {
    if (isOpen) {
      // TODO: Implementar carga de personal activo desde el backend
      setPersonalActivo([]);
      // TODO: Implementar carga de servicios desde el backend
      setServicios([]);
    }
  }, [isOpen]);

  // Resetear formulario al abrir/cerrar o cargar datos de edición
  useEffect(() => {
    if (isOpen) {
      if (asignacionEditando) {
        // Cargar datos de la asignación que se está editando
        setFormData({
          personalId: asignacionEditando.personalId,
          servicioId: asignacionEditando.servicioId,
          dia: asignacionEditando.dia,
          horaInicio: asignacionEditando.horaInicio,
          horaFin: asignacionEditando.horaFin
        });
      } else {
        // Resetear formulario para nueva asignación
        setFormData({
          personalId: '',
          servicioId: '',
          dia: 'LUN',
          horaInicio: '08:00',
          horaFin: '12:00'
        });
      }
      setErrors([]);
    }
  }, [isOpen, asignacionEditando]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores al cambiar input
    setErrors([]);
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!formData.personalId) newErrors.push('Debe seleccionar un personal');
    if (!formData.servicioId) newErrors.push('Debe seleccionar un servicio');
    if (!formData.horaInicio) newErrors.push('La hora de inicio es requerida');
    if (!formData.horaFin) newErrors.push('La hora de fin es requerida');
    
    // Validar que la hora de fin sea posterior a la de inicio
    if (formData.horaInicio && formData.horaFin) {
      const inicio = new Date(`2000-01-01T${formData.horaInicio}`);
      const fin = new Date(`2000-01-01T${formData.horaFin}`);
      if (fin <= inicio) {
        newErrors.push('La hora de fin debe ser posterior a la hora de inicio');
      }
    }

    // Validar conflictos de horario (mismo personal, mismo día, horarios superpuestos)
    const personalSeleccionado = personalActivo.find(p => p.id === formData.personalId);
    const servicioSeleccionado = servicios.find(s => s.id === formData.servicioId);
    
    if (personalSeleccionado && servicioSeleccionado) {
      const conflictos = asignacionesExistentes.filter(asignacion => 
        asignacion.personalId === formData.personalId &&
        asignacion.dia === formData.dia &&
        asignacion.id !== formData.personalId // Excluir la asignación actual si se está editando
      );

      for (const conflicto of conflictos) {
        const inicioConflicto = new Date(`2000-01-01T${conflicto.horaInicio}`);
        const finConflicto = new Date(`2000-01-01T${conflicto.horaFin}`);
        const inicioNuevo = new Date(`2000-01-01T${formData.horaInicio}`);
        const finNuevo = new Date(`2000-01-01T${formData.horaFin}`);

        // Verificar superposición
        if ((inicioNuevo < finConflicto && finNuevo > inicioConflicto)) {
          newErrors.push(`Conflicto de horario: ${personalSeleccionado.nombre} ya está asignado de ${conflicto.horaInicio} a ${conflicto.horaFin} el ${diasSemana.find(d => d.value === formData.dia)?.label}`);
        }
      }
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
      // Simular creación de la asignación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const personalSeleccionado = personalActivo.find(p => p.id === formData.personalId);
      const servicioSeleccionado = servicios.find(s => s.id === formData.servicioId);
      const clienteSeleccionado = clientesResponse?.data?.find(c => c.id === servicioSeleccionado?.cliente);
      
      const asignacion: Asignacion = {
        id: asignacionEditando?.id || `asignacion_${Date.now()}`, // Usar ID existente o generar uno nuevo
        personalId: formData.personalId,
        servicioId: formData.servicioId,
        dia: formData.dia,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        cliente: clienteSeleccionado?.nombre || 'Cliente no encontrado',
        lugar: servicioSeleccionado?.lugar || 'Lugar no especificado',
        servicioNombre: servicioSeleccionado?.nombre || 'Servicio no encontrado',
        personalNombre: personalSeleccionado ? `${personalSeleccionado.nombre} ${personalSeleccionado.apellido}` : 'Personal no encontrado'
      };
      
      // eslint-disable-next-line no-console
      console.log('Asignación creada:', asignacion);
      
      onSuccess(asignacion);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al crear asignación:', error);
      setErrors(['Error al crear la asignación. Intente nuevamente.']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            {asignacionEditando ? 'Editar Asignación' : 'Nueva Asignación'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la semana */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center text-blue-800">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="font-medium">
                Semana del {fechaInicio.toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-red-800 font-medium">Errores de validación:</h3>
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error) => (
                  <li key={`error-${error.replace(/\s+/g, '-').toLowerCase()}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Campos del formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Personal *
              </label>
              <select
                value={formData.personalId}
                onChange={(e) => handleInputChange('personalId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar personal</option>
                {personalActivo.map((personal) => (
                  <option key={personal.id} value={personal.id}>
                    {personal.nombre} {personal.apellido} ({personal.rut})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                Servicio *
              </label>
              <select
                value={formData.servicioId}
                onChange={(e) => handleInputChange('servicioId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar servicio</option>
                {servicios.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Día *
              </label>
              <select
                value={formData.dia}
                onChange={(e) => handleInputChange('dia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {diasSemana.map((dia) => (
                  <option key={dia.value} value={dia.value}>
                    {dia.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Hora Inicio *
              </label>
              <input
                type="time"
                value={formData.horaInicio}
                onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Hora Fin *
              </label>
              <input
                type="time"
                value={formData.horaFin}
                onChange={(e) => handleInputChange('horaFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Información del servicio seleccionado */}
          {servicioSeleccionado && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Información del Servicio:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cliente:</span>
                  <span className="ml-2 font-medium">{servicioSeleccionado.cliente}</span>
                </div>
                <div>
                  <span className="text-gray-600">Lugar:</span>
                  <span className="ml-2 font-medium">{servicioSeleccionado.lugar}</span>
                </div>
                <div>
                  <span className="text-gray-600">Duración:</span>
                  <span className="ml-2 font-medium">{servicioSeleccionado.duracion_horas} horas</span>
                </div>
                <div>
                  <span className="text-gray-600">Personal Requerido:</span>
                  <span className="ml-2 font-medium">{servicioSeleccionado.personalRequerido} personas</span>
                </div>
              </div>
            </div>
          )}

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
                  <span className="ml-2">{asignacionEditando ? 'Actualizando...' : 'Asignando...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {asignacionEditando ? 'Actualizar' : 'Asignar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
