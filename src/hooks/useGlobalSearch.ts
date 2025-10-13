import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Personal, Cliente, Nodo, Cartera } from '../types';

export interface SearchResult {
  personal: Personal[];
  clientes: Cliente[];
  nodos: Nodo[];
  carteras: Cartera[];
}

export interface GlobalSearchResult {
  query: string;
  results: SearchResult;
  totalResults: number;
  isLoading: boolean;
  error: Error | null;
}

export const useGlobalSearch = (query: string, enabled: boolean = true) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce la búsqueda para evitar demasiadas llamadas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: async (): Promise<SearchResult> => {
      if (!debouncedQuery.trim()) {
        return {
          personal: [],
          clientes: [],
          nodos: [],
          carteras: []
        };
      }

      try {
        // Realizar búsqueda en paralelo en todos los endpoints
        const [personal, clientes, nodos, carteras] = await Promise.all([
          apiService.searchPersonalGlobal(debouncedQuery),
          apiService.searchClientesGlobal(debouncedQuery),
          apiService.searchNodosGlobal(debouncedQuery),
          apiService.searchCarterasGlobal(debouncedQuery)
        ]);

        return {
          personal: personal || [],
          clientes: clientes || [],
          nodos: nodos || [],
          carteras: carteras || []
        };
      } catch (error) {
        console.error('Error en búsqueda global:', error);
        throw error;
      }
    },
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  const totalResults = useMemo(() => {
    if (!searchQuery.data) return 0;
    return (
      searchQuery.data.personal.length +
      searchQuery.data.clientes.length +
      searchQuery.data.nodos.length +
      searchQuery.data.carteras.length
    );
  }, [searchQuery.data]);

  return {
    query: debouncedQuery,
    results: searchQuery.data || {
      personal: [],
      clientes: [],
      nodos: [],
      carteras: []
    },
    totalResults,
    isLoading: searchQuery.isLoading,
    error: searchQuery.error as Error | null,
    isSuccess: searchQuery.isSuccess,
    isError: searchQuery.isError
  };
};
