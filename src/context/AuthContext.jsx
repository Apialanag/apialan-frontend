// src/context/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  const login = async (email, password) => {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email,
      password,
    });
    const token = response.data.token;
    localStorage.setItem('token', token); // Guardar token en el almacenamiento local
    setAuthToken(token);
    navigate('/admin/dashboard'); // Redirigir al dashboard después del login
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    navigate('/admin/login'); // Redirigir a la página de login
  };

  const value = {
    authToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
