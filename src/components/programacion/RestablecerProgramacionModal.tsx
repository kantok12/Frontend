import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useEliminarProgramacionOptimizada } from '../../hooks/useProgramacionOptimizada';

interface RestablecerProgramacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  programacionData: any[];
  fechaInicio: string;
  fechaFin: string;
}

export const RestablecerProgramacionModal: React.FC<RestablecerProgramacionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  programacionData,
  fechaInicio,
  fechaFin
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmacion, setConfirmacion] = useState('');

  const eliminarProgramacion = useEliminarProgramacionOptimizada();

  // Resetear estado cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      setConfirmacion('');
      setErrors([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Obtener IDs únicos de programación para eliminar
  const obtenerIdsProgramacion = () => {
    const ids = new Set<number>();
    programacionData.forEach((dia: any) => {
      if (dia.trabajadores && dia.trabajadores.length > 0) {
        dia.trabajadores.forEach((trabajador: any) => {
          if (trabajador.id) {
            ids.add(trabajador.id);
          }
        });
      }
    });
    return Array.from(ids);
  };

  const idsAEliminar = obtenerIdsProgramacion();
  const totalRegistros = idsAEliminar.length;

  const handleRestablecer = async () => {
    if (confirmacion !== 'RESTABLECER') {
      setErrors(['Debe escribir "RESTABLECER" para confirmar']);
      return;
    }

    setErrors([]);
    setIsLoading(true);

    try {
      // Eliminar cada registro de programación
      const promesas = idsAEliminar.map(id => eliminarProgramacion.mutateAsync(id));
      await Promise.all(promesas);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      setErrors([error.message || 'Error al restablecer la programación']);
    } finally {
      setIsLoading(false);
    }
  };

  const canRestablecer = confirmacion === 'RESTABLECER' && totalRegistros > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Restablecer Programación</h2>
                <p className="text-red-100 text-sm">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Advertencia */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Advertencia</h3>
                <p className="text-sm text-red-700 mt-1">
                  Esta acción eliminará permanentemente toda la programación de la semana seleccionada.
                </p>
              </div>
            </div>
          </div>

          {/* Información de la programación */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Programación a eliminar:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div><strong>Período:</strong> {fechaInicio} al {fechaFin}</div>
              <div><strong>Registros:</strong> {totalRegistros} programaciones</div>
              <div><strong>Días con programación:</strong> {programacionData.length} días</div>
            </div>
          </div>

          {/* Errores */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-sm font-medium text-red-800">Errores:</h3>
              </div>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmación */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, escriba <strong>RESTABLECER</strong>:
            </label>
            <input
              type="text"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="RESTABLECER"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Lista de trabajadores afectados */}
          {totalRegistros > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Trabajadores afectados:</h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {programacionData.map((dia: any, index: number) => (
                  <div key={index}>
                    {dia.trabajadores && dia.trabajadores.map((trabajador: any, tIndex: number) => (
                      <div key={tIndex} className="flex items-center text-sm text-gray-600">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs font-semibold">
                            {trabajador.nombre_persona?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <span>{trabajador.nombre_persona || 'Sin nombre'}</span>
                        <span className="ml-2 text-gray-400">({dia.dia_semana})</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-2xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleRestablecer}
            disabled={!canRestablecer || isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Restableciendo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Restablecer Programación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

