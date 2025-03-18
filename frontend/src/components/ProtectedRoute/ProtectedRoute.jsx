import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  try {
    const decoded = jwtDecode(token);
    if (requiredRole && decoded.role !== requiredRole) {
      // Si le rôle n'est pas celui requis, rediriger vers le profil
      return <Navigate to="/profile" />;
    }
  } catch (error) {
    console.error('Erreur de décodage du token:', error);
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;
