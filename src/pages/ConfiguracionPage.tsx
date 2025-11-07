import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  Calendar, 
  Clock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Save,
  Edit3,
  X,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useProfileImage } from '../hooks/useProfileImage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ConfiguracionPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hook para manejar imagen de perfil
  const { 
    profileImage, 
    loading: profileImageLoading, 
    error: profileImageError, 
    uploadImage, 
    deleteImage, 
    isUploading, 
    isDeleting 
  } = useProfileImage(user?.rut || '');

  // Inicializar formData cuando se carga el usuario
  React.useEffect(() => {
    if (user) {
      setFormData({
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email
      });
    }
  }, [user]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const capitalizarTexto = (texto: string) => {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  };

  const getRolUsuario = (cargo: string | null | undefined) => {
    if (!cargo) {
      return { rol: 'Usuario', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
    
    const cargoLower = cargo.toLowerCase();
    if (cargoLower.includes('admin') || cargoLower.includes('administrador')) {
      return { rol: 'Administrador', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    } else if (cargoLower.includes('encargado') || cargoLower.includes('supervisor')) {
      return { rol: 'Encargado', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    } else if (cargoLower.includes('tecnico') || cargoLower.includes('técnico')) {
      return { rol: 'Técnico', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    } else if (cargoLower.includes('operador')) {
      return { rol: 'Operador', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    } else {
      return { rol: 'Usuario', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  const handleSave = () => {
    // Aquí implementarías la lógica para guardar los cambios
    console.log('Guardando cambios:', formData);
    setIsEditing(false);
    // TODO: Implementar llamada al API para actualizar usuario
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email
      });
    }
    setIsEditing(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadImage(file);
        alert('Imagen de perfil actualizada exitosamente');
      } catch (error: any) {
        alert(`Error al subir imagen: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const handleRemoveImage = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar la imagen de perfil?')) {
      try {
        await deleteImage();
        alert('Imagen de perfil eliminada exitosamente');
      } catch (error: any) {
        alert(`Error al eliminar imagen: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Safety: stringify unknown error for rendering
  const errorText: string | null = (() => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    const anyErr = error as any;
    if (anyErr?.message) return String(anyErr.message);
    try {
      return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch (e) {
      return String(error);
    }
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar información</h2>
            <p className="text-gray-600 mb-4">No se pudo obtener la información del usuario.</p>
            {errorText && (
              <div className="w-full mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm text-red-700">
                <strong>Detalle:</strong>
                <pre className="whitespace-pre-wrap text-xs mt-2">{errorText}</pre>
              </div>
            )}
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Configuración de Usuario</h1>
                  <p className="text-gray-600">Información de tu cuenta</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foto de Perfil */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Camera className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Foto de Perfil</h2>
          </div>

          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div
                onClick={handleImageClick}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity border-4 border-white shadow-lg"
              >
                {profileImageLoading ? (
                  <div className="animate-pulse">
                    <User className="h-12 w-12 text-white" />
                  </div>
                ) : profileImage ? (
                  <img
                    src={profileImage}
                    alt="Foto de perfil"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
              
              {/* Botón de editar */}
              <button
                onClick={handleImageClick}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg"
                title="Cambiar foto"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Información y botones */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {capitalizarTexto(user.nombres)} {capitalizarTexto(user.apellidos)}
              </h3>
              <p className="text-gray-600 mb-4">{user.email}</p>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => { console.log('ConfiguracionPage - abrir selector de archivo'); handleImageClick(); }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{isUploading ? 'Subiendo...' : 'Subir Foto'}</span>
                </button>
                
                {profileImage && (
                  <button
                    onClick={handleRemoveImage}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
              </p>
              
              {profileImageError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    <strong>Error de imagen de perfil:</strong> {profileImageError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Input oculto para seleccionar archivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Información del Usuario */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Editar</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombres */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nombres</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{capitalizarTexto(user.nombres)}</span>
                </div>
              )}
            </div>

            {/* Apellidos */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Apellidos</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{capitalizarTexto(user.apellidos)}</span>
                </div>
              )}
            </div>

            {/* RUT */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">RUT</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 font-medium">{user.rut}</span>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información Laboral */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Información Laboral</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rol del Usuario */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rol del Usuario</label>
              {(() => {
                const rolInfo = getRolUsuario(user.cargo);
                return (
                  <div className={`flex items-center space-x-3 p-3 ${rolInfo.bgColor} rounded-lg border ${rolInfo.borderColor}`}>
                    <Briefcase className={`h-5 w-5 ${rolInfo.color}`} />
                    <div>
                      <span className={`font-medium block ${rolInfo.color}`}>{rolInfo.rol}</span>
                      <span className="text-sm text-gray-500">{capitalizarTexto(user.cargo || 'Sin cargo asignado')}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Información de Actividad */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Actividad de la Cuenta</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha de Creación */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  {formatearFecha(user.fecha_creacion)}
                </span>
              </div>
            </div>

            {/* Último Acceso */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Último Acceso</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  {formatearFecha(user.ultimo_acceso)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

