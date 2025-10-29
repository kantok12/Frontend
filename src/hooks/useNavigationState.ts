import { useState, useCallback } from 'react';
import { Cartera, Cliente, Nodo } from '../types';

interface NavigationState {
  selectedCartera: Cartera | null;
  selectedCliente: Cliente | null;
  selectedNodo: Nodo | null;
}

export const useNavigationState = () => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    selectedCartera: null,
    selectedCliente: null,
    selectedNodo: null
  });

  const handleCarteraClick = useCallback((cartera: Cartera) => {
    setNavigationState({
      selectedCartera: cartera,
      selectedCliente: null,
      selectedNodo: null
    });
  }, []);

  const handleClienteClick = useCallback((cliente: Cliente) => {
    setNavigationState(prev => ({
      ...prev,
      selectedCliente: cliente,
      selectedNodo: null
    }));
  }, []);

  const handleNodoClick = useCallback((nodo: Nodo) => {
    setNavigationState(prev => ({
      ...prev,
      selectedNodo: nodo
    }));
  }, []);

  const handleBackToCarteras = useCallback(() => {
    setNavigationState({
      selectedCartera: null,
      selectedCliente: null,
      selectedNodo: null
    });
  }, []);

  const handleBackToClientes = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      selectedCliente: null,
      selectedNodo: null
    }));
  }, []);

  const updateNavigationState = useCallback((updates: Partial<NavigationState>) => {
    setNavigationState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    navigationState,
    handleCarteraClick,
    handleClienteClick,
    handleNodoClick,
    handleBackToCarteras,
    handleBackToClientes,
    updateNavigationState
  };
};
