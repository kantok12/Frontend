// Configuración de la API
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api', // Usar proxy en desarrollo
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
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
