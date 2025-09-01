// Configuración de la API
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: 'Sistema de Gestión de Personal',
  VERSION: '1.0.0',
  DESCRIPTION: 'Frontend para el sistema de gestión de personal',
};

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_PAGE_SIZE: 100,
};

// Configuración de validación
export const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  RUT_REGEX: /^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1}$/,
};

// Configuración de rutas
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PERSONAL: '/personal',
  EMPRESAS: '/empresas',
  SERVICIOS: '/servicios',
};

// Configuración de roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

// Configuración de estados
export const STATUS = {
  ACTIVE: 'activo',
  INACTIVE: 'inactivo',
} as const;

// Configuración de días de la semana
export const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

// Configuración de horarios
export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
] as const;

// Configuración de mensajes de error
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  UNAUTHORIZED: 'No tienes permisos para acceder a este recurso.',
  FORBIDDEN: 'Acceso denegado.',
  NOT_FOUND: 'Recurso no encontrado.',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde.',
  VALIDATION_ERROR: 'Los datos ingresados no son válidos.',
  UNKNOWN_ERROR: 'Ha ocurrido un error inesperado.',
} as const;

// Configuración de mensajes de éxito
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Inicio de sesión exitoso.',
  REGISTER_SUCCESS: 'Registro exitoso.',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente.',
  CREATE_SUCCESS: 'Registro creado exitosamente.',
  UPDATE_SUCCESS: 'Registro actualizado exitosamente.',
  DELETE_SUCCESS: 'Registro eliminado exitosamente.',
} as const;

// Configuración de colores
export const COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb',
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#1e3a8a',
  },
  SECONDARY: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#059669',
    600: '#047857',
    700: '#065f46',
    800: '#064e3b',
    900: '#064e3b',
  },
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
} as const;
