import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useCarteras } from '../../hooks/useCarteras';
import { usePersonalList } from '../../hooks/usePersonal';
import { Personal } from '../../types';
import { useProgramacionSemanal } from '../../hooks/useProgramacion';
import { apiService } from '../../services/api';

interface ModernProgramacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fechaInicioSemana: Date;
  carteraSeleccionada?: number;
}

const ModernProgramacionModal: React.FC<ModernProgramacionModalProps> = ({
  isOpen,
  onClose,
  fechaInicioSemana,
  carteraSeleccionada
}) => {
  const [formData, setFormData] = useState({
    carteraId: carteraSeleccionada || 0,
    clienteId: 0,
    nodoId: 0,
    personalId: '',
    dias: {
      domingo: false,
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false
    }
  });

  const [selectedPersonal, setSelectedPersonal] = useState<any[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const { data: carterasData } = useCarteras();
  const { data: personalData } = usePersonalList(1, 1000, '');
  const personalConDocumentacion = personalData?.data?.items || [];
  const { crearProgramacion } = useProgramacionSemanal(
    carteraSeleccionada || 0,
    fechaInicioSemana.toISOString().split('T')[0]
  );

  // Extraer carteras del response
  const carteras = carterasData?.data?.items || [];

  const diasSemana = [
    { key: 'lunes', nombre: 'Lunes', numero: fechaInicioSemana.getDate() + 1 },
    { key: 'martes', nombre: 'Martes', numero: fechaInicioSemana.getDate() + 2 },
    { key: 'miercoles', nombre: 'Miércoles', numero: fechaInicioSemana.getDate() + 3 },
    { key: 'jueves', nombre: 'Jueves', numero: fechaInicioSemana.getDate() + 4 },
    { key: 'viernes', nombre: 'Viernes', numero: fechaInicioSemana.getDate() + 5 },
    { key: 'sabado', nombre: 'Sábado', numero: fechaInicioSemana.getDate() + 6 },
    { key: 'domingo', nombre: 'Domingo', numero: fechaInicioSemana.getDate() }
  ];

  const carteraSeleccionadaData = carteras.find((c: any) => c.id === formData.carteraId);
  const clientes = carteraSeleccionadaData?.clientes || [];
  const clienteSeleccionado = clientes.find((c: any) => c.id === formData.clienteId);
  const nodos = clienteSeleccionado?.nodos || [];

  useEffect(() => {
    if (carteraSeleccionada) {
      setFormData(prev => ({ ...prev, carteraId: carteraSeleccionada }));
    }
  }, [carteraSeleccionada]);

  const handleCarteraChange = (carteraId: number) => {
    setFormData({
      ...formData,
      carteraId,
      clienteId: 0,
      nodoId: 0
    });
  };

  const handleClienteChange = (clienteId: number) => {
    setFormData({
      ...formData,
      clienteId,
      nodoId: 0
    });
  };

  const handleNodoChange = (nodoId: number) => {
    setFormData({
      ...formData,
      nodoId
    });
  };

  const handlePersonalSelect = (personal: any) => {
    setSelectedPersonal(prev => {
      const exists = prev.find(p => p.id === personal.id);
      if (exists) {
        return prev.filter(p => p.id !== personal.id);
      } else {
        return [...prev, personal];
      }
    });
  };

  const handleDaySelect = (dayKey: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayKey)) {
        return prev.filter(d => d !== dayKey);
      } else {
        return [...prev, dayKey];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedPersonal.length === 0 || selectedDays.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      // Crear las asignaciones una por una
      const promises = selectedPersonal.map(personal => {
        const programacionData = {
          rut: personal.rut,
          cliente_id: formData.clienteId,
          nodo_id: formData.nodoId,
          ...selectedDays.reduce((acc, day) => {
            acc[day] = true;
            return acc;
          }, {} as any)
        };
        
        return crearProgramacion.mutateAsync(programacionData);
      });

      await Promise.all(promises);
      onClose();
    } catch (error) {
      console.error('Error al crear programación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToStep2 = formData.carteraId > 0 && formData.clienteId > 0 && formData.nodoId > 0;
  const canProceedToStep3 = selectedPersonal.length > 0;
  const canSubmit = selectedDays.length > 0;

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
                <h2 className="text-xl font-bold">Nueva Programación</h2>
                <p className="text-blue-100 text-sm">
                  {fechaInicioSemana.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
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
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: 'Destino', icon: MapPin },
              { step: 2, title: 'Personal', icon: Users },
              { step: 3, title: 'Días', icon: Calendar },
              { step: 4, title: 'Confirmar', icon: CheckCircle }
            ].map(({ step: stepNum, title, icon: Icon }) => (
              <div key={stepNum} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= stepNum 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= stepNum ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {title}
                </span>
                {stepNum < 4 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Destino */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Destino</h3>
                
                {/* Cartera */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cartera
                  </label>
                  <select
                    value={formData.carteraId}
                    onChange={(e) => handleCarteraChange(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                {formData.carteraId > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente
                    </label>
                    <select
                      value={formData.clienteId}
                      onChange={(e) => handleClienteChange(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>Seleccionar cliente</option>
                      {clientes.map((cliente: any) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Nodo */}
                {formData.clienteId > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nodo
                    </label>
                    <select
                      value={formData.nodoId}
                      onChange={(e) => handleNodoChange(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>Seleccionar nodo</option>
                      {nodos.map((nodo: any) => (
                        <option key={nodo.id} value={nodo.id}>
                          {nodo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Personal */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Seleccionar Personal ({selectedPersonal.length} seleccionados)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalConDocumentacion.map((personal: Personal) => {
                    const isSelected = selectedPersonal.find(p => p.id === personal.id);
                    return (
                      <div
                        key={personal.id}
                        onClick={() => handlePersonalSelect(personal)}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{personal.nombre}</div>
                            <div className="text-sm text-gray-500">{personal.rut}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Días */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Seleccionar Días ({selectedDays.length} seleccionados)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {diasSemana.map(dia => {
                    const isSelected = selectedDays.includes(dia.key);
                    return (
                      <div
                        key={dia.key}
                        onClick={() => handleDaySelect(dia.key)}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                          isSelected
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 mx-auto mb-2 ${
                          isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                        </div>
                        <div className="font-medium text-gray-900">{dia.nombre}</div>
                        <div className="text-sm text-gray-500">{dia.numero}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmar */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Programación</h3>
                
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {carteraSeleccionadaData?.nombre} - {clienteSeleccionado?.nombre}
                      </div>
                      {nodos.find((n: any) => n.id === formData.nodoId)?.nombre && (
                        <div className="text-sm text-gray-600">
                          {nodos.find((n: any) => n.id === formData.nodoId)?.nombre}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedPersonal.length} personal seleccionado
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedPersonal.map(p => p.nombre).join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedDays.length} días seleccionados
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedDays.map(day => 
                          diasSemana.find(d => d.key === day)?.nombre
                        ).join(', ')}
                      </div>
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
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3) ||
                  (step === 3 && !canSubmit)
                }
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
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

export default ModernProgramacionModal;
