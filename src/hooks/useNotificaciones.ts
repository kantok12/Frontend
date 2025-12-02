/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
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
  const [localLeidas, setLocalLeidas] = useState<Set<string>>(new Set());
  const [forceAllUnread, setForceAllUnread] = useState<boolean>(false);
  const LOCAL_STORAGE_KEY = 'notificaciones_local_leidas_v1';

  // Inicializar localLeidas desde localStorage una vez
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw || '[]');
        if (Array.isArray(arr)) setLocalLeidas(new Set(arr));
      }
    } catch (err) {
      console.warn('Error leyendo notificaciones locales desde localStorage', err);
    }
  }, []);

  // Helper para persistir cambios en localLeidas
  const persistLocalLeidas = (nextSet: Set<string>) => {
    try {
      const arr = Array.from(nextSet.values());
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(arr));
    } catch (err) {
      console.warn('Error guardando notificaciones locales en localStorage', err);
    }
  };

  const addLocalLeida = (id: string) => {
    setLocalLeidas(prev => {
      const next = new Set(prev);
      next.add(id);
      persistLocalLeidas(next);
      return next;
    });
  };

  const clearLocalLeidas = () => {
    setLocalLeidas(() => {
      const next = new Set<string>();
      persistLocalLeidas(next);
      return next;
    });
  };

  // Local generated notifications from client-side events (e.g., personal updates)
  const [localGeneradas, setLocalGeneradas] = useState<NotificacionDocumento[]>([]);
  const LOCAL_GENERADAS_KEY = 'notificaciones_local_generadas_v1';

  // Escuchar eventos globales de actualizaciones de personal para generar notificaciones prioridad 'baja'
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail || {};
        const rut = detail.rut || detail.id || String(detail.id || '').trim();
        const nombre = detail.nombre || null;
        const id = `personal_update_${rut}_${Date.now()}`;
        const notif = {
          id,
          tipo: 'personal_actualizacion',
          prioridad: 'baja',
          titulo: nombre ? `Actualización: ${nombre}` : 'Actualización de personal',
          mensaje: `Se actualizó información de la persona ${nombre || rut}`,
          personal_id: rut || null,
          personal_nombre: nombre || null,
          documento_id: null,
          documento_nombre: null,
          fecha_vencimiento: null,
          dias_restantes: null,
          leida: false,
          fecha_creacion: new Date().toISOString(),
          accion_requerida: 'Ver detalles'
        } as NotificacionDocumento;
        setLocalGeneradas(prev => {
          const next = [notif, ...prev.filter(p => p.id !== notif.id)];
          try {
            localStorage.setItem(LOCAL_GENERADAS_KEY, JSON.stringify(next));
          } catch (e) {
            // ignore
          }
          return next;
        });
      } catch (err) {
        console.warn('Error creando notificación local por evento personalUpdated', err);
      }
    };

    window.addEventListener('personalUpdated', handler as EventListener);
    return () => window.removeEventListener('personalUpdated', handler as EventListener);
  }, []);

  // Cargar notificaciones locales generadas desde localStorage al iniciar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_GENERADAS_KEY);
      if (raw) {
        const arr = JSON.parse(raw || '[]');
        if (Array.isArray(arr)) setLocalGeneradas(arr);
      }
    } catch (err) {
      // ignore
    }
  }, []);
  
  
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

    // Helper: resolver nombre completo desde personalData si está disponible
    const getNombreFromPersonal = (personalIdOrRut?: string | number | null) => {
      try {
        if (!personalIdOrRut || !personalData?.data?.items) return null;
        const items = personalData.data.items || [];
        const idStr = String(personalIdOrRut);
        const found = items.find((p: any) => String(p.id) === idStr || p.rut === idStr || p.rut?.replace(/[.-]/g, '') === idStr.replace(/[.-]/g, ''));
        if (!found) return null;
        const first = ((found as any).nombre || (found as any).nombres || '').trim();
        const last = ((found as any).apellido || (found as any).apellidos || '').trim();
        return `${first} ${last}`.trim() || null;
      } catch (e) {
        return null;
      }
    };

    // Prefer server-provided notifications as authoritative
    const notifs = auditoriaNotificaciones?.data?.notificaciones || auditoriaNotificaciones?.data?.data || auditoriaNotificaciones?.data || [];
    if (Array.isArray(notifs)) {
      notifs.forEach((notif: any) => {
        const tipoNotif = notif.tipo || notif.type || 'auditoria_sistema';
        // Aplicar reglas de prioridad: vencido=alta, por_vencer=media, actualizaciones personales=baja
        let prioridadNotif = (notif.prioridad || notif.priority || 'media') as 'alta' | 'media' | 'baja';
        if (tipoNotif === 'documento_vencido') prioridadNotif = 'alta';
        if (tipoNotif === 'documento_por_vencer') prioridadNotif = 'media';
        if (tipoNotif.startsWith('personal_') || tipoNotif === 'personal_actualizacion') prioridadNotif = 'baja';

        const personalIdFromNotif = notif.usuario_id || notif.usuarioId || notif.user_id || null;
        const resolvedNombre = notif.usuario_nombre || notif.usuarioNombre || notif.user_name || getNombreFromPersonal(personalIdFromNotif) || null;

        const id = String(notif.id || notif._id || Math.random());
        notificaciones.push({
          id,
          tipo: tipoNotif,
          prioridad: prioridadNotif,
          titulo: notif.titulo || notif.title || 'Notificación del Sistema',
          mensaje: notif.mensaje || notif.message || 'Sin mensaje',
          personal_id: personalIdFromNotif || null,
          personal_nombre: resolvedNombre,
          documento_id: notif.documento_id || null,
          documento_nombre: notif.documento_nombre || null,
          fecha_vencimiento: notif.fecha_vencimiento || null,
          dias_restantes: notif.dias_restantes || null,
          leida: forceAllUnread ? false : (!!notif.leida || !!notif.read || localLeidas.has(id) || false),
          fecha_creacion: notif.fecha_creacion || notif.fechaCreacion || notif.created_at || new Date().toISOString(),
          accion_requerida: notif.accion_requerida || notif.accionRequerida || notif.action_required || 'Revisar'
        });
      });
    }

    // Añadir notificaciones a partir de documentos vencidos
    const vencidosList = documentosVencidos?.data || documentosVencidos || [];
    if (Array.isArray(vencidosList)) {
      vencidosList.forEach((doc: any) => {
        const rut = doc.personal?.rut || doc.rut_persona || '';
        const nombreResolved = doc.personal?.nombre || doc.personal?.nombres || getNombreFromPersonal(rut) || '';
        const docVId = `doc_vencido_${doc.id}`;
        // calcular días restantes en cliente (puede venir distinto del backend)
        const fechaV = doc.fecha_vencimiento || doc.fecha_venc || null;
        let diasRestantes: number | null = null;
        if (fechaV) {
          const diffMs = new Date(fechaV).getTime() - Date.now();
          diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }
        // si por alguna razón diasRestantes es >=0, pero proviene de la lista de vencidos,
        // forzamos que sea tratado como vencido (prioridad alta)
        const mensaje = (diasRestantes !== null && diasRestantes < 0)
          ? `Venció hace ${Math.abs(diasRestantes)} días`
          : (doc.fecha_vencimiento ? `Venció el ${doc.fecha_vencimiento}` : 'Documento vencido');

        notificaciones.push({
          id: docVId,
          tipo: 'documento_vencido',
          prioridad: 'alta',
          titulo: `${doc.nombre_documento} — ${nombreResolved || rut}`,
          mensaje,
          personal_id: rut || String(doc.personal?.id || doc.rut_persona || '' ) || null,
          personal_nombre: nombreResolved || null,
          documento_id: String(doc.id),
          documento_nombre: doc.nombre_documento,
          fecha_vencimiento: fechaV || null,
          dias_restantes: diasRestantes ?? null,
          leida: forceAllUnread ? false : (localLeidas.has(docVId) || false),
          fecha_creacion: doc.fecha_subida || new Date().toISOString(),
          accion_requerida: 'Ver documentos'
        });
      });
    }

    // Añadir notificaciones a partir de documentos por vencer
    const porVencerList = documentosPorVencer?.data || documentosPorVencer || [];
    if (Array.isArray(porVencerList)) {
      porVencerList.forEach((doc: any) => {
        const rut = doc.personal?.rut || doc.rut_persona || '';
        const nombreResolved = doc.personal?.nombre || doc.personal?.nombres || getNombreFromPersonal(rut) || '';
        const docPVId = `doc_por_vencer_${doc.id}`;
        const fechaV = doc.fecha_vencimiento || doc.fecha_venc || null;
        let diasRestantes: number | null = null;
        if (fechaV) {
          const diffMs = new Date(fechaV).getTime() - Date.now();
          diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }

        // Si la fecha ya pasó, tratarlo como vencido (alta)
        if (diasRestantes !== null && diasRestantes < 0) {
          const mensaje = `Venció hace ${Math.abs(diasRestantes)} días`;
          notificaciones.push({
            id: `doc_vencido_${doc.id}`,
            tipo: 'documento_vencido',
            prioridad: 'alta',
            titulo: `${doc.nombre_documento} — ${nombreResolved || rut}`,
            mensaje,
            personal_id: rut || String(doc.personal?.id || doc.rut_persona || '' ) || null,
            personal_nombre: nombreResolved || null,
            documento_id: String(doc.id),
            documento_nombre: doc.nombre_documento,
            fecha_vencimiento: fechaV || null,
            dias_restantes: diasRestantes,
            leida: forceAllUnread ? false : (localLeidas.has(docPVId) || false),
            fecha_creacion: doc.fecha_subida || new Date().toISOString(),
            accion_requerida: 'Ver documentos'
          });
        } else {
          const mensaje = diasRestantes !== null ? `Vence en ${diasRestantes} días` : 'Documento por vencer';
          notificaciones.push({
            id: docPVId,
            tipo: 'documento_por_vencer',
            prioridad: 'media',
            titulo: `${doc.nombre_documento} — ${nombreResolved || rut}`,
            mensaje,
            personal_id: rut || String(doc.personal?.id || doc.rut_persona || '' ) || null,
            personal_nombre: nombreResolved || null,
            documento_id: String(doc.id),
            documento_nombre: doc.nombre_documento,
            fecha_vencimiento: fechaV || null,
            dias_restantes: diasRestantes ?? null,
            leida: forceAllUnread ? false : (localLeidas.has(docPVId) || false),
            fecha_creacion: doc.fecha_subida || new Date().toISOString(),
            accion_requerida: 'Ver documentos'
          });
        }
      });
    }

    // Añadir notificaciones locales generadas desde eventos (ej. actualizaciones personales)
    if (Array.isArray(localGeneradas) && localGeneradas.length > 0) {
      localGeneradas.forEach((ln) => {
        // Avoid duplicates by id
        if (!notificaciones.find(n => n.id === ln.id)) {
          notificaciones.push({ ...ln });
        }
      });
    }

    return notificaciones;
  };

  // Obtener notificaciones generadas - recalcular cuando cambien las notificaciones del backend
  const notificacionesTodas = React.useMemo(() => generarNotificaciones(), [generarNotificaciones, auditoriaNotificaciones?.data, documentosVencidos, documentosPorVencer, personalData, localLeidas, forceAllUnread, localGeneradas]);

  // Filtrar notificaciones visibles: si están marcadas como leídas (en servidor o local) las ocultamos
  const notificaciones = React.useMemo(() => {
    if (forceAllUnread) return notificacionesTodas;
    return notificacionesTodas.filter(n => !n.leida && !localLeidas.has(n.id));
  }, [notificacionesTodas, localLeidas, forceAllUnread]);

  // Contar notificaciones no leídas (visibles)
  const notificacionesNoLeidas = notificaciones.length;

  // Notificaciones leídas (server-marked OR localLeidas)
  const notificacionesLeidas = React.useMemo(() => {
    return notificacionesTodas.filter(n => (n.leida || localLeidas.has(n.id)) && !forceAllUnread);
  }, [notificacionesTodas, localLeidas, forceAllUnread]);
  
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

  // Helper optimista: marca localmente primero para que la UI cambie inmediatamente,
  // luego intenta marcar en backend cuando aplique. Para notificaciones locales
  // (synthetic) solo se marca localmente.
  const marcarComoLeidaOptimistic = async (notificacionId: string) => {
    try {
      addLocalLeida(notificacionId);
      queryClient.invalidateQueries(['auditoria', 'notificaciones', false]);
    } catch (e) {
      // ignore
    }

    // Client-only notifications: skip server call
    if (
      notificacionId.startsWith('doc_vencido_') ||
      notificacionId.startsWith('doc_por_vencer_') ||
      notificacionId.startsWith('personal_update_')
    ) {
      return;
    }

    try {
      await marcarComoLeida.mutateAsync(notificacionId);
    } catch (err) {
      // If server call fails, keep the local mark (best-effort)
      try { addLocalLeida(notificacionId); } catch (_) {}
      queryClient.invalidateQueries(['auditoria', 'notificaciones', false]);
    }
  };

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

  const marcarTodasComoLeidasOptimistic = async () => {
    // Optimistic: marcar localmente todas primero para respuesta inmediata
    const ids = notificaciones.map(n => n.id);
    for (const id of ids) {
      try { addLocalLeida(id); } catch (e) { /* ignore */ }
    }
    queryClient.invalidateQueries(['auditoria', 'notificaciones', false]);

    // Luego intentar marcar en servidor para las que no sean client-only
    for (const id of ids) {
      if (
        id.startsWith('doc_vencido_') ||
        id.startsWith('doc_por_vencer_') ||
        id.startsWith('personal_update_')
      ) {
        continue;
      }
      try {
        await marcarComoLeida.mutateAsync(id);
      } catch (err) {
        try { addLocalLeida(id); } catch (_) {}
      }
    }
  };

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
    // Limpiar marcas locales y forzar que todas se muestren como no leídas temporalmente
    clearLocalLeidas();
    setForceAllUnread(true);
    queryClient.invalidateQueries(['auditoria', 'notificaciones']);
    console.log('Solicitado restaurar notificaciones: limpiadas marcas locales y forzando no leídas.');

    // Quitar el flag de force después de 10s para volver a respetar el estado del servidor
    setTimeout(() => {
      setForceAllUnread(false);
      queryClient.invalidateQueries(['auditoria', 'notificaciones']);
      console.log('Restauración temporal expirada: volviendo a estado del servidor');
    }, 10000);
  };


  return {
    // Datos
    notificaciones,
    notificacionesTodas,
    notificacionesLeidas,
    notificacionesNoLeidas,
    notificacionesPorPrioridad,
    
    // Estados de carga
    isLoading: isLoadingVencidos || isLoadingPorVencer || isLoadingCursos || isLoadingPersonal || isLoadingServicios || isLoadingProgramacion || isLoadingAuditoriaDashboard || isLoadingAuditoriaNotificaciones || isLoadingAuditoriaEstadisticas,
    
    // Mutations
    marcarComoLeida,
    marcarTodasComoLeidas,
    marcarComoLeidaOptimistic,
    marcarTodasComoLeidasOptimistic,
    // Local read set (used by UI to reflect optimistic reads immediately)
    localLeidas,
    
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
