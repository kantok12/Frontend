import React, { useState } from 'react';
import { Plus, User, Building2, Clock, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { SemanaInfo, DiaSemana } from '../../hooks/useProgramacionSemanal';
import { AsignacionSemanal, EstadisticasDia } from '../../types/programacion';

interface CalendarioSemanalProps {
  semanaInfo: SemanaInfo;
  asignaciones: AsignacionSemanal[];
  onAgregarAsignacion: (dia: string, fecha: Date) => void;
  onEditarAsignacion: (asignacion: AsignacionSemanal) => void;
  onEliminarAsignacion: (asignacionId: string) => void;
  personalDisponible: any[];
  carteras: any[];
  clientes: any[];
  nodos: any[];
}

export const CalendarioSemanal: React.FC<CalendarioSemanalProps> = ({
  semanaInfo,
  asignaciones,
  onAgregarAsignacion,
  onEditarAsignacion,
  onEliminarAsignacion,
  personalDisponible,
  carteras,
  clientes,
  nodos
}) => {
  const [asignacionHover, setAsignacionHover] = useState<string | null>(null);

  // Obtener asignaciones por día
  const getAsignacionesPorDia = (dia: DiaSemana) => {
    const fechaStr = dia.fecha.toISOString().split('T')[0];
    return asignaciones.filter(asignacion => {
      // Aquí podrías tener una lógica más compleja para mapear asignaciones a días
      // Por ahora, asumimos que las asignaciones tienen un campo 'dia' que coincide con el nombre del día
      return asignacion.dia === dia.nombre.toLowerCase();
    });
  };

  // Obtener color según el estado de la asignación
  const getColorAsignacion = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'completada':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  // Obtener color del día según su estado
  const getColorDia = (dia: DiaSemana) => {
    if (dia.esHoy) return 'bg-blue-50 border-blue-200';
    if (dia.esPasado) return 'bg-gray-50 border-gray-200';
    if (dia.esFinDeSemana) return 'bg-purple-50 border-purple-200';
    return 'bg-white border-gray-200';
  };

  // Formatear hora
  const formatearHora = (hora: string) => {
    return hora.substring(0, 5); // HH:MM
  };

  // Obtener estadísticas del día
  const getEstadisticasDia = (dia: DiaSemana): EstadisticasDia => {
    const asignacionesDia = getAsignacionesPorDia(dia);
    const personalUnico = new Set(asignacionesDia.map(a => a.personalId)).size;
    const carterasUnicas = new Set(asignacionesDia.map(a => a.carteraId)).size;
    
    return {
      totalAsignaciones: asignacionesDia.length,
      personalUnico,
      carterasUnicas
    };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header del calendario */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Calendario Semanal - {semanaInfo.dias[0].fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Confirmadas</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Pendientes</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Completadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 divide-x divide-gray-200">
        {semanaInfo.dias.map((dia, index) => {
          const asignacionesDia = getAsignacionesPorDia(dia);
          const estadisticas = getEstadisticasDia(dia);
          
          return (
            <div
              key={index}
              className={`min-h-[400px] ${getColorDia(dia)} transition-colors`}
            >
              {/* Header del día */}
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`text-sm font-medium ${
                      dia.esHoy ? 'text-blue-800' : 
                      dia.esPasado ? 'text-gray-500' : 
                      dia.esFinDeSemana ? 'text-purple-700' : 
                      'text-gray-900'
                    }`}>
                      {dia.nombre}
                    </p>
                    <p className={`text-lg font-bold ${
                      dia.esHoy ? 'text-blue-900' : 
                      dia.esPasado ? 'text-gray-400' : 
                      dia.esFinDeSemana ? 'text-purple-800' : 
                      'text-gray-900'
                    }`}>
                      {dia.numero}
                    </p>
                  </div>
                  
                  {dia.esHoy && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>

                {/* Estadísticas del día */}
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Asignaciones:</span>
                    <span className="font-medium">{estadisticas.totalAsignaciones}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Personal:</span>
                    <span className="font-medium">{estadisticas.personalUnico}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carteras:</span>
                    <span className="font-medium">{estadisticas.carterasUnicas}</span>
                  </div>
                </div>
              </div>

              {/* Contenido del día */}
              <div className="p-2 space-y-2 min-h-[300px]">
                {/* Asignaciones */}
                {asignacionesDia.map((asignacion) => (
                  <div
                    key={asignacion.id}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-md ${getColorAsignacion(asignacion.estado)}`}
                    onMouseEnter={() => setAsignacionHover(asignacion.id)}
                    onMouseLeave={() => setAsignacionHover(null)}
                    onClick={() => onEditarAsignacion(asignacion)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <User className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="font-medium truncate">
                            {asignacion.personalNombre}
                          </span>
                        </div>
                        
                        <div className="flex items-center mb-1">
                          <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {asignacion.carteraNombre}
                            {asignacion.clienteNombre && ` - ${asignacion.clienteNombre}`}
                            {asignacion.nodoNombre && ` - ${asignacion.nodoNombre}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span>
                            {formatearHora(asignacion.horaInicio)} - {formatearHora(asignacion.horaFin)}
                          </span>
                        </div>
                      </div>
                      
                      {asignacionHover === asignacion.id && (
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditarAsignacion(asignacion);
                            }}
                            className="p-1 rounded hover:bg-white hover:bg-opacity-50"
                            title="Editar"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEliminarAsignacion(asignacion.id);
                            }}
                            className="p-1 rounded hover:bg-white hover:bg-opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Botón agregar asignación */}
                <button
                  onClick={() => onAgregarAsignacion(dia.nombre.toLowerCase(), dia.fecha)}
                  className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                  disabled={dia.esPasado}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs">Agregar</span>
                </button>

                {/* Mensaje para días pasados */}
                {dia.esPasado && (
                  <div className="text-center text-xs text-gray-400 mt-4">
                    <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                    <p>Día pasado</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer con resumen */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Total Asignaciones</p>
            <p className="text-lg font-semibold text-gray-900">{asignaciones.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Personal Único</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Set(asignaciones.map(a => a.personalId)).size}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Carteras Activas</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Set(asignaciones.map(a => a.carteraId)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
