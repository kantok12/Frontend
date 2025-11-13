import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ExtendedRegisterPage } from './pages/auth/ExtendedRegisterPage';

// Main Pages (eager)
import { DashboardPage } from './pages/DashboardPage';
import { PersonalPage } from './pages/PersonalPage';
import { EstadoDocumentacionPage } from './pages/EstadoDocumentacionPage';
import CalendarioPage from './pages/CalendarioPage';
import { ServiciosPage } from './pages/ServiciosPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';

// Lazy: multi-upload page
const MultiUploadPage = lazy(() => import('./pages/MultiUploadPage'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public Routes - Authentication Required */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Extended Registration Route for Personal Disponible */}
      <Route
        path="/register-personal"
        element={
          <PublicRoute>
            <ExtendedRegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/personal"
        element={
          <ProtectedRoute>
            <PersonalPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/personal/multi-upload"
        element={
          <ProtectedRoute>
            <Suspense fallback={<div className="p-8"><LoadingSpinner /></div>}>
              <MultiUploadPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/estado-documentacion"
        element={
          <ProtectedRoute>
            <EstadoDocumentacionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendario"
        element={
          <ProtectedRoute>
            <CalendarioPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/servicios"
        element={
          <ProtectedRoute>
            <ServiciosPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <ConfiguracionPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 route */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-4">Página no encontrada</p>
              <a href="/dashboard" className="text-primary-600 hover:text-primary-500">Volver al Dashboard</a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
