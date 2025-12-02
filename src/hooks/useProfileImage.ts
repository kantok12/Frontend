import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { API_CONFIG } from '../config/api';
import { ProfileImageResponse } from '../types';

export const useProfileImage = (rut: string) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query para obtener la imagen de perfil
  const { data: profileImageData, isLoading: isLoadingImage, refetch: refetchImage } = useQuery<ProfileImageResponse | null>({
    queryKey: ['profile-image', rut],
    queryFn: async (): Promise<ProfileImageResponse | null> => {
      if (!rut) return null;
      try {
        // Primero intentar endpoint más nuevo /profile-photos/:rut/image
        try {
          const res = await apiService.getProfilePhoto(rut);
          return res;
        } catch (err: any) {
          // Si falla con 404 o no existe, fallback al endpoint /personal/:rut/image
          if (err?.response?.status === 404) {
            // intentar endpoint legacy
            const legacy = await apiService.getProfileImage(rut);
            return legacy;
          }
          // Propagar otros errores
          throw err;
        }
      } catch (err: any) {
        if (err.response?.status === 404 || err.name === 'SilentError') {
          return null;
        }
        throw err;
      }
    },
    enabled: !!rut,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404 || error?.name === 'SilentError' || failureCount >= 1) {
        return false;
      }
      return true;
    },
    retryDelay: 1000,
    onError: (error: any) => {
      if (error.response?.status !== 404 && error.name !== 'SilentError') {
        console.error('❌ Error al obtener imagen de perfil:', error);
      }
    }
  });

  // Mutation para subir imagen
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // Intentar endpoint alternativo /profile-photos primero
      try {
        return await apiService.uploadProfilePhoto(rut, file);
      } catch (err: any) {
        // Fallback a /personal/:rut/upload
        return await apiService.uploadProfileImage(rut, file);
      }
    },
    onSuccess: (result: any) => {
      // Actualizar la imagen local inmediatamente
      if (result.data?.profile_image_url) {
        setProfileImage(result.data.profile_image_url);
      }
      // Invalidar la query para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['profile-image', rut] });
      try {
        const ev = new CustomEvent('personalUpdated', { detail: { id: rut, rut, nombre: null, updated: result } });
        window.dispatchEvent(ev);
      } catch (err) {
        // ignore
      }
    },
    onError: (error: any) => {
      console.error('❌ Error al subir imagen:', error);
      setError(error.message || 'Error al subir imagen');
    }
  });

  // Mutation para eliminar imagen
  const deleteImageMutation = useMutation({
    mutationFn: async () => {
      try {
        return await apiService.deleteProfilePhoto(rut);
      } catch (err: any) {
        return await apiService.deleteProfileImage(rut);
      }
    },
    onSuccess: () => {
      setProfileImage(null);
      queryClient.invalidateQueries({ queryKey: ['profile-image', rut] });
      try {
        const ev = new CustomEvent('personalUpdated', { detail: { id: rut, rut, nombre: null, updated: null } });
        window.dispatchEvent(ev);
      } catch (err) {
        // ignore
      }
    },
    onError: (error: any) => {
      console.error('❌ Error al eliminar imagen:', error);
      setError(error.message || 'Error al eliminar imagen');
    }
  });

  // Actualizar la imagen local cuando cambien los datos
  useEffect(() => {
    if (profileImageData?.data?.profile_image_url) {
      let url = profileImageData.data.profile_image_url;

      // Normalizar URL: si la API devuelve una ruta relativa (p.e. "/uploads/.."),
      // convertirla a absoluta apuntando al host API (sin el sufijo /api).
      try {
        const isAbsolute = /^https?:\/\//i.test(url);
        if (!isAbsolute) {
          // API_CONFIG.BASE_URL suele ser 'http://host:port/api' — quitar '/api' si existe
          const base = API_CONFIG.BASE_URL.replace(/\/api\/?$/i, '');
          // Evitar duplicar slashes
          url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
        }
      } catch (e) {
        // En caso de error al normalizar, usar la URL tal cual
        console.warn('⚠️ Error normalizando profile_image_url:', e);
      }

      setProfileImage(url);
    } else {
      setProfileImage(null);
    }
  }, [profileImageData]);

  // Función para subir imagen con validación
  const uploadImage = async (file: File) => {
    setError(null);
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = 'Solo se permiten imágenes: JPG, PNG, GIF, WEBP';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errorMsg = 'La imagen no puede ser mayor a 5MB';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const result = await uploadImageMutation.mutateAsync(file);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Función para eliminar imagen
  const deleteImage = async () => {
    setError(null);
    try {
      await deleteImageMutation.mutateAsync();
    } catch (error) {
      throw error;
    }
  };

  // Función para refrescar datos
  const refetch = () => {
    refetchImage();
  };

  return {
    profileImage,
    loading: isLoadingImage || uploadImageMutation.isLoading || deleteImageMutation.isLoading,
    error,
    uploadImage,
    deleteImage,
    refetch,
    isUploading: uploadImageMutation.isLoading,
    isDeleting: deleteImageMutation.isLoading
  };
};

// Función utilitaria para validar archivos de imagen
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Solo se permiten imágenes: JPG, PNG, GIF, WEBP'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'La imagen no puede ser mayor a 5MB'
    };
  }

  return { isValid: true };
};

// Función utilitaria para formatear tamaño de archivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
