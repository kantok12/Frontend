// Configuración de la API
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://192.168.10.194:3000/api', // URL directa al backend
  TIMEOUT: 60000, // Timeout de 60 segundos para archivos grandes (hasta 100MB)
  RETRY_ATTEMPTS: 3,
  DEMO_MODE: process.env.REACT_APP_DEMO_MODE === 'true' || false, // Modo demo
};

// Configuración de CORS
export const CORS_CONFIG = {
  credentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Configuración de autenticación
export const AUTH_CONFIG = {
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutos
};

// Configuración del modo demo
export const DEMO_CONFIG = {
  ENABLED: true, // Cambiar a false cuando tengas backend
  MOCK_DELAY: 500, // Simular delay de red
};

// Configuración de archivos
export const FILE_CONFIG = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB en bytes
  MAX_SIZE_MB: 100, // 100MB para mostrar al usuario
  UPLOAD_TIMEOUT: 120000, // 2 minutos para uploads grandes
  SUPPORTED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ],
  SUPPORTED_EXTENSIONS: [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.jpg', '.jpeg', '.png', '.gif', '.txt', '.zip', '.rar'
  ]
};
