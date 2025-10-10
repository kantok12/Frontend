import React, { useState, useEffect } from 'react';
import { FallbackService } from '../../services/fallbackService';

interface DemoModeBannerProps {
  onBackendStatusChange?: (isBackendAvailable: boolean) => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onBackendStatusChange }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [showBanner, setShowBanner] = useState<boolean>(true);

  useEffect(() => {
    const checkBackendStatus = async () => {
      setIsChecking(true);
      const isBackendHealthy = await FallbackService.isBackendHealthy();
      setIsDemoMode(!isBackendHealthy);
      setIsChecking(false);
      
      // Notificar al componente padre sobre el estado del backend
      if (onBackendStatusChange) {
        onBackendStatusChange(isBackendHealthy);
      }
    };

    checkBackendStatus();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, [onBackendStatusChange]);

  const handleRetryConnection = async () => {
    setIsChecking(true);
    const isBackendHealthy = await FallbackService.forceBackendCheck();
    setIsDemoMode(!isBackendHealthy);
    setIsChecking(false);
    
    if (onBackendStatusChange) {
      onBackendStatusChange(isBackendHealthy);
    }
  };

  if (!showBanner) {
    return null;
  }

  if (isChecking) {
    return (
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
          <p className="font-medium">Verificando conexión con el servidor...</p>
        </div>
      </div>
    );
  }

  if (isDemoMode) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Modo Demo Activo</p>
              <p className="text-sm">El servidor backend no está disponible. Se están mostrando datos de demostración.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRetryConnection}
              disabled={isChecking}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
            >
              {isChecking ? 'Verificando...' : 'Reintentar'}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="font-medium">Conexión con Backend Establecida</p>
          <p className="text-sm">El sistema está funcionando con datos reales del servidor.</p>
        </div>
      </div>
    </div>
  );
};
