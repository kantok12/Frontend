import { useQuery } from '@tanstack/react-query';
import { usePersonalList } from './usePersonal';
import { useAllDocumentos } from './useAllDocumentos';

// Tipos de documentos requeridos para acreditación completa (mismo que usePersonalConDocumentacion)
const DOCUMENTOS_REQUERIDOS = [
  'certificado_curso',
  'certificado_medico',
  'licencia_conducir',
  'certificado_seguridad'
];

// Función para verificar documentación completa (misma lógica que usePersonalConDocumentacion)
const verificarDocumentacionCompleta = (rut: string, todosDocumentos: any[]) => {
  const documentosPersona = todosDocumentos.filter(doc => doc.rut_persona === rut);
  
  // Verificar que tenga todos los documentos requeridos
  const documentosRequeridosPresentes = DOCUMENTOS_REQUERIDOS.every(tipoRequerido => 
    documentosPersona.some(doc => doc.tipo_documento === tipoRequerido)
  );
  
  if (!documentosRequeridosPresentes) {
    const documentosFaltantes = DOCUMENTOS_REQUERIDOS.filter(tipoRequerido => 
      !documentosPersona.some(doc => doc.tipo_documento === tipoRequerido)
    );
    return {
      tieneDocumentacionCompleta: false,
      razon: 'Faltan documentos requeridos',
      documentosFaltantes
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
  
  // Verificar que no tenga documentos por vencer
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

// Hook de debug para verificar documentación
export const useDebugDocumentacion = (rut?: string) => {
  // Obtener todos los personal
  const { data: personalData, isLoading: isLoadingPersonal } = usePersonalList(1, 1000, '');
  
  // Obtener todos los documentos
  const { documentos: todosDocumentos, isLoading: isLoadingDocumentos } = useAllDocumentos();
  
  const debugInfo = useQuery({
    queryKey: ['debug-documentacion', rut],
    queryFn: () => {
      const personalList = personalData?.data?.items || [];
      const documentosList = todosDocumentos || [];
      
      console.log('🔍 === DEBUG DOCUMENTACIÓN ===');
      console.log('📊 Total personal:', personalList.length);
      console.log('📋 Total documentos:', documentosList.length);
      
      // Si se especifica un RUT, mostrar solo esa persona
      if (rut) {
        const persona = personalList.find((p: any) => p.rut === rut);
        if (persona) {
          console.log(`👤 === PERSONA: ${persona.nombre} ${persona.apellido} (${persona.rut}) ===`);
          
          const documentosPersona = documentosList.filter((doc: any) => doc.rut_persona === rut);
          console.log(`📄 Documentos de ${persona.nombre}:`, documentosPersona.length);
          
          documentosPersona.forEach((doc: any, index: number) => {
            console.log(`  ${index + 1}. ${doc.tipo_documento} - ${doc.nombre_documento}`);
            console.log(`     Estado: ${doc.estado_calculado || 'No calculado'}`);
            console.log(`     Fecha vencimiento: ${doc.fecha_vencimiento_formateada || 'No especificada'}`);
          });
          
          // Verificar tipos únicos
          const tiposUnicos = Array.from(new Set(documentosPersona.map((doc: any) => doc.tipo_documento)));
          console.log(`🏷️ Tipos únicos de documentos:`, tiposUnicos);
          
          // Verificar documentación completa usando la misma lógica que usePersonalConDocumentacion
          const verificacion = verificarDocumentacionCompleta(rut, documentosList);
          console.log(`🔍 Verificación de documentación completa:`, verificacion);
          
          return {
            persona,
            documentos: documentosPersona,
            tiposUnicos,
            totalDocumentos: documentosPersona.length,
            verificacion
          };
        } else {
          console.log(`❌ No se encontró persona con RUT: ${rut}`);
          return null;
        }
      } else {
        // Mostrar información general
        console.log('📊 === INFORMACIÓN GENERAL ===');
        
        // Tipos únicos de documentos en todo el sistema
        const tiposUnicosSistema = Array.from(new Set(documentosList.map((doc: any) => doc.tipo_documento)));
        console.log('🏷️ Tipos únicos en el sistema:', tiposUnicosSistema);
        
        // Contar documentos por tipo
        const conteoPorTipo = tiposUnicosSistema.map(tipo => {
          const count = documentosList.filter((doc: any) => doc.tipo_documento === tipo).length;
          return { tipo, count };
        });
        console.log('📈 Conteo por tipo:', conteoPorTipo);
        
        // Personas con más documentos
        const personasConDocumentos = personalList.map((persona: any) => {
          const docs = documentosList.filter((doc: any) => doc.rut_persona === persona.rut);
          return {
            nombre: `${persona.nombre} ${persona.apellido}`,
            rut: persona.rut,
            totalDocumentos: docs.length,
            tipos: Array.from(new Set(docs.map((doc: any) => doc.tipo_documento)))
          };
        }).filter(p => p.totalDocumentos > 0).sort((a, b) => b.totalDocumentos - a.totalDocumentos);
        
        console.log('👥 Personas con documentos (ordenadas por cantidad):', personasConDocumentos);
        
        return {
          tiposUnicosSistema,
          conteoPorTipo,
          personasConDocumentos,
          totalPersonal: personalList.length,
          totalDocumentos: documentosList.length
        };
      }
    },
    enabled: !isLoadingPersonal && !isLoadingDocumentos && !!personalData && !!todosDocumentos,
    staleTime: 30 * 1000, // 30 segundos
  });
  
  return {
    data: debugInfo.data,
    isLoading: isLoadingPersonal || isLoadingDocumentos || debugInfo.isLoading,
    error: debugInfo.error
  };
};
