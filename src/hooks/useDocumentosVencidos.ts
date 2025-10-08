import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { DocumentoVencido, UpdateDocumentoData } from '../types';

// Hook para obtener documentos vencidos
export const useDocumentosVencidos = () => {
  return useQuery({
    queryKey: ['documentos', 'vencidos'],
    queryFn: () => apiService.getDocumentosVencidos(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook para obtener documentos por vencer
export const useDocumentosPorVencer = () => {
  return useQuery({
    queryKey: ['documentos', 'por-vencer'],
    queryFn: () => apiService.getDocumentosPorVencer(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook principal para gestión de documentos vencidos
export const useDocumentosVencidosManager = () => {
  const queryClient = useQueryClient();

  // Query para documentos vencidos
  const { data: documentosVencidos, isLoading: isLoadingVencidos, error: errorVencidos } = useDocumentosVencidos();
  
  // Query para documentos por vencer
  const { data: documentosPorVencer, isLoading: isLoadingPorVencer, error: errorPorVencer } = useDocumentosPorVencer();

  // Mutation para actualizar documento
  const actualizarDocumento = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateDocumentoData }) => 
      apiService.actualizarDocumento(id, datos),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con documentos
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
    },
  });

  // Función para obtener el estado del documento basado en días restantes
  const getEstadoDocumento = (diasRestantes?: number) => {
    if (diasRestantes === undefined || diasRestantes === null) return 'sin_fecha';
    if (diasRestantes < 0) return 'vencido';
    if (diasRestantes <= 30) return 'por_vencer';
    return 'vigente';
  };

  // Función para obtener el color del estado
  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'vencido':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'por_vencer':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'vigente':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el texto del estado
  const getTextoEstado = (estado: string, diasRestantes?: number) => {
    switch (estado) {
      case 'vencido':
        return `Vencido hace ${Math.abs(diasRestantes || 0)} días`;
      case 'por_vencer':
        return `Vence en ${diasRestantes} días`;
      case 'vigente':
        return `Vigente (${diasRestantes} días restantes)`;
      default:
        return 'Sin fecha de vencimiento';
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para calcular días restantes
  const calcularDiasRestantes = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return {
    // Datos
    documentosVencidos: documentosVencidos?.data || [],
    documentosPorVencer: documentosPorVencer?.data || [],
    
    // Estados de carga
    isLoadingVencidos,
    isLoadingPorVencer,
    errorVencidos,
    errorPorVencer,
    
    // Mutations
    actualizarDocumento,
    
    // Funciones de utilidad
    getEstadoDocumento,
    getColorEstado,
    getTextoEstado,
    formatearFecha,
    calcularDiasRestantes,
    
    // Estados de mutations
    isUpdating: actualizarDocumento.isPending,
  };
};
