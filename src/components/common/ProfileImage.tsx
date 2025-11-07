import React from 'react';
import { User } from 'lucide-react';
import { useProfileImage } from '../../hooks/useProfileImage';
import { API_CONFIG } from '../../config/api';

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
  const [imageError, setImageError] = React.useState(false);
  const imageUrl = profileImage || `${API_CONFIG.BASE_URL}/personal/${encodeURIComponent(rut)}/image/download`;

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
      ) : !imageError && imageUrl ? (
        <img
          src={imageUrl}
          alt={`Foto de ${nombre} ${apellido}`}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <User className={`${iconSizes[size]} text-primary-600`} />
      )}
    </div>
  );
};

export default ProfileImage;

