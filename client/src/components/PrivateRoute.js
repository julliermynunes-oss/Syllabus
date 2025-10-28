import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;

