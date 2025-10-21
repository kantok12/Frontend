import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DashboardStats } from '../types';

export const useDashboardStats = () => {
  // Usar endpoints existentes para obtener estadísticas del dashboard
  const { data: personalData } = useQuery({
    queryKey: ['personal-disponible-servicio'],
    queryFn: () => apiService.getPersonalDisponibleServicio(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });

  const { data: carterasData } = useQuery({
    queryKey: ['servicios', 'carteras'],
    queryFn: () => apiService.getCarteras(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });

  const { data: clientesData } = useQuery({
    queryKey: ['servicios', 'clientes'],
    queryFn: () => apiService.getClientes(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });

  const { data: nodosData } = useQuery({
    queryKey: ['servicios', 'nodos'],
    queryFn: () => apiService.getNodos(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });

  const { data: documentosVencidosData } = useQuery({
    queryKey: ['documentos', 'vencidos'],
    queryFn: () => apiService.getDocumentosVencidos(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });

  const { data: documentosPorVencerData } = useQuery({
    queryKey: ['documentos', 'vencer'],
    queryFn: () => apiService.getDocumentosPorVencer(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });

  const { data: cursosData } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiService.getCursos(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });

  // Calcular estadísticas combinando datos de múltiples endpoints
  const stats = useMemo(() => {
    const personal = personalData || [];
    const carteras = carterasData || [];
    const clientes = clientesData || [];
    const nodos = nodosData || [];
    const documentosVencidos = documentosVencidosData || [];
    const documentosPorVencer = documentosPorVencerData || [];
    const cursos = cursosData || [];

    return {
      totalPersonal: personal.length,
      personalActivo: personal.filter((p: any) => p.estado === 'Activo').length,
      personalInactivo: personal.filter((p: any) => p.estado === 'Inactivo').length,
      totalCarteras: carteras.length,
      totalClientes: clientes.length,
      totalNodos: nodos.length,
      totalEventos: 0, // No hay endpoint para eventos
      eventosHoy: 0, // No hay endpoint para eventos
      eventosProximos: 0, // No hay endpoint para eventos
      documentosVencidos: documentosVencidos.length,
      documentosPorVencer: documentosPorVencer.length,
      cursosCompletados: cursos.filter((c: any) => c.estado === 'Completado').length,
      cursosPendientes: cursos.filter((c: any) => c.estado === 'Pendiente').length
    };
  }, [personalData, carterasData, clientesData, nodosData, documentosVencidosData, documentosPorVencerData, cursosData]);

  return {
    data: stats,
    isLoading: false, // Los queries individuales manejan su propio loading
    error: null,
    isError: false,
    isSuccess: true,
    refetch: () => Promise.resolve(),
    isFetching: false,
    isRefetching: false
  };
};
