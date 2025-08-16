// src/context/AuthContext.jsx

import React, { createContext, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // El estado ahora solo sirve para saber si el usuario está logueado o no en la app.
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const navigate = useNavigate();
  const location = useLocation();

  // ***** ESTE useEffect YA NO ES NECESARIO *****
  // El interceptor en api.js se encargará de esto.
  /*
  useEffect(() => {
    if (authToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    }
  }, [authToken]);
  */

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.token) {
      const { token } = response.data;
      localStorage.setItem('authToken', token);
      setAuthToken(token);
      
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    // ***** ESTA LÍNEA YA NO ES NECESARIA *****
    // No es necesario borrar la cabecera, ya que el interceptor no la añadirá si el token no existe.
    // delete api.defaults.headers.common['Authorization'];
    navigate('/admin/login');
  };

  const value = { authToken, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};