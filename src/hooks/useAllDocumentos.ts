import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { usePersonalList } from './usePersonal';

// Hook para obtener todos los documentos de todas las personas
export const useAllDocumentos = () => {
  // Query para documentos vencidos
  const documentosVencidosQuery = useQuery({
    queryKey: ['documentos', 'vencidos', 'all'],
    queryFn: () => apiService.getDocumentosVencidos(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para documentos por vencer
  const documentosPorVencerQuery = useQuery({
    queryKey: ['documentos', 'por-vencer', 'all'],
    queryFn: () => apiService.getDocumentosPorVencer(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const documentosVencidos = documentosVencidosQuery.data;
  const documentosPorVencer = documentosPorVencerQuery.data;
  const isLoadingVencidos = documentosVencidosQuery.isLoading;
  const isLoadingPorVencer = documentosPorVencerQuery.isLoading;

  // Obtener lista de personal para enriquecer los documentos con nombres
  const { data: personalData } = usePersonalList(1, 1000, ''); // Obtener todos los personal

  // Combinar todos los documentos y eliminar duplicados
  const todosDocumentos = React.useMemo(() => {
    const vencidos = documentosVencidos?.data || [];
    const porVencer = documentosPorVencer?.data || [];
    const personalList = personalData?.data?.items || [];
    
    // Combinar ambas listas
    const combinados = [...vencidos, ...porVencer];
    
    // Eliminar duplicados por ID
    const documentosUnicos = combinados.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    );

    // Agregar información de estado calculado y enriquecer con datos del personal
    return documentosUnicos.map((documento: any) => {
      const hoy = new Date();
      const fechaVencimiento = documento.fecha_vencimiento ? new Date(documento.fecha_vencimiento) : null;
      
      let estado = 'sin_fecha';
      let diasRestantes = null;
      
      if (fechaVencimiento) {
        const diffTime = fechaVencimiento.getTime() - hoy.getTime();
        diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diasRestantes < 0) {
          estado = 'vencido';
        } else if (diasRestantes <= 30) {
          estado = 'por_vencer';
        } else {
          estado = 'vigente';
        }
      }

      // Buscar información del personal por RUT
      const personalInfo = personalList.find((persona: any) => persona.rut === documento.rut_persona);

      return {
        ...documento,
        estado_calculado: estado,
        dias_restantes: diasRestantes,
        fecha_vencimiento_formateada: fechaVencimiento ? fechaVencimiento.toLocaleDateString('es-ES') : 'Sin fecha',
        fecha_emision_formateada: documento.fecha_emision ? new Date(documento.fecha_emision).toLocaleDateString('es-ES') : 'Sin fecha',
        personal: personalInfo ? {
          nombres: `${personalInfo.nombre || ''} ${personalInfo.apellido || ''}`.trim(),
          cargo: personalInfo.cargo,
          rut: personalInfo.rut
        } : null
      };
    });
  }, [documentosVencidos, documentosPorVencer, personalData]);

  const isLoading = isLoadingVencidos || isLoadingPorVencer;

  return {
    documentos: todosDocumentos,
    isLoading,
    error: null,
    refetch: () => {
      // Refetch both queries
      documentosVencidosQuery.refetch();
      documentosPorVencerQuery.refetch();
    },
  };
};
