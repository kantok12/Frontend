import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Building, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

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

interface AsignacionSemanal {
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

interface PlanificacionSemanalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asignaciones: AsignacionSemanal[]) => void;
  fechaInicio: Date; // Lunes de la semana
  asignacionesExistentes?: AsignacionSemanal[]; // Para validar conflictos
}

export const PlanificacionSemanalModal: React.FC<PlanificacionSemanalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  fechaInicio,
  asignacionesExistentes = []
}) => {
  const [asignaciones, setAsignaciones] = useState<AsignacionSemanal[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personalActivo, setPersonalActivo] = useState<Personal[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

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

  // Cargar datos al abrir el modal
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

      // Simular servicios disponibles
      const serviciosMock: Servicio[] = [
        {
          id: '1',
          nombre: 'Mantenimiento Sistema Lubricación',
          descripcion: 'Mantenimiento preventivo del sistema de lubricación',
          cartera: '6',
          cliente: '1',
          lugar: 'Antofagasta',
          duracion_horas: 4,
          personalRequerido: 2
        },
        {
          id: '2',
          nombre: 'Inspección Equipos Mineros',
          descripcion: 'Inspección general de equipos mineros',
          cartera: '6',
          cliente: '2',
          lugar: 'Calama',
          duracion_horas: 6,
          personalRequerido: 3
        },
        {
          id: '3',
          nombre: 'Servicio Integral Industrial',
          descripcion: 'Servicio integral para planta industrial',
          cartera: '7',
          cliente: '3',
          lugar: 'Concepción',
          duracion_horas: 8,
          personalRequerido: 4
        }
      ];
      setServicios(serviciosMock);

      // Inicializar con asignaciones existentes si las hay
      setAsignaciones(asignacionesExistentes);
    }
  }, [isOpen, asignacionesExistentes]);

  // Resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      setAsignaciones([]);
      setErrors([]);
    }
  }, [isOpen]);

  const agregarAsignacion = () => {
    const nuevaAsignacion: AsignacionSemanal = {
      id: `asignacion_${Date.now()}`,
      personalId: '',
      servicioId: '',
      dia: 'LUN',
      horaInicio: '08:00',
      horaFin: '12:00',
      cliente: '',
      lugar: '',
      servicioNombre: '',
      personalNombre: ''
    };
    setAsignaciones(prev => [...prev, nuevaAsignacion]);
  };

  const eliminarAsignacion = (id: string) => {
    setAsignaciones(prev => prev.filter(a => a.id !== id));
  };

  const actualizarAsignacion = (id: string, campo: string, valor: string) => {
    setAsignaciones(prev => prev.map(asignacion => {
      if (asignacion.id === id) {
        const actualizada = { ...asignacion, [campo]: valor };
        
        // Actualizar datos relacionados
        if (campo === 'personalId') {
          const personal = personalActivo.find(p => p.id === valor);
          actualizada.personalNombre = personal ? `${personal.nombre} ${personal.apellido}` : '';
        }
        
        if (campo === 'servicioId') {
          const servicio = servicios.find(s => s.id === valor);
          actualizada.servicioNombre = servicio?.nombre || '';
          actualizada.cliente = servicio?.cliente || '';
          actualizada.lugar = servicio?.lugar || '';
        }
        
        return actualizada;
      }
      return asignacion;
    }));
  };

  const validateAsignaciones = () => {
    const newErrors: string[] = [];
    
    // Validar que todas las asignaciones tengan datos completos
    asignaciones.forEach((asignacion, index) => {
      if (!asignacion.personalId) {
        newErrors.push(`Asignación ${index + 1}: Debe seleccionar un personal`);
      }
      if (!asignacion.servicioId) {
        newErrors.push(`Asignación ${index + 1}: Debe seleccionar un servicio`);
      }
      if (!asignacion.horaInicio || !asignacion.horaFin) {
        newErrors.push(`Asignación ${index + 1}: Debe especificar horarios`);
      }
      
      // Validar que la hora de fin sea posterior a la de inicio
      if (asignacion.horaInicio && asignacion.horaFin) {
        const inicio = new Date(`2000-01-01T${asignacion.horaInicio}`);
        const fin = new Date(`2000-01-01T${asignacion.horaFin}`);
        if (fin <= inicio) {
          newErrors.push(`Asignación ${index + 1}: La hora de fin debe ser posterior a la hora de inicio`);
        }
      }
    });

    // Validar conflictos de horario
    asignaciones.forEach((asignacion, index) => {
      const conflictos = asignaciones.filter((otra, otroIndex) => 
        otroIndex !== index &&
        otra.personalId === asignacion.personalId &&
        otra.dia === asignacion.dia &&
        otra.id !== asignacion.id
      );

      for (const conflicto of conflictos) {
        const inicioConflicto = new Date(`2000-01-01T${conflicto.horaInicio}`);
        const finConflicto = new Date(`2000-01-01T${conflicto.horaFin}`);
        const inicioNuevo = new Date(`2000-01-01T${asignacion.horaInicio}`);
        const finNuevo = new Date(`2000-01-01T${asignacion.horaFin}`);

        if ((inicioNuevo < finConflicto && finNuevo > inicioConflicto)) {
          const personal = personalActivo.find(p => p.id === asignacion.personalId);
          const diaLabel = diasSemana.find(d => d.value === asignacion.dia)?.label;
          newErrors.push(`Conflicto: ${personal?.nombre} ${personal?.apellido} tiene horarios superpuestos el ${diaLabel}`);
        }
      }
    });
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateAsignaciones();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // eslint-disable-next-line no-console
      console.log('Planificación semanal guardada:', asignaciones);
      
      onSuccess(asignaciones);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al guardar planificación:', error);
      setErrors(['Error al guardar la planificación. Intente nuevamente.']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            Planificación Semanal Completa
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Información de la semana */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center text-blue-800">
            <Calendar className="h-5 w-5 mr-2" />
            <span className="font-medium">
              Semana del {fechaInicio.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })} al {new Date(fechaInicio.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </span>
          </div>
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

          {/* Botón para agregar asignación */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Asignaciones de la Semana ({asignaciones.length})
            </h3>
            <button
              type="button"
              onClick={agregarAsignacion}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Asignación
            </button>
          </div>

          {/* Lista de asignaciones */}
          <div className="space-y-4">
            {asignaciones.map((asignacion, index) => (
              <div key={asignacion.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Asignación {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => eliminarAsignacion(asignacion.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Personal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Personal *
                    </label>
                    <select
                      value={asignacion.personalId}
                      onChange={(e) => actualizarAsignacion(asignacion.id, 'personalId', e.target.value)}
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

                  {/* Servicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="h-4 w-4 inline mr-1" />
                      Servicio *
                    </label>
                    <select
                      value={asignacion.servicioId}
                      onChange={(e) => actualizarAsignacion(asignacion.id, 'servicioId', e.target.value)}
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

                  {/* Día */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Día *
                    </label>
                    <select
                      value={asignacion.dia}
                      onChange={(e) => actualizarAsignacion(asignacion.id, 'dia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {diasSemana.map((dia) => (
                        <option key={dia.value} value={dia.value}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Horarios */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Horarios *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        value={asignacion.horaInicio}
                        onChange={(e) => actualizarAsignacion(asignacion.id, 'horaInicio', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Inicio"
                      />
                      <input
                        type="time"
                        value={asignacion.horaFin}
                        onChange={(e) => actualizarAsignacion(asignacion.id, 'horaFin', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Fin"
                      />
                    </div>
                  </div>
                </div>

                {/* Información del servicio */}
                {asignacion.servicioId && (
                  <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">Información del Servicio:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Cliente:</span>
                        <span className="ml-2 font-medium">{asignacion.cliente || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Lugar:</span>
                        <span className="ml-2 font-medium">{asignacion.lugar || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Servicio:</span>
                        <span className="ml-2 font-medium">{asignacion.servicioNombre || 'No especificado'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {asignaciones.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No hay asignaciones</p>
                <p className="text-sm mb-4">Comienza agregando asignaciones para la semana</p>
                <button
                  type="button"
                  onClick={agregarAsignacion}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Asignación
                </button>
              </div>
            )}
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
              disabled={isLoading || asignaciones.length === 0}
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
                  Guardar Planificación ({asignaciones.length} asignaciones)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
