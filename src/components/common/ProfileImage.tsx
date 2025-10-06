import React from 'react';
import { User } from 'lucide-react';
import { useProfileImage } from '../../hooks/useProfileImage';

interface ProfileImageProps {
  rut: string;
  nombre: string;
  apellido: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({ 
  rut, 
  nombre, 
  apellido, 
  size = 'md',
  className = ''
}) => {
  const { profileImage, loading } = useProfileImage(rut);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ${className}`}>
      {loading ? (
        <div className="animate-pulse">
          <User className={`${iconSizes[size]} text-primary-600`} />
        </div>
      ) : profileImage ? (
        <img 
          src={profileImage} 
          alt={`Foto de ${nombre} ${apellido}`}
          className="h-full w-full object-cover rounded-full"
          onError={(e) => {
            // Si la imagen falla al cargar, ocultar y mostrar el ícono por defecto
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const icon = document.createElement('div');
              icon.className = `flex items-center justify-center h-full w-full`;
              icon.innerHTML = `<svg class="${iconSizes[size]} text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`;
              parent.appendChild(icon);
            }
          }}
        />
      ) : (
        <User className={`${iconSizes[size]} text-primary-600`} />
      )}
    </div>
  );
};

export default ProfileImage;

