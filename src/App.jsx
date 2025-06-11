// src/App.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Importar useAuth para saber si está logueado
import './App.css';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute'; // Importar nuestro componente de ruta protegida

function App() {
  const { authToken, logout } = useAuth(); // Obtener el token y la función de logout del contexto

  return (
    // El BrowserRouter ya está en main.jsx, lo cual es correcto
    <div className="App">
      <header className="App-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>APIALAN AG</h1>
        </Link>
        <nav>
          {/* Mostramos un enlace u otro dependiendo de si el usuario está autenticado */}
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
          {/* Rutas Públicas */}
          <Route path="/" element={<BookingPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          
          {/* Ruta Protegida */}
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
