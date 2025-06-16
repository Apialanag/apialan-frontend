// src/pages/AdminDashboardPage.jsx
import React, { useState } from 'react';
import ReservasManager from '../components/ReservasManager'; // Componente para la lógica de reservas
import SociosManager from '../components/SociosManager';   // Nuevo componente para la lógica de socios
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  // Estado para controlar qué pestaña está activa ('reservas' o 'socios')
  const [activeTab, setActiveTab] = useState('reservas');

  return (
    <div className="admin-dashboard">
      <h2>Panel de Administración</h2>
      
      {/* Contenedor de las pestañas */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'reservas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservas')}
        >
          Gestión de Reservas
        </button>
        <button
          className={`tab-button ${activeTab === 'socios' ? 'active' : ''}`}
          onClick={() => setActiveTab('socios')}
        >
          Gestión de Socios
        </button>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="tab-content">
        {activeTab === 'reservas' && <ReservasManager />}
        {activeTab === 'socios' && <SociosManager />}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
