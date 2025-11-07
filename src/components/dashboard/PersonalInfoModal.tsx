import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface EstadoDistribucion {
  id: number;
  nombre: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface PersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPersonal: number;
  distribucionEstados: EstadoDistribucion[];
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  isOpen,
  onClose,
  totalPersonal,
  distribucionEstados
}) => {
  const [paginaActual, setPaginaActual] = useState<number>(1);

  if (!isOpen) return null;

  // Función para asignar colores a los estados
  const getColorForEstado = (nombre: string, index: number): string => {
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes('activo') || nombreLower.includes('disponible')) return 'green';
    if (nombreLower.includes('asignado')) return 'blue';
    if (nombreLower.includes('examen') || nombreLower.includes('exámenes')) return 'yellow';
    if (nombreLower.includes('capacitación') || nombreLower.includes('capacitacion')) return 'purple';
    if (nombreLower.includes('vacaciones')) return 'cyan';
    if (nombreLower.includes('licencia')) return 'orange';
    if (nombreLower.includes('inactivo')) return 'red';
    if (nombreLower.includes('proceso')) return 'indigo';
    if (nombreLower.includes('suspendido')) return 'pink';
    if (nombreLower.includes('desvinculado')) return 'gray';
    
    // Colores alternativos para otros estados
    const colores = ['indigo', 'pink', 'teal', 'cyan', 'amber'];
    return colores[index % colores.length];
  };

  // Definir estados prioritarios para la primera página
  const estadosPrioritarios = ['asignado', 'capacitacion', 'examenes', 'inactivo'];
  
  // Separar estados en dos grupos
  const estadosPagina1 = distribucionEstados.filter(estado => 
    estadosPrioritarios.some(prioridad => estado.nombre.toLowerCase().includes(prioridad))
  ).slice(0, 4);
  
  const estadosPagina2 = distribucionEstados.filter(estado => 
    !estadosPrioritarios.some(prioridad => estado.nombre.toLowerCase().includes(prioridad))
  );

  const estadosAMostrar = paginaActual === 1 ? estadosPagina1 : estadosPagina2;
  const totalPaginas = estadosPagina2.length > 0 ? 2 : 1;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Información del Personal</h2>
                <p className="text-blue-100">Resumen estadístico del personal registrado</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Total Personal destacado */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Personal Registrado</p>
                <p className="text-5xl font-bold">{totalPersonal}</p>
                <p className="text-blue-100 text-sm mt-2">personas en el sistema</p>
              </div>
              <div className="p-4 rounded-full bg-white bg-opacity-20">
                <Users className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Distribución por Estado - Grid expandido */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-gray-900">
                {paginaActual === 1 ? 'Estados Principales' : 'Otros Estados'}
              </h4>
              
              {/* Navegación de páginas */}
              {totalPaginas > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPaginaActual(1)}
                    disabled={paginaActual === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      paginaActual === 1
                        ? 'bg-blue-600 text-white cursor-default'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaActual(2)}
                    disabled={paginaActual === 2}
                    className={`p-2 rounded-lg transition-colors ${
                      paginaActual === 2
                        ? 'bg-blue-600 text-white cursor-default'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {estadosAMostrar.map((estado, index) => {
                const color = estado.color || getColorForEstado(estado.nombre, index);
                const bgColor = `bg-${color}-50`;
                const borderColor = `border-${color}-300`;
                const circleColor = `bg-${color}-500`;
                const textColor = `text-${color}-900`;
                const numberColor = `text-${color}-600`;
                
                return (
                  <div key={estado.id} className={`${bgColor} p-5 rounded-lg border-2 ${borderColor} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 ${circleColor} rounded-full`}></div>
                        <span className={`text-lg font-semibold ${textColor}`}>
                          {estado.nombre.charAt(0).toUpperCase() + estado.nombre.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-4xl font-bold ${numberColor}`}>{estado.cantidad}</p>
                        <p className="text-sm text-gray-600 mt-1">personas</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${numberColor}`}>{estado.porcentaje}%</p>
                        <p className="text-xs text-gray-500">del total</p>
                      </div>
                    </div>
                    
                    {/* Barra de progreso */}
                    <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full ${circleColor} transition-all duration-300`}
                        style={{ width: `${estado.porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total de estados:</span> {distribucionEstados.length} estados diferentes
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
