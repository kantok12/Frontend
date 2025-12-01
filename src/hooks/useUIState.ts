import { useState, useCallback } from 'react';

type Tab = 'carteras' | 'clientes' | 'nodos' | 'belray' | 'prerrequisitos';

interface UIState {
  activeTab: Tab;
  page: number;
  search: string;
  showAgregarClienteModal: boolean;
  showAgregarNodoModal: boolean;
  showPrereqPanel: boolean;
  showModal: boolean;
  showPrerrequisitosModal: boolean;
  showGlobalPrerrequisitosModal: boolean;
  showPrerrequisitosParcialesModal: boolean;
}

export const useUIState = () => {
  const [uiState, setUiState] = useState<UIState>({
    activeTab: 'carteras',
    page: 1,
    search: '',
    showAgregarClienteModal: false,
    showAgregarNodoModal: false,
    showPrereqPanel: false,
    showModal: false,
    showPrerrequisitosModal: false,
    showGlobalPrerrequisitosModal: false
    , showPrerrequisitosParcialesModal: false
  });

  const handleTabChange = useCallback((tab: Tab) => {
    setUiState(prev => ({ ...prev, activeTab: tab, page: 1, search: '' }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setUiState(prev => ({ ...prev, page }));
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    setUiState(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const handleSearchClear = useCallback(() => {
    setUiState(prev => ({ ...prev, search: '', page: 1 }));
  }, []);

  const handleModalToggle = useCallback((modal: keyof Pick<UIState, 'showAgregarClienteModal' | 'showAgregarNodoModal' | 'showPrereqPanel' | 'showModal' | 'showPrerrequisitosModal' | 'showGlobalPrerrequisitosModal' | 'showPrerrequisitosParcialesModal'>, show: boolean) => {
    setUiState(prev => ({ ...prev, [modal]: show }));
  }, []);

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    uiState,
    handleTabChange,
    handlePageChange,
    handleSearchChange,
    handleSearchClear,
    handleModalToggle,
    updateUIState
  };
};
