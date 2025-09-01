import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// Usuario demo por defecto
const demoUser: User = {
  id: 'demo-1',
  email: 'demo@gestor.com',
  nombre: 'Usuario',
  apellido: 'Demo',
  rol: 'admin',
  activo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const demoToken = 'demo-token-12345';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial - Demo autenticado
      user: demoUser,
      token: demoToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,

      // Acciones
      setUser: (user: User) => set({ user }),
      setToken: (token: string) => set({ token }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      
      login: (user: User, token: string) => 
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          error: null 
        }),
      
      logout: () => 
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          error: null 
        }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
