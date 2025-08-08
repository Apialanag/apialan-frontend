// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import logo from './assets/logoapialan2.png';

function App() {
  const { authToken, logout } = useAuth();
  const navigate = useNavigate();

  // 1. Estado para controlar la 'key' del componente de reserva.
  const [bookingKey, setBookingKey] = useState(0);

  // 2. Función para reiniciar el proceso de reserva.
  //    Incrementa la key, lo que fuerza a React a reinstanciar BookingPage.
  const handleResetBooking = () => {
    setBookingKey(prevKey => prevKey + 1);
    navigate('/'); // Navega a la página de inicio.
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* 3. El logo ahora es un div interactivo que llama a la función de reinicio. */}
        <div onClick={handleResetBooking} style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
          <img src={logo} alt="Logo de Apialan AG" className="app-logo" />
        </div>
        <nav>
          {authToken ? (
            <>
              <a href="/admin/dashboard" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>
                Panel Admin
              </a>
              <button onClick={logout} className="boton-logout">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <a href="/admin/login" style={{ color: 'white', textDecoration: 'none' }}>
              Acceso Admin
            </a>
          )}
        </nav>
      </header>

      <main className="App-main">
        <Routes>
          {/* 4. Se pasa la 'key' al componente BookingPage. */}
          <Route path="/" element={<BookingPage key={bookingKey} />} />
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
