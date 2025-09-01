import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ExtendedRegisterPage } from './pages/auth/ExtendedRegisterPage';

// Main Pages
import { DashboardPage } from './pages/DashboardPage';
import { PersonalPage } from './pages/PersonalPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { ServiciosPage } from './pages/ServiciosPage';

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
      {/* Public Routes - Demo Mode: Redirect to Dashboard */}
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Navigate to="/dashboard" replace />} />
      
      {/* Extended Registration Route for Personal Disponible */}
      <Route path="/register-personal" element={<ExtendedRegisterPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Placeholder routes for future pages */}
      <Route
        path="/personal"
        element={
          <ProtectedRoute>
            <PersonalPage />
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
              <a
                href="/dashboard"
                className="text-primary-600 hover:text-primary-500"
              >
                Volver al Dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
