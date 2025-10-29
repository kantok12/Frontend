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
  const [notificacionesEliminadas, setNotificacionesEliminadas] = useState<Set<string>>(new Set());

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

  // Cargar notificaciones eliminadas del localStorage al inicializar
  useEffect(() => {
    const eliminadasGuardadas = localStorage.getItem('notificaciones-eliminadas');
    if (eliminadasGuardadas) {
      try {
        const eliminadas = JSON.parse(eliminadasGuardadas);
        setNotificacionesEliminadas(new Set(eliminadas));
      } catch (error) {
        console.error('Error al cargar notificaciones eliminadas:', error);
      }
    }
  }, []);

  // Guardar notificaciones eliminadas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('notificaciones-eliminadas', JSON.stringify(Array.from(notificacionesEliminadas)));
  }, [notificacionesEliminadas]);

  // Generar notificaciones basadas en los datos obtenidos
  const generarNotificaciones = (): NotificacionDocumento[] => {
    const notificaciones: NotificacionDocumento[] = [];

    // Notificaciones de documentos vencidos
    if (documentosVencidos?.data) {
      documentosVencidos.data.forEach((doc: any) => {
        const notificacionId = `doc_vencido_${doc.id}`;
        // Solo agregar si no está eliminada
        if (!notificacionesEliminadas.has(notificacionId)) {
          notificaciones.push({
            id: notificacionId,
            tipo: 'documento_vencido',
            prioridad: 'alta',
            titulo: 'Documento Vencido',
            mensaje: `El documento "${doc.nombre_documento}" de ${doc.personal?.nombres || 'Personal'} está vencido hace ${Math.abs(doc.dias_restantes || 0)} días`,
            personal_id: doc.rut_persona,
            personal_nombre: doc.personal?.nombres,
            documento_id: doc.id,
            documento_nombre: doc.nombre_documento,
            fecha_vencimiento: doc.fecha_vencimiento,
            dias_restantes: doc.dias_restantes,
            leida: false, // Todas las notificaciones activas son no leídas
            fecha_creacion: new Date().toISOString(),
            accion_requerida: 'Renovar Documento'
          });
        }
      });
    }

    // Notificaciones de personal sin asignación esta semana
    if (personalData?.data?.items && programacionData) {
      const personalList = personalData.data.items;
      const programacionList = programacionData;
      
      // Obtener RUTs de personal asignado esta semana
      const rutAsignados = new Set();
      programacionList.forEach((dia: any) => {
        if (dia.trabajadores) {
          dia.trabajadores.forEach((trabajador: any) => {
            rutAsignados.add(trabajador.rut);
          });
        }
      });

      // Buscar personal activo sin asignación
      personalList.forEach((personal: any) => {
        if (personal.activo && !rutAsignados.has(personal.rut)) {
          const notificacionId = `personal_sin_asignacion_${personal.rut}`;
          if (!notificacionesEliminadas.has(notificacionId)) {
            notificaciones.push({
              id: notificacionId,
              tipo: 'personal_sin_asignacion',
              prioridad: 'media',
              titulo: 'Personal Sin Asignación',
              mensaje: `${personal.nombres} ${personal.apellidos} no tiene asignaciones para esta semana`,
              personal_id: personal.rut,
              personal_nombre: `${personal.nombres} ${personal.apellidos}`,
              documento_id: null,
              documento_nombre: null,
              fecha_vencimiento: null,
              dias_restantes: null,
              leida: false,
              fecha_creacion: new Date().toISOString(),
              accion_requerida: 'Asignar Personal'
            });
          }
        }
      });
    }

    // Notificaciones de servicios con problemas
    if (estadisticasServicios?.data) {
      const serviciosData = estadisticasServicios.data;
      
      // Notificación si hay muchos nodos sin personal asignado
      if (serviciosData.totales?.nodos > serviciosData.totales?.personal_asignado) {
        const notificacionId = 'servicios_sin_personal';
        if (!notificacionesEliminadas.has(notificacionId)) {
          notificaciones.push({
            id: notificacionId,
            tipo: 'servicios_sin_personal',
            prioridad: 'media',
            titulo: 'Servicios Sin Personal',
            mensaje: `Hay ${serviciosData.totales.nodos - serviciosData.totales.personal_asignado} nodos sin personal asignado`,
            personal_id: null,
            personal_nombre: null,
            documento_id: null,
            documento_nombre: null,
            fecha_vencimiento: null,
            dias_restantes: null,
            leida: false,
            fecha_creacion: new Date().toISOString(),
            accion_requerida: 'Revisar Asignaciones'
          });
        }
      }
    }

    // Notificaciones de auditoría - Dashboard de actividad crítica
    if (auditoriaDashboard?.data) {
      // Manejar diferentes estructuras de respuesta
      const actividades = auditoriaDashboard.data.actividades || auditoriaDashboard.data.data || auditoriaDashboard.data || [];
      
      if (Array.isArray(actividades) && actividades.length > 0) {
        actividades.forEach((actividad: any, index: number) => {
          const notificacionId = `auditoria_critica_${actividad.id || actividad._id || index}`;
          if (!notificacionesEliminadas.has(notificacionId)) {
            notificaciones.push({
              id: notificacionId,
              tipo: 'auditoria_critica',
              prioridad: 'alta',
              titulo: 'Actividad Crítica Detectada',
              mensaje: `${actividad.accion || actividad.action || 'Acción'} en ${actividad.tabla || actividad.table || 'sistema'}: ${actividad.descripcion || actividad.description || actividad.mensaje || 'Sin descripción'}`,
              personal_id: actividad.usuario_id || actividad.usuarioId || actividad.user_id || null,
              personal_nombre: actividad.usuario_nombre || actividad.usuarioNombre || actividad.user_name || null,
              documento_id: null,
              documento_nombre: null,
              fecha_vencimiento: null,
              dias_restantes: null,
              leida: false,
              fecha_creacion: actividad.fecha_creacion || actividad.fechaCreacion || actividad.created_at || new Date().toISOString(),
              accion_requerida: 'Revisar Auditoría'
            });
          }
        });
      }
    }

    // Notificaciones de auditoría - Notificaciones no leídas del sistema
    if (auditoriaNotificaciones?.data) {
      // Manejar diferentes estructuras de respuesta
      const notifs = auditoriaNotificaciones.data.notificaciones || auditoriaNotificaciones.data.data || auditoriaNotificaciones.data || [];
      
      if (Array.isArray(notifs) && notifs.length > 0) {
        notifs.forEach((notif: any) => {
          const notificacionId = `auditoria_sistema_${notif.id || notif._id || Math.random()}`;
          if (!notificacionesEliminadas.has(notificacionId)) {
            notificaciones.push({
              id: notificacionId,
              tipo: 'auditoria_sistema',
              prioridad: (notif.prioridad || notif.priority || 'media') as 'alta' | 'media' | 'baja',
              titulo: notif.titulo || notif.title || 'Notificación del Sistema',
              mensaje: notif.mensaje || notif.message || 'Sin mensaje',
              personal_id: notif.usuario_id || notif.usuarioId || notif.user_id || null,
              personal_nombre: notif.usuario_nombre || notif.usuarioNombre || notif.user_name || null,
              documento_id: null,
              documento_nombre: null,
              fecha_vencimiento: null,
              dias_restantes: null,
              leida: notif.leida || notif.read || false,
              fecha_creacion: notif.fecha_creacion || notif.fechaCreacion || notif.created_at || new Date().toISOString(),
              accion_requerida: notif.accion_requerida || notif.accionRequerida || notif.action_required || 'Revisar'
            });
          }
        });
      }
    }

    // Notificaciones de auditoría - Estadísticas de los últimos 30 días
    if (auditoriaEstadisticas?.data) {
      // Manejar diferentes estructuras de respuesta
      const stats = auditoriaEstadisticas.data.estadisticas || auditoriaEstadisticas.data.data || auditoriaEstadisticas.data || {};
      
      // Notificación si hay muchas actividades críticas
      const actividadesCriticas = stats.actividades_criticas || stats.actividadesCriticas || stats.critical_activities || 0;
      if (actividadesCriticas > 10) {
        const notificacionId = 'auditoria_muchas_criticas';
        if (!notificacionesEliminadas.has(notificacionId)) {
          notificaciones.push({
            id: notificacionId,
            tipo: 'auditoria_estadisticas',
            prioridad: 'alta',
            titulo: 'Alto Número de Actividades Críticas',
            mensaje: `Se han detectado ${actividadesCriticas} actividades críticas en los últimos 30 días`,
            personal_id: null,
            personal_nombre: null,
            documento_id: null,
            documento_nombre: null,
            fecha_vencimiento: null,
            dias_restantes: null,
            leida: false,
            fecha_creacion: new Date().toISOString(),
            accion_requerida: 'Revisar Estadísticas'
          });
        }
      }

      // Notificación si hay muchas modificaciones en programación
      const modificacionesProgramacion = stats.modificaciones_programacion || stats.modificacionesProgramacion || stats.programming_modifications || 0;
      if (modificacionesProgramacion > 20) {
        const notificacionId = 'auditoria_muchas_modificaciones';
        if (!notificacionesEliminadas.has(notificacionId)) {
          notificaciones.push({
            id: notificacionId,
            tipo: 'auditoria_estadisticas',
            prioridad: 'media',
            titulo: 'Frecuentes Modificaciones en Programación',
            mensaje: `Se han realizado ${modificacionesProgramacion} modificaciones en programación en los últimos 30 días`,
            personal_id: null,
            personal_nombre: null,
            documento_id: null,
            documento_nombre: null,
            fecha_vencimiento: null,
            dias_restantes: null,
            leida: false,
            fecha_creacion: new Date().toISOString(),
            accion_requerida: 'Revisar Patrones'
          });
        }
      }
    }

    // Notificaciones de documentos por vencer
    if (documentosPorVencer?.data) {
      documentosPorVencer.data.forEach((doc: any) => {
        const diasRestantes = doc.dias_restantes || 0;
        let prioridad: 'alta' | 'media' | 'baja' = 'baja';
        
        if (diasRestantes <= 7) prioridad = 'alta';
        else if (diasRestantes <= 15) prioridad = 'media';

        const notificacionId = `doc_por_vencer_${doc.id}`;
        // Solo agregar si no está eliminada
        if (!notificacionesEliminadas.has(notificacionId)) {
          notificaciones.push({
            id: notificacionId,
            tipo: 'documento_por_vencer',
            prioridad,
            titulo: 'Documento por Vencer',
            mensaje: `El documento "${doc.nombre_documento}" de ${doc.personal?.nombres || 'Personal'} vence en ${diasRestantes} días`,
            personal_id: doc.rut_persona,
            personal_nombre: doc.personal?.nombres,
            documento_id: doc.id,
            documento_nombre: doc.nombre_documento,
            fecha_vencimiento: doc.fecha_vencimiento,
            dias_restantes: diasRestantes,
            leida: false, // Todas las notificaciones activas son no leídas
            fecha_creacion: new Date().toISOString(),
            accion_requerida: 'Renovar Documento'
          });
        }
      });
    }

    // Notificaciones de cursos vencidos
    if (cursosVencidos?.data) {
      cursosVencidos.data.forEach((curso: any) => {
        const notificacionId = `curso_vencido_${curso.id}`;
        // Solo agregar si no está eliminada
        if (!notificacionesEliminadas.has(notificacionId)) {
          notificaciones.push({
            id: notificacionId,
            tipo: 'documento_vencido', // Usar el mismo tipo para cursos
            prioridad: 'alta',
            titulo: 'Curso Vencido',
            mensaje: `El curso "${curso.nombre_curso}" de ${curso.personal?.nombres || 'Personal'} está vencido`,
            personal_id: curso.personal_id,
            personal_nombre: curso.personal?.nombres,
            documento_id: curso.id,
            documento_nombre: curso.nombre_curso,
            fecha_vencimiento: curso.fecha_vencimiento,
            dias_restantes: curso.dias_restantes,
            leida: false, // Todas las notificaciones activas son no leídas
            fecha_creacion: new Date().toISOString(),
            accion_requerida: 'Renovar Curso'
          });
        }
      });
    }

    return notificaciones;
  };

  // Obtener notificaciones generadas - usar useMemo para recalcular cuando cambien los datos o el estado de eliminadas
  // Obtener notificaciones generadas - usar useMemo para recalcular cuando cambien los datos
  const notificaciones = React.useMemo(() => generarNotificaciones(), [
    documentosVencidos?.data,
    documentosPorVencer?.data,
    cursosVencidos?.data,
    personalData?.data?.items,
    programacionData,
    estadisticasServicios?.data,
    auditoriaDashboard?.data,
    auditoriaNotificaciones?.data,
    auditoriaEstadisticas?.data,
    notificacionesEliminadas
  ]);
  
  // Contar notificaciones no leídas (todas las activas son no leídas)
  const notificacionesNoLeidas = notificaciones.length;
  
  // Debug: Log para verificar el contador
  console.log('🔔 Notificaciones activas:', notificaciones.length);
  console.log('🔔 Notificaciones eliminadas:', notificacionesEliminadas.size);
  console.log('🔔 Total eliminadas:', Array.from(notificacionesEliminadas));
  
  // Agrupar notificaciones por prioridad
  const notificacionesPorPrioridad = {
    alta: notificaciones.filter(n => n.prioridad === 'alta'),
    media: notificaciones.filter(n => n.prioridad === 'media'),
    baja: notificaciones.filter(n => n.prioridad === 'baja')
  };

  // Mutation para eliminar notificación (marcar como leída)
  const marcarComoLeida = useMutation({
    mutationFn: (notificacionId: string) => {
      // Agregar a notificaciones eliminadas
      setNotificacionesEliminadas(prev => {
        const nuevoSet = new Set(prev);
        nuevoSet.add(notificacionId);
        return nuevoSet;
      });
      return Promise.resolve({ success: true, id: notificacionId });
    },
    onSuccess: (_, notificacionId) => {
      console.log(`Notificación ${notificacionId} eliminada (marcada como leída)`);
    },
  });

  // Mutation para eliminar todas las notificaciones (marcar todas como leídas)
  const marcarTodasComoLeidas = useMutation({
    mutationFn: () => {
      // Eliminar todas las notificaciones actuales
      const todasLasIds = notificaciones.map(n => n.id);
      setNotificacionesEliminadas(prev => {
        const nuevoSet = new Set(prev);
        todasLasIds.forEach(id => nuevoSet.add(id));
        return nuevoSet;
      });
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      console.log('Todas las notificaciones eliminadas (marcadas como leídas)');
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
    setNotificacionesEliminadas(new Set());
    localStorage.removeItem('notificaciones-eliminadas');
    console.log('Todas las notificaciones eliminadas han sido restauradas');
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
    isMarkingAsRead: marcarComoLeida.isPending,
    isMarkingAllAsRead: marcarTodasComoLeidas.isPending,
  };
};
