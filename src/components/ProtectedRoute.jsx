// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { authToken } = useAuth();
  const location = useLocation();

  if (!authToken) {
    // Si no hay token, redirigir al usuario a la página de login.
    // Le pasamos la ubicación actual para que, después de iniciar sesión,
    // pueda ser redirigido de vuelta a la página que intentaba acceder.
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Si hay un token, renderiza el componente hijo que está protegiendo (ej: el dashboard).
  return children;
}

export default ProtectedRoute;
