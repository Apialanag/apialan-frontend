// src/App.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { authToken, logout } = useAuth();

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>APIALAN AG</h1>
        </Link>
        <nav>
          {authToken ? (
            <>
              <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>
                Panel Admin
              </Link>
              <button onClick={logout} className="boton-logout">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link to="/admin/login" style={{ color: 'white', textDecoration: 'none' }}>
              Acceso Admin
            </Link>
          )}
        </nav>
      </header>

      <main className="App-main">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="App-footer">
        <p>APIALAN AG - Galería Colón 454, segundo piso.</p>
        <p>Horario: Lunes a Viernes: 10:00 - 19:00 hrs</p>
      </footer>
    </div>
  );
}

export default App;

