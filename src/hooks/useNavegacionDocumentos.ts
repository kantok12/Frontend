import { useNavigate } from 'react-router-dom';
import { usePersonalList } from './usePersonal';

// Hook global para navegación a documentos de personal
export const useNavegacionDocumentos = () => {
  const navigate = useNavigate();

  // Función para navegar a documentos de una persona desde cualquier página
  const navegarADocumentos = async (personalId: string, rutPersona: string) => {
    console.log('🔗 [HOOK] Navegando a documentos de:', { personalId, rutPersona });
    console.log('🔍 [HOOK] Tipo de personalId:', typeof personalId, 'Valor:', personalId);
    console.log('🔍 [HOOK] Tipo de rutPersona:', typeof rutPersona, 'Valor:', rutPersona);
    console.log('🔍 [HOOK] Página actual:', window.location.pathname);
    
    // Disparar evento personalizado para que el listener global lo maneje
    const event = new CustomEvent('openPersonalDetailModal', {
      detail: { 
        personalId, 
        rutPersona,
        // Agregar información adicional para debug
        timestamp: new Date().toISOString(),
        source: 'notificaciones'
      }
    });
    console.log('📡 [HOOK] Disparando evento personalizado:', event.detail);
    window.dispatchEvent(event);
  };

  return {
    navegarADocumentos
  };
};
