import { useState, useCallback } from 'react';

interface UIState {
  activeTab: 'carteras' | 'clientes' | 'nodos';
  page: number;
  search: string;
  showAgregarClienteModal: boolean;
  showAgregarNodoModal: boolean;
  showPrereqPanel: boolean;
  showModal: boolean;
}

export const useUIState = () => {
  const [uiState, setUiState] = useState<UIState>({
    activeTab: 'carteras',
    page: 1,
    search: '',
    showAgregarClienteModal: false,
    showAgregarNodoModal: false,
    showPrereqPanel: false,
    showModal: false
  });

  const handleTabChange = useCallback((tab: 'carteras' | 'clientes' | 'nodos') => {
    setUiState(prev => ({ 
      ...prev, 
      activeTab: tab,
      page: 1,
      search: ''
    }));
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

  const handleModalToggle = useCallback((modal: keyof Pick<UIState, 'showAgregarClienteModal' | 'showAgregarNodoModal' | 'showPrereqPanel' | 'showModal'>, show: boolean) => {
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
