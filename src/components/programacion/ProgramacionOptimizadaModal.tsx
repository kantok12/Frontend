import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, Clock, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { useCarteras } from '../../hooks/useCarteras';
import { usePersonalList } from '../../hooks/usePersonal';
import { useClientes, useNodos } from '../../hooks/useServicios';
import { useCrearProgramacionOptimizada, useCrearProgramacionSemanaOptimizada } from '../../hooks/useProgramacionOptimizada';

interface ProgramacionOptimizadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  fechaInicioSemana: Date;
  carteraId?: number;
}

interface FormData {
  rut: string;
  cartera_id: number;
  cliente_id?: number;
  nodo_id?: number;
  fechas_trabajo: string[];
  horas_estimadas: number;
  observaciones: string;
}

export const ProgramacionOptimizadaModal: React.FC<ProgramacionOptimizadaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  fechaInicioSemana,
  carteraId = 0
}) => {
  const [formData, setFormData] = useState<FormData>({
    rut: '',
    cartera_id: carteraId,
    cliente_id: undefined,
    nodo_id: undefined,
    fechas_trabajo: [],
    horas_estimadas: 8,
    observaciones: ''
  });

  const [selectedPersonal, setSelectedPersonal] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Hooks para datos
  const { data: carterasData } = useCarteras();
  const { data: personalData } = usePersonalList(1, 1000, '');
  const { data: clientesData } = useClientes({ limit: 1000 });
  const { data: nodosData } = useNodos({ limit: 1000 });

  // Hooks para mutaciones
  const crearProgramacion = useCrearProgramacionOptimizada();
  const crearProgramacionSemana = useCrearProgramacionSemanaOptimizada();

  // Datos procesados
  const carteras = carterasData?.data || [];
  const personal = personalData?.data?.items || [];
  const clientes = clientesData?.data || [];
  const nodos = nodosData?.data || [];

  // Días de la semana
  const diasSemana = [
    { key: 'lunes', nombre: 'Lunes', fecha: new Date(fechaInicioSemana.getTime() + 0 * 24 * 60 * 60 * 1000) },
    { key: 'martes', nombre: 'Martes', fecha: new Date(fechaInicioSemana.getTime() + 1 * 24 * 60 * 60 * 1000) },
    { key: 'miercoles', nombre: 'Miércoles', fecha: new Date(fechaInicioSemana.getTime() + 2 * 24 * 60 * 60 * 1000) },
    { key: 'jueves', nombre: 'Jueves', fecha: new Date(fechaInicioSemana.getTime() + 3 * 24 * 60 * 60 * 1000) },
    { key: 'viernes', nombre: 'Viernes', fecha: new Date(fechaInicioSemana.getTime() + 4 * 24 * 60 * 60 * 1000) },
    { key: 'sabado', nombre: 'Sábado', fecha: new Date(fechaInicioSemana.getTime() + 5 * 24 * 60 * 60 * 1000) },
    { key: 'domingo', nombre: 'Domingo', fecha: new Date(fechaInicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000) }
  ];

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        rut: '',
        cartera_id: carteraId,
        cliente_id: undefined,
        nodo_id: undefined,
        fechas_trabajo: [],
        horas_estimadas: 8,
        observaciones: ''
      });
      setSelectedPersonal(null);
      setSelectedDays([]);
      setStep(1);
      setErrors([]);
    }
  }, [isOpen, carteraId]);

  // Actualizar fechas de trabajo cuando cambian los días seleccionados
  useEffect(() => {
    const fechas = selectedDays.map(dia => {
      const diaData = diasSemana.find(d => d.key === dia);
      return diaData ? diaData.fecha.toISOString().split('T')[0] : '';
    }).filter(fecha => fecha);
    
    setFormData(prev => ({
      ...prev,
      fechas_trabajo: fechas
    }));
  }, [selectedDays]);

  // Actualizar horas estimadas cuando cambian los días
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      horas_estimadas: selectedDays.length * 8 // 8 horas por día
    }));
  }, [selectedDays]);

  const handlePersonalSelect = (personal: any) => {
    setSelectedPersonal(personal);
    setFormData(prev => ({
      ...prev,
      rut: personal.rut
    }));
  };

  const handleDayToggle = (dia: string) => {
    setSelectedDays(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const handleSubmit = async () => {
    setErrors([]);
    setIsLoading(true);

    try {
      // Validaciones
      if (!formData.rut) {
        setErrors(['Debe seleccionar un personal']);
        return;
      }
      if (!formData.cartera_id) {
        setErrors(['Debe seleccionar una cartera']);
        return;
      }
      if (formData.fechas_trabajo.length === 0) {
        setErrors(['Debe seleccionar al menos un día']);
        return;
      }

      // Crear programación
      const programacionData = {
        rut: formData.rut,
        cartera_id: formData.cartera_id,
        cliente_id: formData.cliente_id,
        nodo_id: formData.nodo_id,
        fechas_trabajo: formData.fechas_trabajo,
        horas_estimadas: formData.horas_estimadas,
        observaciones: formData.observaciones
      };

      await crearProgramacion.mutateAsync(programacionData);
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setErrors([error.message || 'Error al crear la programación']);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = formData.rut && formData.cartera_id && selectedDays.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Nueva Programación Optimizada</h2>
                <p className="text-blue-100 text-sm">
                  Semana del {fechaInicioSemana.toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, title: 'Personal', icon: Users },
              { step: 2, title: 'Cartera', icon: MapPin },
              { step: 3, title: 'Días', icon: Calendar },
              { step: 4, title: 'Confirmar', icon: CheckCircle }
            ].map(({ step: stepNum, title, icon: Icon }) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= stepNum ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {title}
                </span>
                {stepNum < 4 && (
                  <div className={`w-8 h-0.5 ml-4 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Errores */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-sm font-medium text-red-800">Errores encontrados:</h3>
              </div>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Paso 1: Seleccionar Personal */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personal.map((persona: any) => (
                  <div
                    key={persona.rut}
                    onClick={() => handlePersonalSelect(persona)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPersonal?.rut === persona.rut
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-semibold">
                          {persona.nombres?.charAt(0) || persona.rut?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {persona.nombres || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">{persona.rut}</div>
                        <div className="text-xs text-gray-400">{persona.cargo}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Seleccionar Cartera, Cliente y Nodo */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Trabajo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cartera */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cartera *
                  </label>
                  <select
                    value={formData.cartera_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, cartera_id: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Seleccionar cartera</option>
                    {carteras.map((cartera: any) => (
                      <option key={cartera.id} value={cartera.id}>
                        {cartera.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    value={formData.cliente_id || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      cliente_id: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((cliente: any) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nodo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nodo
                  </label>
                  <select
                    value={formData.nodo_id || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      nodo_id: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar nodo</option>
                    {nodos.map((nodo: any) => (
                      <option key={nodo.id} value={nodo.id}>
                        {nodo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Seleccionar Días */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Días de Trabajo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diasSemana.map((dia) => (
                  <div
                    key={dia.key}
                    onClick={() => handleDayToggle(dia.key)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDays.includes(dia.key)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{dia.nombre}</div>
                        <div className="text-xs text-gray-500">
                          {dia.fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      {selectedDays.includes(dia.key) && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Observaciones */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
          )}

          {/* Paso 4: Confirmar */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Programación</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Personal</h4>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-semibold">
                          {selectedPersonal?.nombres?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedPersonal?.nombres || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500">{selectedPersonal?.rut}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Configuración</h4>
                    <div className="text-sm text-gray-600">
                      <div>Cartera: {carteras.find((c: any) => c.id === formData.cartera_id)?.nombre || 'No seleccionada'}</div>
                      {formData.cliente_id && (
                        <div>Cliente: {clientes.find((c: any) => c.id === formData.cliente_id)?.nombre}</div>
                      )}
                      {formData.nodo_id && (
                        <div>Nodo: {nodos.find((n: any) => n.id === formData.nodo_id)?.nombre}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Días Seleccionados</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDays.map(dia => {
                        const diaData = diasSemana.find(d => d.key === dia);
                        return (
                          <span key={dia} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {diaData?.nombre}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
                    <div className="text-sm text-gray-600">
                      <div>Días: {selectedDays.length}</div>
                      <div>Horas estimadas: {formData.horas_estimadas}</div>
                      {formData.observaciones && (
                        <div>Observaciones: {formData.observaciones}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Programación
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
