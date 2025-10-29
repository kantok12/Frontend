import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

export interface CurrentUser {
  id: number;
  rut: string;
  nombres: string;
  apellidos: string;
  email: string;
  cargo: string;
  cartera_id: number;
  cartera_nombre: string;
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso: string;
  profile_image_url?: string;
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiService.getCurrentUser();
      return response.data as CurrentUser;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

