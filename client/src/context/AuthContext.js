import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const ensureUserRole = (userData) => {
  if (!userData) return null;
  if (userData.role) return userData;
  return { ...userData, role: 'professor' };
};

const getStoredUser = () => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return null;
  try {
    const parsed = JSON.parse(savedUser);
    return ensureUserRole(parsed);
  } catch (error) {
    console.warn('Erro ao ler usuário salvo:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token');
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, [token]);

  const login = (userData, authToken) => {
    const normalizedUser = ensureUserRole(userData);
    setUser(normalizedUser);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

