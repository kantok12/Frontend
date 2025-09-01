import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import apiService from '../services/api';
import { LoginForm, RegisterForm, ExtendedRegisterForm } from '../types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { 
    user, 
    token, 
    isAuthenticated, 
    isLoading, 
    error,
    login: loginStore, 
    logout: logoutStore, 
    setLoading, 
    setError, 
    clearError 
  } = useAuthStore();

  // Query para obtener usuario actual
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiService.getCurrentUser(),
    enabled: false, // Deshabilitamos la consulta automática
    retry: false,
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginForm) => apiService.login(credentials),
    onSuccess: (response) => {
      if (response.success && response.data) {
        loginStore(response.data.user, response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    },
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: (userData: RegisterForm) => apiService.register(userData),
    onSuccess: (response) => {
      if (response.success && response.data) {
        loginStore(response.data.user, response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al registrar usuario');
    },
  });

  // Mutation para registro con personal disponible
  const registerWithPersonalMutation = useMutation({
    mutationFn: (userData: ExtendedRegisterForm) => apiService.registerWithPersonalDisponible(userData),
    onSuccess: (response) => {
      if (response.success && response.data) {
        loginStore(response.data.user, response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al registrar usuario y datos de personal');
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      logoutStore();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    },
    onError: () => {
      // Aún así hacemos logout local
      logoutStore();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    },
  });

  const login = (credentials: LoginForm) => {
    setLoading(true);
    clearError();
    loginMutation.mutate(credentials);
  };

  const register = (userData: RegisterForm) => {
    setLoading(true);
    clearError();
    registerMutation.mutate(userData);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || registerWithPersonalMutation.isPending,
    error,
    login,
    register,
    registerWithPersonal: registerWithPersonalMutation.mutate,
    logout,
    clearError,
  };
};
