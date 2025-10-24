import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDocumentosVencidos, useDocumentosPorVencer } from './useDocumentosVencidos';
import { useCursosVencidos } from './useCursos';
import { useNavegacionDocumentos } from './useNavegacionDocumentos';
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
  const { data: cursosVencidos, isLoading: isLoadingCursos } = useCursosVencidos();

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
    isLoading: isLoadingVencidos || isLoadingPorVencer || isLoadingCursos,
    
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
