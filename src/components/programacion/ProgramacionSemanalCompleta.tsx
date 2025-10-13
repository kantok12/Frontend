import React, { useState, useEffect } from 'react';
import { SelectorSemanas } from './SelectorSemanas';
import { CalendarioSemanal } from './CalendarioSemanal';
import { AsignacionSemanalModal } from './AsignacionSemanalModal';
import { useProgramacionSemanal } from '../../hooks/useProgramacionSemanal';
import { useCarteras } from '../../hooks/useServicios';
import { useClientes, useNodos } from '../../hooks/useServicios';
import { AsignacionSemanal } from '../../types/programacion';
import { exportarPlanificacionPDF } from '../../utils/pdfExporter';

export const ProgramacionSemanalCompleta: React.FC = () => {
  const [asignaciones, setAsignaciones] = useState<AsignacionSemanal[]>([]);
  const [showModalAsignacion, setShowModalAsignacion] = useState(false);
  const [asignacionEditando, setAsignacionEditando] = useState<AsignacionSemanal | undefined>(undefined);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(new Date());

  // Hooks para datos
  const { semanaInfo } = useProgramacionSemanal();
  const { data: carterasData } = useCarteras({ limit: 1000 });
  const { data: clientesData } = useClientes({ limit: 1000 });
  const { data: nodosData } = useNodos({ limit: 1000 });

  const carteras = carterasData?.data || [];
  const clientes = clientesData?.data || [];
  const nodos = nodosData?.data || [];

  // Cargar asignaciones de la semana actual (simulado)
  useEffect(() => {
    // Aquí cargarías las asignaciones reales de la API
    const asignacionesSimuladas: AsignacionSemanal[] = [
      {
        id: '1',
        personalId: '1',
        personalNombre: 'Juan Pérez',
        personalRut: '12345678-9',
        carteraId: 1,
        carteraNombre: 'Cartera A',
        clienteId: 1,
        clienteNombre: 'Cliente X',
        dia: 'lunes',
        fecha: '2024-01-15',
        horaInicio: '08:00',
        horaFin: '17:00',
        observaciones: 'Asignación de prueba',
        estado: 'confirmada'
      },
      {
        id: '2',
        personalId: '2',
        personalNombre: 'María González',
        personalRut: '98765432-1',
        carteraId: 2,
        carteraNombre: 'Cartera B',
        dia: 'martes',
        fecha: '2024-01-16',
        horaInicio: '09:00',
        horaFin: '18:00',
        estado: 'pendiente'
      }
    ];

    setAsignaciones(asignacionesSimuladas);
  }, [semanaInfo]);

  // Manejar cambio de semana
  const handleSemanaCambiada = (nuevaSemanaInfo: any) => {
    console.log('Semana cambiada:', nuevaSemanaInfo);
    // Aquí cargarías las asignaciones de la nueva semana
  };

  // Manejar agregar asignación
  const handleAgregarAsignacion = (dia: string, fecha: Date) => {
    setDiaSeleccionado(dia);
    setFechaSeleccionada(fecha);
    setAsignacionEditando(undefined);
    setShowModalAsignacion(true);
  };

  // Manejar editar asignación
  const handleEditarAsignacion = (asignacion: AsignacionSemanal) => {
    setAsignacionEditando(asignacion);
    setShowModalAsignacion(true);
  };

  // Manejar eliminar asignación
  const handleEliminarAsignacion = (asignacionId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta asignación?')) {
      setAsignaciones(prev => prev.filter(a => a.id !== asignacionId));
    }
  };

  // Manejar guardar asignación
  const handleGuardarAsignacion = (nuevaAsignacion: AsignacionSemanal) => {
    if (asignacionEditando) {
      // Actualizar asignación existente
      setAsignaciones(prev => 
        prev.map(a => a.id === asignacionEditando.id ? nuevaAsignacion : a)
      );
    } else {
      // Agregar nueva asignación
      setAsignaciones(prev => [...prev, nuevaAsignacion]);
    }
    setShowModalAsignacion(false);
    setAsignacionEditando(undefined);
  };

  // Cerrar modal
  const handleCerrarModal = () => {
    setShowModalAsignacion(false);
    setAsignacionEditando(undefined);
  };

  // Función para exportar PDF
  const handleExportarPDF = async () => {
    try {
      // Convertir las asignaciones al formato esperado por el exportador
      const asignacionesParaExportar = asignaciones.map((asignacion) => ({
        id: asignacion.id,
        personalId: asignacion.personalId,
        personalNombre: asignacion.personalNombre,
        servicioId: asignacion.nodoId || asignacion.clienteId || asignacion.carteraId,
        servicioNombre: asignacion.nodoNombre || asignacion.clienteNombre || asignacion.carteraNombre,
        cliente: asignacion.clienteNombre || 'Sin cliente',
        lugar: asignacion.nodoNombre || 'Sin ubicación específica',
        horaInicio: asignacion.horaInicio,
        horaFin: asignacion.horaFin,
        dia: asignacion.dia
      }));

      // Exportar PDF
      await exportarPlanificacionPDF(fechaSeleccionada, asignacionesParaExportar);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar la programación. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Programación Semanal</h1>
        <p className="text-gray-600 mt-1">
          Gestiona las asignaciones de personal por semana con documentación completa
        </p>
      </div>

      {/* Selector de semanas */}
      <SelectorSemanas onSemanaCambiada={handleSemanaCambiada} />

      {/* Calendario semanal */}
      <CalendarioSemanal
        semanaInfo={semanaInfo}
        asignaciones={asignaciones}
        onAgregarAsignacion={handleAgregarAsignacion}
        onEditarAsignacion={handleEditarAsignacion}
        onEliminarAsignacion={handleEliminarAsignacion}
        personalDisponible={[]} // Se maneja internamente en el modal
        carteras={carteras}
        clientes={clientes}
        nodos={nodos}
      />

      {/* Modal de asignación */}
      <AsignacionSemanalModal
        isOpen={showModalAsignacion}
        onClose={handleCerrarModal}
        onSave={handleGuardarAsignacion}
        dia={diaSeleccionado}
        fecha={fechaSeleccionada}
        carteras={carteras}
        clientes={clientes}
        nodos={nodos}
        asignacionExistente={asignacionEditando}
      />

      {/* Información adicional */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Resumen de la Semana</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Asignaciones:</span>
              <span className="font-medium">{asignaciones.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Personal Único:</span>
              <span className="font-medium">
                {new Set(asignaciones.map(a => a.personalId)).size}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Carteras Activas:</span>
              <span className="font-medium">
                {new Set(asignaciones.map(a => a.carteraId)).size}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Estado de Asignaciones</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Confirmadas:</span>
              <span className="font-medium text-green-600">
                {asignaciones.filter(a => a.estado === 'confirmada').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pendientes:</span>
              <span className="font-medium text-yellow-600">
                {asignaciones.filter(a => a.estado === 'pendiente').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completadas:</span>
              <span className="font-medium text-blue-600">
                {asignaciones.filter(a => a.estado === 'completada').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acciones Rápidas</h3>
          <div className="space-y-2">
            <button 
              onClick={handleExportarPDF}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Exportar Programación
            </button>
            <button className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              Copiar Semana
            </button>
            <button className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
              Enviar Notificaciones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
