import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  Clock, 
  FileText, 
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { NotificacionDocumento } from '../../types';

interface NotificacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificacionesModal: React.FC<NotificacionesModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  // Call hook once and cast to `any` to avoid type mismatches from incremental types
  const _notificacionesHook = useNotificaciones() as any;
  const {
    notificaciones,
    notificacionesNoLeidas,
    notificacionesPorPrioridad,
    isLoading,
    marcarComoLeida,
    marcarTodasComoLeidas,
    marcarComoLeidaOptimistic,
    marcarTodasComoLeidasOptimistic,
    getColorPrioridad,
    getIconoTipo,
    formatearFecha,
    limpiarNotificacionesLeidas,
    navegarADocumentos,
    isMarkingAsRead,
    isMarkingAllAsRead,
    notificacionesTodas,
    notificacionesLeidas,
  } = _notificacionesHook;
  const localLeidas: Set<string> | undefined = _notificacionesHook.localLeidas;
  const isLeida = (n: NotificacionDocumento) => {
    try {
      return !!n.leida || (!!localLeidas && (localLeidas as Set<string>).has(n.id));
    } catch (e) {
      return !!n.leida;
    }
  };
  
  // also available: all notifications and read notifications
  // (useful to show history)

  const [filtroPrioridad, setFiltroPrioridad] = useState<'todas' | 'alta' | 'media' | 'baja'>('todas');
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'leidas' | 'no_leidas'>('no_leidas');
  const [filtroCategoria, setFiltroCategoria] = useState<'todas' | 'documentos' | 'personal' | 'servicios' | 'auditoria'>('todas');

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Función para determinar la categoría de una notificación
  const getCategoriaNotificacion = (tipo: string): 'documentos' | 'personal' | 'servicios' | 'auditoria' => {
    if (tipo.startsWith('documento_')) return 'documentos';
    if (tipo.startsWith('personal_') || tipo === 'programacion_pendiente') return 'personal';
    if (tipo.startsWith('servicios_') || tipo === 'mantenimiento_proximo') return 'servicios';
    if (tipo.startsWith('auditoria_')) return 'auditoria';
    return 'documentos'; // default
  };

  // Filtrar notificaciones según los filtros seleccionados
  const notificacionesFiltradas = (() => {
    // Base según filtro de tipo (historial)
    let base: NotificacionDocumento[] = [];
    if (filtroTipo === 'leidas') {
      base = notificacionesLeidas || [];
    } else if (filtroTipo === 'no_leidas') {
      base = notificaciones;
    } else {
      // todas
      base = notificacionesTodas || notificaciones;
    }

    // Apply remaining filters
    return base.filter(notif => {
      const cumplePrioridad = filtroPrioridad === 'todas' || notif.prioridad === filtroPrioridad;
      const cumpleCategoria = filtroCategoria === 'todas' || getCategoriaNotificacion(notif.tipo) === filtroCategoria;
      return cumplePrioridad && cumpleCategoria;
    });
  })();

  const handleMarcarComoLeida = async (notificacionId: string) => {
    try {
      // Prefer optimistic helper which falls back to local state for synthetic notifications
      if (typeof marcarComoLeidaOptimistic === 'function') {
        await marcarComoLeidaOptimistic(notificacionId);
      } else {
        await marcarComoLeida.mutateAsync(notificacionId);
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const handleMarcarTodasComoLeidas = async () => {
    try {
      if (typeof marcarTodasComoLeidasOptimistic === 'function') {
        await marcarTodasComoLeidasOptimistic();
      } else {
        await marcarTodasComoLeidas.mutateAsync();
      }
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  };

  const handleAccion = async (notificacion: NotificacionDocumento) => {
    console.log('🔗 Ejecutando acción para notificación:', notificacion);
    try {
      if (notificacion.id) {
        if (typeof marcarComoLeidaOptimistic === 'function') {
          await marcarComoLeidaOptimistic(notificacion.id);
        } else {
          await marcarComoLeida.mutateAsync(notificacion.id);
        }
      }
    } catch (err) {
      console.warn('No se pudo marcar notificación como leída antes de la acción:', err);
    }

    // Cerrar el modal de notificaciones primero
    onClose();

    // Navegar según el tipo de notificación (useNavegacionDocumentos despacha evento global)
    const categoria = getCategoriaNotificacion(notificacion.tipo);
    switch (categoria) {
      case 'documentos':
      case 'personal':
        if (notificacion.personal_id && notificacion.personal_id !== 'undefined') {
          navegarADocumentos(notificacion.personal_id, notificacion.personal_id);
        } else {
          console.warn('⚠️ No se pudo navegar: personal_id no disponible');
          window.location.href = '/personal';
        }
        break;
      case 'servicios':
        window.location.href = '/servicios';
        break;
      case 'auditoria':
        console.log('📊 Notificación de auditoría:', notificacion.mensaje);
        break;
      default:
        window.location.href = '/';
    }
  };

  const getIconoPrioridad = (prioridad: 'alta' | 'media' | 'baja') => {
    switch (prioridad) {
      case 'alta':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'media':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'baja':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

         const modalContent = (
           <div
             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
             onClick={handleBackdropClick}
             style={{ zIndex: 9999 }}
           >
             <div
               className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out animate-slideInUp"
               onClick={(e) => e.stopPropagation()}
               style={{ zIndex: 10000 }}
             >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Notificaciones</h2>
                <p className="text-blue-100 text-sm">
                  {notificacionesNoLeidas} notificaciones no leídas
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {notificacionesNoLeidas > 0 && (
                <button
                  onClick={handleMarcarTodasComoLeidas}
                  disabled={isMarkingAllAsRead}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isMarkingAllAsRead ? 'Marcando...' : 'Marcar como leídas'}
                </button>
              )}
              {/* Botón de debug para restaurar notificaciones eliminadas */}
              <button
                onClick={limpiarNotificacionesLeidas}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors"
                title="Restaurar notificaciones eliminadas (Debug)"
              >
                Restaurar
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                title="Cerrar notificaciones (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex flex-wrap gap-4">
            {/* Filtro por categoría */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Categoría:</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="documentos">📄 Documentos</option>
                <option value="personal">👤 Personal</option>
                <option value="servicios">🏢 Servicios</option>
                <option value="auditoria">🔍 Auditoría</option>
              </select>
            </div>

            {/* Filtro por prioridad */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Prioridad:</label>
              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Estado:</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="no_leidas">No leídas</option>
                <option value="leidas">Leídas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando notificaciones...</span>
            </div>
          ) : notificacionesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay notificaciones</p>
              <p className="text-sm">No se encontraron notificaciones con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notificacionesFiltradas.map((notificacion) => (
                <div
                  key={notificacion.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                      !isLeida(notificacion) ? 'bg-blue-50/50' : ''
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icono del tipo de notificación */}
                    <div className="flex-shrink-0 mt-1 text-2xl">
                      {getIconoTipo(notificacion.tipo)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {notificacion.titulo}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getColorPrioridad(notificacion.prioridad)}`}>
                              {notificacion.prioridad.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {getCategoriaNotificacion(notificacion.tipo).toUpperCase()}
                            </span>
                            {!notificacion.leida && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notificacion.mensaje}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{formatearFecha(notificacion.fecha_creacion)}</span>
                            {notificacion.personal_nombre && (
                              <span>• {notificacion.personal_nombre}</span>
                            )}
                            {notificacion.dias_restantes !== undefined && notificacion.dias_restantes !== null && (
                              <span>• {notificacion.dias_restantes} días restantes</span>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center space-x-2 ml-4">
                          {notificacion.accion_requerida && (
                            <button
                              onClick={() => handleAccion(notificacion)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{notificacion.accion_requerida}</span>
                            </button>
                          )}
                            {!isLeida(notificacion) && (
                            <button
                              onClick={() => handleMarcarComoLeida(notificacion.id)}
                              disabled={isMarkingAsRead}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                              title="Marcar como leída"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            )}
                          {isLeida(notificacion) && (
                            <div className="p-1 text-green-500" title="Leída">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con estadísticas */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center flex-wrap gap-4">
              <span className="font-semibold">Total: {notificacionesTodas.length}</span>
              <span>No leídas: {notificacionesNoLeidas}</span>
              <span>Alta prioridad: {notificacionesPorPrioridad.alta.length}</span>
              <span className="text-xs">📄 Documentos: {notificacionesTodas.filter((n:any) => getCategoriaNotificacion(n.tipo) === 'documentos').length}</span>
              <span className="text-xs">👤 Personal: {notificacionesTodas.filter((n:any) => getCategoriaNotificacion(n.tipo) === 'personal').length}</span>
              <span className="text-xs">🏢 Servicios: {notificacionesTodas.filter((n:any) => getCategoriaNotificacion(n.tipo) === 'servicios').length}</span>
              <span className="text-xs">🔍 Auditoría: {notificacionesTodas.filter((n:any) => getCategoriaNotificacion(n.tipo) === 'auditoria').length}</span>
            </div>
            <div className="text-xs text-gray-500">
              Última actualización: {new Date().toLocaleTimeString('es-ES')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar el modal usando un portal al body del documento
  return createPortal(modalContent, document.body);
};
