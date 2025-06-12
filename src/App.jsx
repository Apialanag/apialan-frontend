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

  // --- INICIO DEL CÓDIGO DE DEPURACIÓN ---
  // Esta variable contendrá la URL de la API que Vercel está usando, o un mensaje de error.
  const apiUrlForDebug = import.meta.env.VITE_API_URL || "¡¡¡VARIABLE NO DEFINIDA!!!";
  // --- FIN DEL CÓDIGO DE DEPURACIÓN ---

  return (
    <div className="App">
      {/* --- INICIO DEL BANNER DE DEPURACIÓN --- */}
      {/* Este banner amarillo solo lo usaremos para encontrar el error. Luego lo podemos borrar. */}
      <div style={{ 
        backgroundColor: 'yellow', 
        color: 'black', 
        padding: '10px', 
        textAlign: 'center', 
        fontWeight: 'bold', 
        position: 'sticky', 
        top: 0, 
        width: '100%', 
        zIndex: 9999 
      }}>
        URL de API en uso (Debug): {apiUrlForDebug}
      </div>
      {/* --- FIN DEL BANNER DE DEPURACIÓN --- */}

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
