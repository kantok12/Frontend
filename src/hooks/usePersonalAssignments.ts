import { useState, useCallback } from 'react';
import apiService from '../services/api';

interface PersonalAssignment {
  rut: string;
  nombre?: string;
}

interface AssignmentState {
  assignedPersonal: PersonalAssignment[] | null;
  assignedLoading: boolean;
  assignedError: string | null;
  selectedRutToAssign: string;
  personSearch: string;
  assigning: boolean;
  unassigningRut: string | null;
}

export const usePersonalAssignments = () => {
  const [assignmentState, setAssignmentState] = useState<AssignmentState>({
    assignedPersonal: null,
    assignedLoading: false,
    assignedError: null,
    selectedRutToAssign: '',
    personSearch: '',
    assigning: false,
    unassigningRut: null
  });

  const loadAssignedPersonal = useCallback(async (
    selectedCartera: any,
    selectedCliente: any,
    selectedNodo: any
  ) => {
    setAssignmentState(prev => ({ ...prev, assignedError: null, assignedPersonal: null }));
    if (!selectedCartera && !selectedCliente && !selectedNodo) return;
    
    setAssignmentState(prev => ({ ...prev, assignedLoading: true }));
    try {
      let res: any;
      if (selectedNodo) {
        res = await apiService.getPersonalByNodo(selectedNodo.id);
      } else if (selectedCliente) {
        res = await apiService.getPersonalByCliente(selectedCliente.id);
      } else if (selectedCartera) {
        res = await apiService.getPersonalByCartera(selectedCartera.id);
      }
      setAssignmentState(prev => ({ ...prev, assignedPersonal: res?.data as PersonalAssignment[] }));
    } catch (e: any) {
      setAssignmentState(prev => ({ 
        ...prev, 
        assignedError: e?.message || 'Error al cargar asignaciones' 
      }));
    } finally {
      setAssignmentState(prev => ({ ...prev, assignedLoading: false }));
    }
  }, []);

  const handleAssign = useCallback(async (
    selectedCartera: any,
    selectedCliente: any,
    selectedNodo: any,
    onSuccess?: () => void
  ) => {
    if (!assignmentState.selectedRutToAssign.trim()) return;
    
    setAssignmentState(prev => ({ ...prev, assigning: true }));
    try {
      if (selectedNodo) {
        await apiService.assignNodoToPersona(assignmentState.selectedRutToAssign.trim(), selectedNodo.id);
      } else if (selectedCliente) {
        // Verificar requisitos ANTES de asignar
        const match = await apiService.matchPrerequisitosCliente(
          selectedCliente.id, 
          assignmentState.selectedRutToAssign.trim()
        );
        const validacion = (match as any)?.data || match;
        const faltantes = validacion?.faltantes || [];
        
        if (faltantes.length > 0) {
          // Retornar información de prerrequisitos faltantes
          setAssignmentState(prev => ({ ...prev, assigning: false }));
          return { hasPrereqIssues: true, prereqData: validacion };
        }
        
        // Usar el wrapper seguro que normaliza 201/409 en un formato consistente
        const safeResp: any = await apiService.assignClienteToPersonaSafe(assignmentState.selectedRutToAssign.trim(), selectedCliente.id);
        if (!safeResp?.ok) {
          // Normalizar payload para la UI: puede venir como payload, data o directamente como objeto
          const payload = safeResp?.payload || safeResp?.data || safeResp;
          setAssignmentState(prev => ({ ...prev, assigning: false }));
          return { hasPrereqIssues: true, prereqData: payload };
        }
      } else if (selectedCartera) {
        await apiService.assignCarteraToPersona(assignmentState.selectedRutToAssign.trim(), selectedCartera.id);
      }
      
      setAssignmentState(prev => ({ ...prev, selectedRutToAssign: '' }));
      onSuccess?.();
    } catch (e: any) {
      throw new Error(e?.message || 'Error al asignar');
    } finally {
      setAssignmentState(prev => ({ ...prev, assigning: false }));
    }
  }, [assignmentState.selectedRutToAssign]);

  const handleUnassign = useCallback(async (
    rut: string,
    selectedCartera: any,
    selectedCliente: any,
    selectedNodo: any,
    onSuccess?: () => void
  ) => {
    if (!rut) return;
    
    setAssignmentState(prev => ({ ...prev, unassigningRut: rut }));
    try {
      if (selectedNodo) {
        await apiService.unassignNodoFromPersona(rut, selectedNodo.id);
      } else if (selectedCliente) {
        await apiService.unassignClienteFromPersona(rut, selectedCliente.id);
      } else if (selectedCartera) {
        await apiService.unassignCarteraFromPersona(rut, selectedCartera.id);
      }
      onSuccess?.();
    } catch (e: any) {
      throw new Error(e?.message || 'Error al desasignar');
    } finally {
      setAssignmentState(prev => ({ ...prev, unassigningRut: null }));
    }
  }, []);

  const updateAssignmentState = useCallback((updates: Partial<AssignmentState>) => {
    setAssignmentState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    assignmentState,
    loadAssignedPersonal,
    handleAssign,
    handleUnassign,
    updateAssignmentState
  };
};
