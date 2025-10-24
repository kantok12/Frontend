import { usePersonalList } from './usePersonal';
import { Personal } from '../types';

// Hook simple para compatibilidad con componentes de programación
export const usePersonalConDocumentacion = () => {
  const personalQuery = usePersonalList(1, 1000, '');
  
  const personalConDocumentacion: Personal[] = personalQuery.data?.data?.items || [];
  const totalPersonal: number = personalQuery.data?.data?.total || 0;
  
  return {
    ...personalQuery,
    totalPersonal,
    personalConDocumentacion
  };
};
