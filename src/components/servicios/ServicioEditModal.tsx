import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ServicioEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (servicio: any) => void;
  servicio: any;
}

interface PersonalActivo {
  id: string;
  nombre: string;
  rut: string;
  estado: 'Activo' | 'Inactivo';
}


export const ServicioEditModal: React.FC<ServicioEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  servicio
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    zonaGestion: '',
    categoria: '',
    cartera: '',
    lugar: '',
    duracion_horas: '',
    tiempoPlanificacion: '',
    personalRequerido: '',
    personalSeleccionado: [] as string[],
    activo: true,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activePersonal: PersonalActivo[] = []; // TODO: Implementar carga de personal real desde el backend

  const zonaOptions = ['Minería', 'Industria'];
  const categoriaOptions: { [key: string]: string[] } = {
    Minería: ['Mantenimiento', 'Servicio Spot'],
    Industria: ['Servicio Integral', 'Programa de Lubricación', 'Levantamientos', 'Instalaciones'],
  };

  useEffect(() => {
    if (isOpen && servicio) {
      setFormData({
        nombre: servicio.nombre || '',
        descripcion: servicio.descripcion || '',
        zonaGestion: servicio.zonaGestion || '',
        categoria: servicio.categoria || '',
        cartera: servicio.cartera || '',
        lugar: servicio.lugar || '',
        duracion_horas: servicio.duracion_horas?.toString() || '',
        tiempoPlanificacion: servicio.tiempoPlanificacion || '',
        personalRequerido: servicio.personalRequerido?.toString() || '',
        personalSeleccionado: servicio.personalSeleccionado || [],
        activo: servicio.activo !== undefined ? servicio.activo : true,
      });
      setErrors([]);
    }
  }, [isOpen, servicio]);

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (!formData.nombre.trim()) newErrors.push('El nombre del servicio es requerido');
    if (!formData.descripcion.trim()) newErrors.push('La descripción es requerida');
    if (!formData.zonaGestion) newErrors.push('La zona de gestión es requerida');
    if (!formData.categoria) newErrors.push('La categoría es requerida');
    if (!formData.cartera) newErrors.push('La cartera es requerida');
    if (!formData.lugar.trim()) newErrors.push('El lugar es requerido');
    if (!formData.duracion_horas || parseInt(formData.duracion_horas) <= 0) {
      newErrors.push('La duración en horas debe ser un número positivo');
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

  const handleZonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZona = e.target.value;
    setFormData(prev => ({
      ...prev,
      zonaGestion: newZona,
      categoria: '', // Reset category when zona changes
    }));
  };

  const handlePersonalSelection = (personalId: string) => {
    setFormData(prev => {
      const isSelected = prev.personalSeleccionado.includes(personalId);
      const newSelection = isSelected
        ? prev.personalSeleccionado.filter(id => id !== personalId)
        : [...prev.personalSeleccionado, personalId];
      return { ...prev, personalSeleccionado: newSelection };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular actualización del servicio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Preparar datos del servicio actualizado
      const servicioActualizado = {
        ...servicio,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        zonaGestion: formData.zonaGestion,
        categoria: formData.categoria,
        cartera: formData.cartera,
        lugar: formData.lugar,
        duracion_horas: parseInt(formData.duracion_horas),
        tiempoPlanificacion: formData.tiempoPlanificacion,
        personalRequerido: parseInt(formData.personalRequerido),
        personalSeleccionado: formData.personalSeleccionado,
        activo: formData.activo,
        updated_at: new Date().toISOString(),
      };
      
      // eslint-disable-next-line no-console
      console.log('Servicio actualizado:', servicioActualizado);
      
      onSuccess(servicioActualizado);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al actualizar servicio:', error);
      setErrors(['Error al actualizar el servicio. Intente nuevamente.']);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Editar Servicio</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1: Detalles del Servicio */}
            <div className="space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Mantenimiento de Equipos Mineros"
                />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción detallada del servicio..."
                ></textarea>
              </div>
              <div>
                <label htmlFor="zonaGestion" className="block text-sm font-medium text-gray-700 mb-1">Zona de Gestión</label>
                <select
                  id="zonaGestion"
                  name="zonaGestion"
                  value={formData.zonaGestion}
                  onChange={handleZonaChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Seleccione una zona</option>
                  {zonaOptions.map(zona => (
                    <option key={zona} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>
              {formData.zonaGestion && (
                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Seleccione una categoría</option>
                    {categoriaOptions[formData.zonaGestion]?.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="cartera" className="block text-sm font-medium text-gray-700 mb-1">Cartera (Empresa Cliente)</label>
                <select
                  id="cartera"
                  name="cartera"
                  value={formData.cartera}
                  onChange={(e) => setFormData({ ...formData, cartera: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Seleccione una empresa</option>
                  {/* TODO: Implementar carga de empresas reales desde el backend */}
                  <option value="Empresa 1">Empresa 1</option>
                  <option value="Empresa 2">Empresa 2</option>
                </select>
              </div>
              <div>
                <label htmlFor="lugar" className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
                <input
                  type="text"
                  id="lugar"
                  name="lugar"
                  value={formData.lugar}
                  onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Faena Minera Escondida"
                />
              </div>
              <div>
                <label htmlFor="duracion_horas" className="block text-sm font-medium text-gray-700 mb-1">Duración (horas)</label>
                <input
                  type="number"
                  id="duracion_horas"
                  name="duracion_horas"
                  value={formData.duracion_horas}
                  onChange={(e) => setFormData({ ...formData, duracion_horas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 8"
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="tiempoPlanificacion" className="block text-sm font-medium text-gray-700 mb-1">Tiempo de Planificación</label>
                <input
                  type="text"
                  id="tiempoPlanificacion"
                  name="tiempoPlanificacion"
                  value={formData.tiempoPlanificacion}
                  onChange={(e) => setFormData({ ...formData, tiempoPlanificacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 1 semana, 3 días, Inmediato"
                />
              </div>
              <div>
                <label htmlFor="personalRequerido" className="block text-sm font-medium text-gray-700 mb-1">Personal Requerido</label>
                <input
                  type="number"
                  id="personalRequerido"
                  name="personalRequerido"
                  value={formData.personalRequerido}
                  onChange={(e) => setFormData({ ...formData, personalRequerido: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 3"
                  min="1"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Servicio Activo</span>
                </label>
              </div>
            </div>

            {/* Columna 2: Selección de Personal */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Personal Activo ({formData.personalSeleccionado.length} / {formData.personalRequerido || 0})
                </label>
                <div className="border border-gray-300 rounded-md p-3 h-64 overflow-y-auto bg-gray-50">
                  {activePersonal.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay personal activo disponible.</p>
                  ) : (
                    <div className="space-y-2">
                      {activePersonal.map(personal => (
                        <div key={personal.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`personal-${personal.id}`}
                            checked={formData.personalSeleccionado.includes(personal.id)}
                            onChange={() => handlePersonalSelection(personal.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`personal-${personal.id}`} className="ml-2 text-sm text-gray-900">
                            {personal.nombre} ({personal.rut})
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.personalRequerido && formData.personalSeleccionado.length !== parseInt(formData.personalRequerido) && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Debe seleccionar exactamente {formData.personalRequerido} personas.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Actualizar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
