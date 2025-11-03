import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDocumentosVencidos, useDocumentosPorVencer } from './useDocumentosVencidos';
import { useCursosVencidos } from './useCursos';
import { useNavegacionDocumentos } from './useNavegacionDocumentos';
import { usePersonalList } from './usePersonal';
import { useProgramacionSemanal } from './useProgramacion';
import { useEstadisticasServicios } from './useServicios';
import { useAuditoriaDashboard, useAuditoriaNotificaciones, useAuditoriaEstadisticas } from './useAuditoria';
import { 
  NotificacionDocumento, 
  CreateNotificacionData, 
  UpdateNotificacionData 
} from '../types';

// Hook principal para gestión de notificaciones de documentos
export const useNotificaciones = () => {
  const queryClient = useQueryClient();
  const { navegarADocumentos } = useNavegacionDocumentos();
  
  
  // Estado local para notificaciones eliminadas (leídas)
  // Ahora usamos las notificaciones del backend (/api/auditoria/notificaciones)

  // Obtener datos de documentos vencidos y por vencer
  const { data: documentosVencidos, isLoading: isLoadingVencidos } = useDocumentosVencidos();
  const { data: documentosPorVencer, isLoading: isLoadingPorVencer } = useDocumentosPorVencer();
  // Temporalmente deshabilitado - endpoint /api/cursos/vencidos devuelve error 500
  // const { data: cursosVencidos, isLoading: isLoadingCursos } = useCursosVencidos();
  const cursosVencidos: any = null;
  const isLoadingCursos = false;

  // Obtener datos adicionales para notificaciones más completas
  const { data: personalData, isLoading: isLoadingPersonal } = usePersonalList(1, 1000, '');
  const { data: estadisticasServicios, isLoading: isLoadingServicios } = useEstadisticasServicios();
  
  // Obtener programación de la semana actual para notificaciones de asignaciones
  const fechaInicioSemana = new Date();
  const diaSemana = fechaInicioSemana.getDay();
  const diff = fechaInicioSemana.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  fechaInicioSemana.setDate(diff);
  fechaInicioSemana.setHours(0, 0, 0, 0);
  
  const { programacion: programacionData, isLoading: isLoadingProgramacion } = useProgramacionSemanal(
    6, // Cartera por defecto
    fechaInicioSemana.toISOString().split('T')[0]
  );

  // Obtener datos de auditoría para notificaciones del sistema
  const { data: auditoriaDashboard, isLoading: isLoadingAuditoriaDashboard } = useAuditoriaDashboard({
    limit: 50,
    es_critico: true
  });
  
  const { data: auditoriaNotificaciones, isLoading: isLoadingAuditoriaNotificaciones } = useAuditoriaNotificaciones(false);
  
  const { data: auditoriaEstadisticas, isLoading: isLoadingAuditoriaEstadisticas } = useAuditoriaEstadisticas(30);

  // NOTE: Notifications are now sourced from the backend via useAuditoriaNotificaciones
  // The client no longer persists read/removed state in localStorage here.

  // Map server notifications (auditoriaNotificaciones) to our internal shape
  const generarNotificaciones = (): NotificacionDocumento[] => {
    const notificaciones: NotificacionDocumento[] = [];

    // Prefer server-provided notifications as authoritative
    const notifs = auditoriaNotificaciones?.data?.notificaciones || auditoriaNotificaciones?.data?.data || auditoriaNotificaciones?.data || [];
    if (Array.isArray(notifs)) {
      notifs.forEach((notif: any) => {
        notificaciones.push({
          id: String(notif.id || notif._id || Math.random()),
          tipo: notif.tipo || notif.type || 'auditoria_sistema',
          prioridad: (notif.prioridad || notif.priority || 'media') as 'alta' | 'media' | 'baja',
          titulo: notif.titulo || notif.title || 'Notificación del Sistema',
          mensaje: notif.mensaje || notif.message || 'Sin mensaje',
          personal_id: notif.usuario_id || notif.usuarioId || notif.user_id || null,
          personal_nombre: notif.usuario_nombre || notif.usuarioNombre || notif.user_name || null,
          documento_id: notif.documento_id || null,
          documento_nombre: notif.documento_nombre || null,
          fecha_vencimiento: notif.fecha_vencimiento || null,
          dias_restantes: notif.dias_restantes || null,
          leida: !!notif.leida || !!notif.read || false,
          fecha_creacion: notif.fecha_creacion || notif.fechaCreacion || notif.created_at || new Date().toISOString(),
          accion_requerida: notif.accion_requerida || notif.accionRequerida || notif.action_required || 'Revisar'
        });
      });
    }

    return notificaciones;
  };

  // Obtener notificaciones generadas - recalcular cuando cambien las notificaciones del backend
  const notificaciones = React.useMemo(() => generarNotificaciones(), [auditoriaNotificaciones?.data]);
  
  // Contar notificaciones no leídas (todas las activas son no leídas)
  const notificacionesNoLeidas = notificaciones.length;
  
  // Debug: Log para verificar el contador
  console.log('🔔 Notificaciones activas (server):', notificaciones.length);
  
  // Agrupar notificaciones por prioridad
  const notificacionesPorPrioridad = {
    alta: notificaciones.filter(n => n.prioridad === 'alta'),
    media: notificaciones.filter(n => n.prioridad === 'media'),
    baja: notificaciones.filter(n => n.prioridad === 'baja')
  };

  // Mutation para marcar una notificación como leída en el backend
  const marcarComoLeida = useMutation({
    mutationFn: async (notificacionId: string) => {
      // Llamada al endpoint PUT /api/auditoria/notificaciones/:id/marcar-leida
      const url = `/api/auditoria/notificaciones/${encodeURIComponent(notificacionId)}/marcar-leida`;
      const resp = await fetch(url, { method: 'PUT' });
      if (!resp.ok) throw new Error('Error marcando notificación como leída');
      return resp.json();
    },
    onSuccess: (_, notificacionId) => {
      // Invalidar la query de notificaciones para refrescar el estado
      queryClient.invalidateQueries(['auditoria', 'notificaciones', false]);
      console.log(`Notificación ${notificacionId} marcada como leída en servidor`);
    },
  });

  // Mutation para marcar todas las notificaciones como leídas (iterando en backend)
  const marcarTodasComoLeidas = useMutation({
    mutationFn: async () => {
      const ids = notificaciones.map(n => n.id);
      // Ejecutar secuencialmente para simplicidad
      for (const id of ids) {
        const url = `/api/auditoria/notificaciones/${encodeURIComponent(id)}/marcar-leida`;
        await fetch(url, { method: 'PUT' });
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auditoria', 'notificaciones', false]);
      console.log('Todas las notificaciones marcadas como leídas en servidor');
    },
  });

  // Función para obtener el color de la prioridad
  const getColorPrioridad = (prioridad: 'alta' | 'media' | 'baja') => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el icono del tipo de notificación
  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'documento_vencido':
        return '⚠️';
      case 'documento_por_vencer':
        return '⏰';
      case 'documento_faltante':
        return '📋';
      case 'documento_renovado':
        return '✅';
      case 'personal_sin_asignacion':
        return '👤';
      case 'servicios_sin_personal':
        return '🏢';
      case 'programacion_pendiente':
        return '📅';
      case 'mantenimiento_proximo':
        return '🔧';
      case 'auditoria_critica':
        return '🔴';
      case 'auditoria_sistema':
        return '🔔';
      case 'auditoria_estadisticas':
        return '📊';
      default:
        return '📄';
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para restaurar todas las notificaciones eliminadas (útil para testing)
  const limpiarNotificacionesLeidas = () => {
    // Al usar notificaciones del backend, simplemente invalidamos la cache
    queryClient.invalidateQueries(['auditoria', 'notificaciones']);
    console.log('Solicitado refresco de notificaciones (backend).');
  };


  return {
    // Datos
    notificaciones,
    notificacionesNoLeidas,
    notificacionesPorPrioridad,
    
    // Estados de carga
    isLoading: isLoadingVencidos || isLoadingPorVencer || isLoadingCursos || isLoadingPersonal || isLoadingServicios || isLoadingProgramacion || isLoadingAuditoriaDashboard || isLoadingAuditoriaNotificaciones || isLoadingAuditoriaEstadisticas,
    
    // Mutations
    marcarComoLeida,
    marcarTodasComoLeidas,
    
    // Funciones de utilidad
    getColorPrioridad,
    getIconoTipo,
    formatearFecha,
    limpiarNotificacionesLeidas,
    navegarADocumentos,
    
    // Estados de mutations
    isMarkingAsRead: marcarComoLeida.isLoading,
    isMarkingAllAsRead: marcarTodasComoLeidas.isLoading,
  };
};
