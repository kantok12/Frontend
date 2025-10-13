import { useQuery } from '@tanstack/react-query';
import { usePersonalList } from './usePersonal';
import { useAllDocumentos } from './useAllDocumentos';

// Tipos de documentos requeridos para acreditación completa
const DOCUMENTOS_REQUERIDOS = [
  'certificado_curso',
  'certificado_medico',
  'licencia_conducir',
  'certificado_seguridad'
];

// Función para verificar si un personal tiene documentación completa y vigente
const verificarDocumentacionCompleta = (rut: string, todosDocumentos: any[]) => {
  // Obtener todos los documentos de la persona
  const documentosPersona = todosDocumentos.filter(doc => doc.rut_persona === rut);
  
  // Verificar que tenga todos los documentos requeridos
  const documentosRequeridosPresentes = DOCUMENTOS_REQUERIDOS.every(tipoRequerido => 
    documentosPersona.some(doc => doc.tipo_documento === tipoRequerido)
  );
  
  if (!documentosRequeridosPresentes) {
    return {
      tieneDocumentacionCompleta: false,
      razon: 'Faltan documentos requeridos',
      documentosFaltantes: DOCUMENTOS_REQUERIDOS.filter(tipoRequerido => 
        !documentosPersona.some(doc => doc.tipo_documento === tipoRequerido)
      )
    };
  }
  
  // Verificar que todos los documentos estén vigentes (no vencidos)
  const documentosVencidos = documentosPersona.filter(doc => 
    doc.estado_calculado === 'vencido'
  );
  
  if (documentosVencidos.length > 0) {
    return {
      tieneDocumentacionCompleta: false,
      razon: 'Tiene documentos vencidos',
      documentosVencidos: documentosVencidos.map(doc => ({
        tipo: doc.tipo_documento,
        nombre: doc.nombre_documento,
        fechaVencimiento: doc.fecha_vencimiento_formateada
      }))
    };
  }
  
  // Verificar que no tenga documentos por vencer (opcional, dependiendo de la política)
  const documentosPorVencer = documentosPersona.filter(doc => 
    doc.estado_calculado === 'por_vencer'
  );
  
  if (documentosPorVencer.length > 0) {
    return {
      tieneDocumentacionCompleta: false,
      razon: 'Tiene documentos por vencer',
      documentosPorVencer: documentosPorVencer.map(doc => ({
        tipo: doc.tipo_documento,
        nombre: doc.nombre_documento,
        fechaVencimiento: doc.fecha_vencimiento_formateada,
        diasRestantes: doc.dias_restantes
      }))
    };
  }
  
  return {
    tieneDocumentacionCompleta: true,
    razon: 'Documentación completa y vigente',
    documentosVigentes: documentosPersona.filter(doc => 
      doc.estado_calculado === 'vigente'
    ).length
  };
};

export const usePersonalConDocumentacion = () => {
  // Obtener todos los personal
  const { data: personalData, isLoading: isLoadingPersonal } = usePersonalList(1, 1000, '');
  
  // Obtener todos los documentos
  const { documentos: todosDocumentos, isLoading: isLoadingDocumentos } = useAllDocumentos();
  
  // Filtrar personal con documentación completa y vigente
  const personalConDocumentacion = useQuery({
    queryKey: ['personal', 'con-documentacion'],
    queryFn: () => {
      const personalList = personalData?.data?.items || [];
      const documentosList = todosDocumentos || [];
      
      console.log('🔍 Verificando documentación para', personalList.length, 'personas');
      console.log('📋 Total de documentos disponibles:', documentosList.length);
      
      const personalFiltrado = personalList.filter((persona: any) => {
        const verificacion = verificarDocumentacionCompleta(persona.rut, documentosList);
        
        if (verificacion.tieneDocumentacionCompleta) {
          console.log(`✅ ${persona.nombre} ${persona.apellido} (${persona.rut}): ${verificacion.razon}`);
        } else {
          console.log(`❌ ${persona.nombre} ${persona.apellido} (${persona.rut}): ${verificacion.razon}`);
        }
        
        return verificacion.tieneDocumentacionCompleta;
      });
      
      console.log(`📊 Personal con documentación completa: ${personalFiltrado.length} de ${personalList.length}`);
      
      return personalFiltrado;
    },
    enabled: !isLoadingPersonal && !isLoadingDocumentos && !!personalData && !!todosDocumentos,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
  
  return {
    data: personalConDocumentacion.data || [],
    isLoading: isLoadingPersonal || isLoadingDocumentos || personalConDocumentacion.isLoading,
    error: personalConDocumentacion.error,
    totalPersonal: personalData?.data?.items?.length || 0,
    personalConDocumentacion: personalConDocumentacion.data?.length || 0
  };
};

// Hook para obtener el estado de documentación de una persona específica
export const useEstadoDocumentacionPersona = (rut: string) => {
  const { documentos: todosDocumentos, isLoading } = useAllDocumentos();
  
  const estadoDocumentacion = useQuery({
    queryKey: ['documentacion', 'persona', rut],
    queryFn: () => {
      if (!todosDocumentos) return null;
      return verificarDocumentacionCompleta(rut, todosDocumentos);
    },
    enabled: !isLoading && !!todosDocumentos && !!rut,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
  
  return {
    data: estadoDocumentacion.data,
    isLoading: isLoading || estadoDocumentacion.isLoading,
    error: estadoDocumentacion.error
  };
};
