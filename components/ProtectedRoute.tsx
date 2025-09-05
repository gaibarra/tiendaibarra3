
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
        <div className="text-center py-16">
            <p className="text-lg text-gray-500">Verificando sesión...</p>
        </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Basic mode: cualquier usuario autenticado pasa.

  return children;
};

export default ProtectedRoute;