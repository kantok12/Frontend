// Configuración de la API
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api', // URL directa al backend
  TIMEOUT: 30000, // Aumentar timeout a 30 segundos
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
