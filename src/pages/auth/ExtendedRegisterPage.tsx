import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, User, Shirt, Building } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEstados } from '../../hooks/useEstados';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ExtendedRegisterForm } from '../../types';

const extendedRegisterSchema = z.object({
  // Datos de usuario
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  
  // Datos de personal disponible (obligatorios)
  rut: z.string().min(9, 'RUT debe tener al menos 9 caracteres').max(12, 'RUT no debe exceder 12 caracteres'),
  sexo: z.enum(['M', 'F'], { required_error: 'Debe seleccionar el sexo' }),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  licencia_conducir: z.string().min(1, 'La licencia de conducir es requerida'),
  cargo: z.string().min(1, 'El cargo es requerido'),
  estado_id: z.number().min(1, 'Debe seleccionar un estado'),
  
  // Datos opcionales
  telefono: z.string().optional(),
  zona_geografica: z.string().optional(),
  talla_zapatos: z.string().optional(),
  talla_pantalones: z.string().optional(),
  talla_poleras: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const ExtendedRegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { registerWithPersonal, isAuthenticated, isLoading, error } = useAuth();
  const { data: estadosData, isLoading: estadosLoading } = useEstados();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch
  } = useForm<ExtendedRegisterForm>({
    resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      sexo: 'M',
      estado_id: 1 // Estado "Activo" por defecto
    }
  });

  const onSubmit = (data: ExtendedRegisterForm) => {
    registerWithPersonal(data);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof ExtendedRegisterForm)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['nombre', 'apellido', 'email', 'password', 'confirmPassword'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['rut', 'sexo', 'fecha_nacimiento', 'cargo', 'licencia_conducir'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registro de Personal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Completa tu información personal y laboral
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-4 mb-8">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 w-12 rounded-full ${
                currentStep >= step ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Error general */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Datos de cuenta */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Datos de Cuenta
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="nombre"
                  label="Nombre"
                  {...register('nombre')}
                  error={errors.nombre?.message}
                  placeholder="Tu nombre"
                />
                <Input
                  id="apellido"
                  label="Apellido"
                  {...register('apellido')}
                  error={errors.apellido?.message}
                  placeholder="Tu apellido"
                />
              </div>

              <Input
                id="email"
                type="email"
                label="Email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="tu@email.com"
              />

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Contraseña"
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirmar Contraseña"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Datos personales */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Información Personal
              </h3>

              <Input
                id="rut"
                label="RUT"
                {...register('rut')}
                error={errors.rut?.message}
                placeholder="12.345.678-9"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo *
                  </label>
                  <select
                    {...register('sexo')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.sexo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                  {errors.sexo && (
                    <p className="mt-1 text-xs text-red-600">{errors.sexo.message}</p>
                  )}
                </div>

                <Input
                  id="fecha_nacimiento"
                  type="date"
                  label="Fecha de Nacimiento"
                  {...register('fecha_nacimiento')}
                  error={errors.fecha_nacimiento?.message}
                />
              </div>

              <Input
                id="cargo"
                label="Cargo"
                {...register('cargo')}
                error={errors.cargo?.message}
                placeholder="Ej: Ingeniero, Técnico, etc."
              />

              <Input
                id="licencia_conducir"
                label="Licencia de Conducir"
                {...register('licencia_conducir')}
                error={errors.licencia_conducir?.message}
                placeholder="Ej: B, A1, C, etc."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                {estadosLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <select
                    {...register('estado_id', { valueAsNumber: true })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.estado_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {estadosData?.data?.map((estado: any) => (
                      <option key={estado.id} value={estado.id}>
                        {estado.nombre}
                      </option>
                    ))}
                  </select>
                )}
                {errors.estado_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.estado_id.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Información adicional */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Shirt className="h-5 w-5 mr-2" />
                Información Adicional (Opcional)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="telefono"
                  type="tel"
                  label="Teléfono"
                  {...register('telefono')}
                  error={errors.telefono?.message}
                  placeholder="+56 9 1234 5678"
                />

                <Input
                  id="zona_geografica"
                  label="Zona Geográfica"
                  {...register('zona_geografica')}
                  error={errors.zona_geografica?.message}
                  placeholder="Ej: RM, V Región"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  id="talla_zapatos"
                  label="Talla Zapatos"
                  {...register('talla_zapatos')}
                  error={errors.talla_zapatos?.message}
                  placeholder="Ej: 42"
                />

                <Input
                  id="talla_pantalones"
                  label="Talla Pantalones"
                  {...register('talla_pantalones')}
                  error={errors.talla_pantalones?.message}
                  placeholder="Ej: L, 32"
                />

                <Input
                  id="talla_poleras"
                  label="Talla Poleras"
                  {...register('talla_poleras')}
                  error={errors.talla_poleras?.message}
                  placeholder="Ej: M, L"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600">
                  <strong>Información:</strong> Esta información adicional es opcional 
                  pero puede ser útil para la asignación de equipos y uniformes.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between space-x-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isLoading}
              >
                Anterior
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isLoading}
                className="ml-auto"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="ml-auto"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Registrando...</span>
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
