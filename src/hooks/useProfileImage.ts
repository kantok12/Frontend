import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
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
        const result = await apiService.getProfileImage(rut);
        return result;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // No hay imagen de perfil, esto es normal - no loguear error
          return null;
        }
        throw err;
      }
    },
    enabled: !!rut,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error: any) => {
      // No reintentar si es 404 (no hay imagen) o si ya hemos intentado 1 vez
      if (error?.response?.status === 404 || failureCount >= 1) {
        return false;
      }
      return true;
    },
    retryDelay: 1000,
    onError: (error: any) => {
      // Solo loguear errores que no sean 404
      if (error.response?.status !== 404) {
        console.error('❌ Error al obtener imagen de perfil:', error);
      }
    }
  });

  // Mutation para subir imagen
  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadProfileImage(rut, file),
    onSuccess: (result: any) => {
      // Actualizar la imagen local inmediatamente
      if (result.data?.profile_image_url) {
        setProfileImage(result.data.profile_image_url);
      }
      // Invalidar la query para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['profile-image', rut] });
    },
    onError: (error: any) => {
      console.error('❌ Error al subir imagen:', error);
      setError(error.message || 'Error al subir imagen');
    }
  });

  // Mutation para eliminar imagen
  const deleteImageMutation = useMutation({
    mutationFn: () => apiService.deleteProfileImage(rut),
    onSuccess: () => {
      setProfileImage(null);
      queryClient.invalidateQueries({ queryKey: ['profile-image', rut] });
    },
    onError: (error: any) => {
      console.error('❌ Error al eliminar imagen:', error);
      setError(error.message || 'Error al eliminar imagen');
    }
  });

  // Actualizar la imagen local cuando cambien los datos
  useEffect(() => {
    if (profileImageData?.data?.profile_image_url) {
      setProfileImage(profileImageData.data.profile_image_url);
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
