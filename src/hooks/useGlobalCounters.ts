import { useQuery } from '@tanstack/react-query';
import apiService from '../services/api';

// Hook para obtener contadores globales de documentos y cursos
export const useGlobalCounters = () => {
  // Query para documentos vencidos globales
  const documentosVencidosQuery = useQuery({
    queryKey: ['documentos', 'vencidos', 'global'],
    queryFn: () => apiService.getDocumentosVencidos(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para documentos por vencer globales
  const documentosPorVencerQuery = useQuery({
    queryKey: ['documentos', 'por-vencer', 'global'],
    queryFn: () => apiService.getDocumentosPorVencer(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const documentosVencidos = documentosVencidosQuery.data;
  const documentosPorVencer = documentosPorVencerQuery.data;
  const isLoadingVencidos = documentosVencidosQuery.isLoading;
  const isLoadingPorVencer = documentosPorVencerQuery.isLoading;

  // Función para calcular días restantes
  const calcularDiasRestantes = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Función para obtener el estado del documento
  const getEstadoDocumento = (documento: any) => {
    if (!documento.fecha_vencimiento) return 'sin_fecha';
    
    const diasRestantes = calcularDiasRestantes(documento.fecha_vencimiento);
    if (diasRestantes < 0) return 'vencido';
    if (diasRestantes <= 30) return 'por_vencer';
    return 'vigente';
  };

  // Calcular contadores globales de documentos
  const calcularContadoresDocumentos = () => {
    const documentosVencidosList = documentosVencidos?.data || [];
    const documentosPorVencerList = documentosPorVencer?.data || [];
    
    // Combinar ambas listas y eliminar duplicados por ID
    const todosDocumentos = [...documentosVencidosList, ...documentosPorVencerList];
    const documentosUnicos = todosDocumentos.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    );

    const contadores = {
      vencidos: documentosVencidosList.length,
      porVencer: documentosPorVencerList.length,
      vigentes: 0,
      sinFecha: 0,
      total: documentosUnicos.length
    };

    // Calcular vigentes y sin fecha
    documentosUnicos.forEach((documento: any) => {
      const estado = getEstadoDocumento(documento);
      if (estado === 'vigente') {
        contadores.vigentes++;
      } else if (estado === 'sin_fecha') {
        contadores.sinFecha++;
      }
    });

    return contadores;
  };

  // Calcular contadores globales de cursos (usando la misma lógica)
  const calcularContadoresCursos = () => {
    // Por ahora, asumimos que los cursos también están en los documentos
    // En el futuro, se puede crear un endpoint específico para cursos vencidos
    const documentosVencidosList = documentosVencidos?.data || [];
    const documentosPorVencerList = documentosPorVencer?.data || [];
    
    // Filtrar solo documentos de cursos
    const cursosVencidos = documentosVencidosList.filter((doc: any) => 
      doc.tipo_documento?.includes('curso') || 
      doc.tipo_documento?.includes('certificado') ||
      doc.tipo_documento?.includes('diploma')
    );
    
    const cursosPorVencer = documentosPorVencerList.filter((doc: any) => 
      doc.tipo_documento?.includes('curso') || 
      doc.tipo_documento?.includes('certificado') ||
      doc.tipo_documento?.includes('diploma')
    );

    const todosCursos = [...cursosVencidos, ...cursosPorVencer];
    const cursosUnicos = todosCursos.filter((curso, index, self) => 
      index === self.findIndex(c => c.id === curso.id)
    );

    const contadores = {
      vencidos: cursosVencidos.length,
      porVencer: cursosPorVencer.length,
      vigentes: 0,
      sinFecha: 0,
      total: cursosUnicos.length
    };

    // Calcular vigentes y sin fecha
    cursosUnicos.forEach((curso: any) => {
      const estado = getEstadoDocumento(curso);
      if (estado === 'vigente') {
        contadores.vigentes++;
      } else if (estado === 'sin_fecha') {
        contadores.sinFecha++;
      }
    });

    return contadores;
  };

  const contadoresDocumentos = calcularContadoresDocumentos();
  const contadoresCursos = calcularContadoresCursos();
  const isLoading = isLoadingVencidos || isLoadingPorVencer;

  return {
    contadoresDocumentos,
    contadoresCursos,
    isLoading,
    error: null,
    refetch: () => {
      // Refetch both queries
      documentosVencidosQuery.refetch();
      documentosPorVencerQuery.refetch();
    },
  };
};
