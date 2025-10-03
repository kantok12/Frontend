import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';


export const CalendarioPage: React.FC = () => {
  const [vistaCalendario, setVistaCalendario] = useState<'planificacion' | 'semana' | 'dia'>('planificacion');
  
  // Estados para la planificación semanal
  const [fechaInicioSemana, setFechaInicioSemana] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes de esta semana
    return lunes;
  });
  const [asignaciones, setAsignaciones] = useState<any[]>([
    // Asignaciones de ejemplo para probar el sistema
    {
      id: 'asignacion_1',
      personalId: '1',
      servicioId: '1',
      dia: 'LUN',
      horaInicio: '08:00',
      horaFin: '12:00',
      cliente: 'Minera Norte S.A.',
      lugar: 'Antofagasta',
      servicioNombre: 'Mantenimiento Sistema Lubricación',
      personalNombre: 'Juan Pérez'
    },
    {
      id: 'asignacion_2',
      personalId: '1',
      servicioId: '2',
      dia: 'LUN',
      horaInicio: '13:00',
      horaFin: '17:00',
      cliente: 'Minera Sur S.A.',
      lugar: 'Calama',
      servicioNombre: 'Inspección Equipos Mineros',
      personalNombre: 'Juan Pérez'
    },
    {
      id: 'asignacion_3',
      personalId: '2',
      servicioId: '1',
      dia: 'LUN',
      horaInicio: '08:00',
      horaFin: '12:00',
      cliente: 'Minera Norte S.A.',
      lugar: 'Antofagasta',
      servicioNombre: 'Mantenimiento Sistema Lubricación',
      personalNombre: 'María González'
    },
    {
      id: 'asignacion_4',
      personalId: '3',
      servicioId: '3',
      dia: 'MAR',
      horaInicio: '09:00',
      horaFin: '17:00',
      cliente: 'Industrias del Sur',
      lugar: 'Concepción',
      servicioNombre: 'Servicio Integral Industrial',
      personalNombre: 'Carlos López'
    },
    {
      id: 'asignacion_5',
      personalId: '4',
      servicioId: '2',
      dia: 'MIE',
      horaInicio: '07:00',
      horaFin: '13:00',
      cliente: 'Minera Sur S.A.',
      lugar: 'Calama',
      servicioNombre: 'Inspección Equipos Mineros',
      personalNombre: 'Ana Martínez'
    },
    {
      id: 'asignacion_6',
      personalId: '5',
      servicioId: '1',
      dia: 'JUE',
      horaInicio: '10:00',
      horaFin: '14:00',
      cliente: 'Minera Norte S.A.',
      lugar: 'Antofagasta',
      servicioNombre: 'Mantenimiento Sistema Lubricación',
      personalNombre: 'Luis Rodríguez'
    }
  ]);
  const [showPlanificacionModal, setShowPlanificacionModal] = useState(false);
  

  // Funciones para la planificación semanal
  const handlePlanificacionSuccess = (nuevasAsignaciones: any[]) => {
    setAsignaciones(nuevasAsignaciones);
    setShowPlanificacionModal(false);
  };

  const handleExportarPDF = () => {
    // Función de exportación PDF - implementar cuando sea necesario
    alert('Función de exportación PDF no implementada');
  };

  const handleCambiarSemana = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaInicioSemana);
    if (direccion === 'anterior') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    }
    setFechaInicioSemana(nuevaFecha);
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planificación Semanal</h1>
          <p className="text-gray-600 mt-1">Gestiona las asignaciones de personal a servicios por semana</p>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              📊 Modo Demostración - Datos de ejemplo
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowPlanificacionModal(true)}
          className="btn-primary hover-grow"
        >
          <Plus className="h-4 w-4" />
          Planificar Semana
        </button>
      </div>

      {/* Controles del calendario */}
      <div className="card hover-lift slide-up animate-delay-200 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              Planificación Semanal
            </h2>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            {['planificacion', 'semana', 'dia'].map((vista) => (
              <button
                key={vista}
                onClick={() => setVistaCalendario(vista as 'planificacion' | 'semana' | 'dia')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaCalendario === vista
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {vista === 'planificacion' ? 'Planificación Semanal' : 
                 vista === 'semana' ? 'Vista Semana' : 
                 'Vista Día'}
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* Vista de Planificación Semanal */}
      {vistaCalendario === 'planificacion' && (
        <div className="space-y-6">
          {/* Controles de navegación de semana */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleCambiarSemana('anterior')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Semana Anterior
                </button>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {fechaInicioSemana.toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })} - {new Date(fechaInicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-600">Semana de planificación</p>
                </div>
                <button
                  onClick={() => handleCambiarSemana('siguiente')}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Semana Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
            </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Asignaciones</div>
                  <div className="text-2xl font-bold text-blue-600">{asignaciones.length}</div>
          </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Personal Asignado</div>
                  <div className="text-2xl font-bold text-green-600">
                    {new Set(asignaciones.map(a => a.personalId)).size}
          </div>
          </div>
        </div>
            </div>
          </div>

          {/* Controles de planificación */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Planificación Semanal</h2>
                <p className="text-gray-600">Gestiona las asignaciones de personal para toda la semana</p>
          </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExportarPDF}
                  disabled={asignaciones.length === 0}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </button>
                <button
                  onClick={() => setShowPlanificacionModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Planificar Semana
                </button>
        </div>
      </div>

            {/* Resumen de asignaciones */}
            {asignaciones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{asignaciones.length}</div>
                  <div className="text-sm text-blue-800">Total Asignaciones</div>
        </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {new Set(asignaciones.map(a => a.personalId)).size}
                  </div>
                  <div className="text-sm text-green-800">Personal Asignado</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(asignaciones.map(a => a.servicioId)).size}
                  </div>
                  <div className="text-sm text-purple-800">Servicios Únicos</div>
                    </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(asignaciones.map(a => a.cliente)).size}
                  </div>
                  <div className="text-sm text-orange-800">Clientes Atendidos</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay planificación</h3>
                <p className="text-gray-600 mb-6">Comienza planificando la semana completa</p>
                <button
                  onClick={() => setShowPlanificacionModal(true)}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors mx-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Planificar Semana Completa
                </button>
              </div>
            )}
            </div>
        </div>
      )}

      {/* Modal de Planificación Semanal - Componente no disponible */}
      {showPlanificacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Planificación Semanal</h3>
            <p className="text-gray-600 mb-4">Esta funcionalidad no está disponible actualmente.</p>
            <button
              onClick={() => setShowPlanificacionModal(false)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
