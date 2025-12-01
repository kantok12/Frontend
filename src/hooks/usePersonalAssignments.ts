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
    // Don't clear assignedPersonal immediately to avoid UI flicker
    setAssignmentState(prev => ({ ...prev, assignedError: null, assignedLoading: true }));
    
    if (!selectedCartera && !selectedCliente && !selectedNodo) {
      setAssignmentState(prev => ({ ...prev, assignedPersonal: null, assignedLoading: false }));
      return;
    }
    
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
        console.log('🔍 [ASIGNACIÓN] Asignando a nodo:', {
          rut: assignmentState.selectedRutToAssign.trim(),
          nodoId: selectedNodo.id,
          nodoNombre: selectedNodo.nombre
        });
        await apiService.assignNodoToPersona(assignmentState.selectedRutToAssign.trim(), selectedNodo.id);
        console.log('✅ [ASIGNACIÓN] Nodo asignado exitosamente');
      } else if (selectedCliente) {
        console.log('🔍 [ASIGNACIÓN] Iniciando asignación de cliente:', {
          rut: assignmentState.selectedRutToAssign.trim(),
          clienteId: selectedCliente.id,
          clienteNombre: selectedCliente.nombre
        });
        
        // Verificar requisitos ANTES de asignar
        console.log('📋 [ASIGNACIÓN] Verificando prerrequisitos...');
        const match = await apiService.matchPrerequisitosCliente(
          selectedCliente.id, 
          assignmentState.selectedRutToAssign.trim()
        );
        const validacion = (match as any)?.data || match;
        const faltantes = validacion?.faltantes || [];
        
        console.log('📊 [ASIGNACIÓN] Resultado de validación:', {
          faltantes: faltantes.length,
          cumple: validacion?.cumple,
          validacionCompleta: validacion
        });
        
        if (faltantes.length > 0) {
          console.warn('⚠️ [ASIGNACIÓN] Persona no cumple requisitos, faltantes:', faltantes);
          // Retornar información de prerrequisitos faltantes
          setAssignmentState(prev => ({ ...prev, assigning: false }));
          return { hasPrereqIssues: true, prereqData: validacion };
        }
        
        console.log('✅ [ASIGNACIÓN] Prerrequisitos OK, llamando a API de asignación...');
        try {
          await apiService.assignClienteToPersona(assignmentState.selectedRutToAssign.trim(), selectedCliente.id);
          console.log('✅ [ASIGNACIÓN] Asignación exitosa');
        } catch (assignError: any) {
          console.error('❌ [ASIGNACIÓN] Error del backend:', {
            status: assignError?.response?.status,
            statusText: assignError?.response?.statusText,
            mensaje: assignError?.response?.data?.message || assignError?.message,
            data: assignError?.response?.data,
            url: assignError?.config?.url,
            method: assignError?.config?.method
          });
          throw assignError;
        }
      } else if (selectedCartera) {
        console.log('🔍 [ASIGNACIÓN] Asignando a cartera:', {
          rut: assignmentState.selectedRutToAssign.trim(),
          carteraId: selectedCartera.id,
          carteraNombre: selectedCartera.nombre
        });
        await apiService.assignCarteraToPersona(assignmentState.selectedRutToAssign.trim(), selectedCartera.id);
        console.log('✅ [ASIGNACIÓN] Cartera asignada exitosamente');
      }
      
      setAssignmentState(prev => ({ ...prev, selectedRutToAssign: '' }));
      onSuccess?.();
    } catch (e: any) {
      console.error('❌ [ASIGNACIÓN] Error capturado en handleAssign:', {
        mensaje: e?.message,
        response: e?.response,
        completo: e
      });
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
