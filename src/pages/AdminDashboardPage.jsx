// src/pages/AdminDashboardPage.jsx
import React, { useState } from 'react';
import ReservasManager from '../components/ReservasManager';
import SociosManager from '../components/SociosManager';
import DashboardView from '../components/DashboardView';
import CuponesManager from '../components/CuponesManager'; // Importar CuponesManager
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Mantener dashboard como inicial si se prefiere

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
        <button
          className={`tab-button ${activeTab === 'cupones' ? 'active' : ''}`}
          onClick={() => setActiveTab('cupones')}
        >
          Gestión de Cupones
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'reservas' && <ReservasManager />}
        {activeTab === 'socios' && <SociosManager />}
        {activeTab === 'cupones' && <CuponesManager />}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
