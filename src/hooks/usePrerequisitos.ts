import { useState, useCallback } from 'react';
import apiService from '../services/api';

interface PrereqState {
  selectedRutForMatch: string;
  prereqLoading: boolean;
  prereqError: string | null;
  prereqData: any | null;
}

export const usePrerequisitos = () => {
  const [prereqState, setPrereqState] = useState<PrereqState>({
    selectedRutForMatch: '',
    prereqLoading: false,
    prereqError: null,
    prereqData: null
  });

  const loadPrerequisitosMatch = useCallback(async (
    selectedCliente: any,
    rut?: string
  ) => {
    const rutToUse = rut || prereqState.selectedRutForMatch;
    if (!selectedCliente || !rutToUse) return;
    
    setPrereqState(prev => ({ ...prev, prereqLoading: true, prereqError: null }));
    try {
      const res = await apiService.matchPrerequisitosCliente(selectedCliente.id, rutToUse);
      setPrereqState(prev => ({ 
        ...prev, 
        prereqData: res.data,
        selectedRutForMatch: rutToUse
      }));
    } catch (e: any) {
      setPrereqState(prev => ({ 
        ...prev, 
        prereqError: e?.message || 'Error al cargar prerrequisitos' 
      }));
    } finally {
      setPrereqState(prev => ({ ...prev, prereqLoading: false }));
    }
  }, [prereqState.selectedRutForMatch]);

  const updatePrereqState = useCallback((updates: Partial<PrereqState>) => {
    setPrereqState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    prereqState,
    loadPrerequisitosMatch,
    updatePrereqState
  };
};
