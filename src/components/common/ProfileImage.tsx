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
        <div 
          className="h-full w-full rounded-full"
          style={{
            backgroundImage: `url(${profileImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          title={`Foto de ${nombre} ${apellido}`}
        />
      ) : (
        <User className={`${iconSizes[size]} text-primary-600`} />
      )}
    </div>
  );
};

export default ProfileImage;

