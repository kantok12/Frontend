import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Home } from 'lucide-react';
import { useProgramacionSemanal } from '../../hooks/useProgramacionSemanal';

interface SelectorSemanasProps {
  onSemanaCambiada?: (semanaInfo: any) => void;
}

export const SelectorSemanas: React.FC<SelectorSemanasProps> = ({ onSemanaCambiada }) => {
  const {
    semanaInfo,
    semanaSeleccionada,
    irASemanaAnterior,
    irASemanaActual,
    irASemanaSiguiente,
    getEtiquetaSemana,
    getRangoFechasFormateado
  } = useProgramacionSemanal();

  // Notificar cambio de semana
  React.useEffect(() => {
    if (onSemanaCambiada) {
      onSemanaCambiada(semanaInfo);
    }
  }, [semanaInfo, onSemanaCambiada]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Header con título y navegación */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Programación Semanal</h2>
            <p className="text-sm text-gray-600">Gestiona las asignaciones de personal por semana</p>
          </div>
        </div>

        {/* Navegación de semanas */}
        <div className="flex items-center space-x-2">
          <button
            onClick={irASemanaAnterior}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <button
            onClick={irASemanaActual}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
              semanaInfo.esSemanaActual
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Ir a semana actual"
          >
            <Home className="h-4 w-4 mr-2" />
            Actual
          </button>

          <button
            onClick={irASemanaSiguiente}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Próxima semana"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Información de la semana seleccionada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Semana y fechas */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Semana</p>
              <p className="text-lg font-semibold text-gray-900">
                {getEtiquetaSemana()}
              </p>
              <p className="text-sm text-gray-600">
                {getRangoFechasFormateado()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Semana #{semanaInfo.numeroSemana}</p>
              <p className="text-sm text-gray-500">{semanaInfo.año}</p>
            </div>
          </div>
        </div>

        {/* Estado de la semana */}
        <div className={`rounded-lg p-3 ${
          semanaInfo.esSemanaActual 
            ? 'bg-blue-50 border border-blue-200' 
            : semanaInfo.esSemanaPasada
            ? 'bg-gray-50 border border-gray-200'
            : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              semanaInfo.esSemanaActual 
                ? 'bg-blue-500' 
                : semanaInfo.esSemanaPasada
                ? 'bg-gray-400'
                : 'bg-green-500'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-700">Estado</p>
              <p className={`text-sm font-semibold ${
                semanaInfo.esSemanaActual 
                  ? 'text-blue-800' 
                  : semanaInfo.esSemanaPasada
                  ? 'text-gray-600'
                  : 'text-green-800'
              }`}>
                {semanaInfo.esSemanaActual 
                  ? 'En Progreso' 
                  : semanaInfo.esSemanaPasada
                  ? 'Completada'
                  : 'Planificada'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Acciones Rápidas</p>
          <div className="flex space-x-2">
            <button
              onClick={irASemanaActual}
              className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => irASemanaSiguiente()}
              className="flex-1 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de navegación */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex space-x-1">
          {[-2, -1, 0, 1, 2].map((offset) => (
            <button
              key={offset}
              onClick={() => {
                if (offset === -2) irASemanaAnterior();
                else if (offset === -1) irASemanaAnterior();
                else if (offset === 0) irASemanaActual();
                else if (offset === 1) irASemanaSiguiente();
                else if (offset === 2) irASemanaSiguiente();
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                semanaSeleccionada === offset
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={
                offset === 0 ? 'Semana actual' :
                offset === -1 ? 'Semana anterior' :
                offset === 1 ? 'Próxima semana' :
                offset < 0 ? `${Math.abs(offset)} semanas atrás` :
                `${offset} semanas adelante`
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
