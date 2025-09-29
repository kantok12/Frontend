import React, { useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Download, User, Clock, MapPin } from 'lucide-react';
import { PlanificacionModal } from './PlanificacionModal';

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

interface PlannerSemanalProps {
  fechaInicio: Date;
  asignaciones: Asignacion[];
  onAsignar: (asignacion: Asignacion) => void;
  onEditar: (asignacion: Asignacion) => void;
  onEliminar: (asignacionId: string) => void;
  onExportarPDF: (fechaInicio: Date, asignaciones: Asignacion[]) => void;
}

export const PlannerSemanal: React.FC<PlannerSemanalProps> = ({
  fechaInicio,
  asignaciones,
  onAsignar,
  onEditar,
  onEliminar,
  onExportarPDF
}) => {
  const [showModal, setShowModal] = useState(false);
  const [asignacionEditando, setAsignacionEditando] = useState<Asignacion | null>(null);

  // Días de la semana
  const diasSemana = [
    { value: 'LUN', label: 'Lunes', short: 'LUN' },
    { value: 'MAR', label: 'Martes', short: 'MAR' },
    { value: 'MIE', label: 'Miércoles', short: 'MIE' },
    { value: 'JUE', label: 'Jueves', short: 'JUE' },
    { value: 'VIE', label: 'Viernes', short: 'VIE' },
    { value: 'SAB', label: 'Sábado', short: 'SAB' },
    { value: 'DOM', label: 'Domingo', short: 'DOM' }
  ];

  // Obtener fechas de la semana
  const getFechasSemana = (fechaInicio: Date) => {
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fechaInicio.getDate() + i);
      fechas.push(fecha);
    }
    return fechas;
  };

  const fechasSemana = getFechasSemana(fechaInicio);

  // Obtener asignaciones por día
  const getAsignacionesPorDia = (dia: string) => {
    return asignaciones.filter(asignacion => asignacion.dia === dia);
  };

  // Obtener personal único
  const getPersonalUnico = () => {
    const personalSet = new Set(asignaciones.map(a => a.personalId));
    return Array.from(personalSet).map(personalId => {
      const asignacion = asignaciones.find(a => a.personalId === personalId);
      return {
        id: personalId,
        nombre: asignacion?.personalNombre || 'Personal no encontrado'
      };
    });
  };

  const personalUnico = getPersonalUnico();

  const handleNuevaAsignacion = () => {
    setAsignacionEditando(null);
    setShowModal(true);
  };

  const handleEditarAsignacion = (asignacion: Asignacion) => {
    setAsignacionEditando(asignacion);
    setShowModal(true);
  };

  const handleModalSuccess = (asignacion: Asignacion) => {
    if (asignacionEditando) {
      onEditar(asignacion);
    } else {
      onAsignar(asignacion);
    }
    setShowModal(false);
    setAsignacionEditando(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setAsignacionEditando(null);
  };

  const handleExportarPDF = () => {
    onExportarPDF(fechaInicio, asignaciones);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header del Planner */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Planificación Semanal
              </h2>
              <p className="text-sm text-gray-600">
                {fechaInicio.toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })} - {fechasSemana[6].toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportarPDF}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </button>
            <button
              onClick={handleNuevaAsignacion}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Asignación
            </button>
          </div>
        </div>
      </div>

      {/* Tabla del Planner */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Personal
              </th>
              {diasSemana.map((dia, index) => (
                <th key={dia.value} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{dia.short}</span>
                    <span className="text-xs text-gray-400">
                      {fechasSemana[index].getDate()}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {personalUnico.map((personal) => (
              <tr key={personal.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {personal.nombre}
                      </div>
                    </div>
                  </div>
                </td>
                {diasSemana.map((dia) => {
                  const asignacionesDia = getAsignacionesPorDia(dia.value)
                    .filter(a => a.personalId === personal.id);
                  
                  return (
                    <td key={dia.value} className="px-2 py-4 align-top">
                      <div className="space-y-2">
                        {asignacionesDia.map((asignacion) => (
                          <div
                            key={asignacion.id}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-3 relative group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="text-xs font-medium text-blue-900 mb-1">
                                  {asignacion.servicioNombre}
                                </div>
                                <div className="flex items-center text-xs text-blue-700 mb-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {asignacion.horaInicio} - {asignacion.horaFin}
                                </div>
                                <div className="flex items-center text-xs text-blue-600">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {asignacion.lugar}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {asignacion.cliente}
                                </div>
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditarAsignacion(asignacion)}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                  title="Editar asignación"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => onEliminar(asignacion.id)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                  title="Eliminar asignación"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {asignacionesDia.length === 0 && (
                          <div className="text-center text-gray-400 text-xs py-4">
                            Sin asignaciones
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {personalUnico.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">No hay asignaciones</p>
                    <p className="text-sm mb-4">Comienza creando una nueva asignación</p>
                    <button
                      onClick={handleNuevaAsignacion}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Asignación
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Asignación */}
      <PlanificacionModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        fechaInicio={fechaInicio}
        asignacionesExistentes={asignaciones}
        asignacionEditando={asignacionEditando}
      />
    </div>
  );
};
