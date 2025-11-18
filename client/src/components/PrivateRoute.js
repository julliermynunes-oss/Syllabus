import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const normalizedRole = (user.role || 'professor').toLowerCase();
    const normalizedAllowed = allowedRoles.map(role => role.toLowerCase());
    if (!normalizedAllowed.includes(normalizedRole)) {
      return <Navigate to="/syllabi" replace />;
    }
  }

  return children;
};

export default PrivateRoute;

