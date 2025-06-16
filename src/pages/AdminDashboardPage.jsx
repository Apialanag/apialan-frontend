// src/pages/AdminDashboardPage.jsx
import React, { useState } from 'react';
import ReservasManager from '../components/ReservasManager';
import SociosManager from '../components/SociosManager';
import DashboardView from '../components/DashboardView'; // <-- 1. Importa el nuevo componente del dashboard
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  // 2. La pestaña inicial ahora es 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="admin-dashboard">
      <h2>Panel de Administración</h2>
      
      <div className="tabs-container">
        {/* 3. Botón para la nueva pestaña de Estadísticas */}
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Estadísticas
        </button>
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

      {/* 4. Muestra el componente del dashboard cuando la pestaña está activa */}
      <div className="tab-content">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'reservas' && <ReservasManager />}
        {activeTab === 'socios' && <SociosManager />}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
