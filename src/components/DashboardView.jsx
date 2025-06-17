// src/components/DashboardView.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell // <-- Nuevos imports para el gráfico circular
} from 'recharts';

// Componente para una tarjeta de métrica individual (KPI)
const KpiCard = ({ title, value, currency = false }) => (
  <div className="kpi-card">
    <h3 className="kpi-title">{title}</h3>
    <p className="kpi-value">
      {currency ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value) : value}
    </p>
  </div>
);

// Colores para el gráfico circular
const PIE_COLORS = ['#4f46e5', '#B91C1C']; // Azul para Socios, Rojo para Público

function DashboardView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error("Error al obtener estadísticas:", err);
        setError('No se pudieron cargar las estadísticas.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p>Cargando estadísticas...</p>;
  if (error) return <p className="mensaje-error">{error}</p>;
  if (!stats) return <p>No hay datos disponibles.</p>;

  // Preparamos los datos para el gráfico circular, asegurando un orden consistente
  const pieChartData = [
    { name: 'Socio', value: 0 },
    { name: 'Público General', value: 0 }
  ];
  stats.graficos.reservasPorTipoCliente.forEach(item => {
    if (item.tipo === 'Socio') {
      pieChartData[0].value = item.cantidad;
    } else {
      pieChartData[1].value = item.cantidad;
    }
  });


  return (
    <div className="dashboard-view">
      {/* Contenedor para las tarjetas de KPIs (sin cambios) */}
      <div className="kpi-cards-container">
        <KpiCard title="Reservas de Hoy" value={stats.kpis.reservasHoy} />
        <KpiCard title="Ingresos del Mes Actual" value={stats.kpis.ingresosMesActual} currency={true} />
      </div>

      {/* Grid para los gráficos, ahora más grande */}
      <div className="charts-grid-full">
        <div className="chart-container">
          <h4>Ingresos (Últimos 6 Meses)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.graficos.ingresosUltimos6Meses} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => new Intl.NumberFormat('es-CL').format(value)} />
              <Legend />
              <Line type="monotone" dataKey="ingresos" stroke="#B91C1C" name="Ingresos" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Reservas por Salón</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.graficos.reservasPorSalon} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#4f46e5" name="N° de Reservas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- INICIO DE NUEVOS GRÁFICOS --- */}

        <div className="chart-container">
          <h4>Distribución por Tipo de Cliente</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Horas de Mayor Demanda</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.graficos.horasPico} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#0d9488" name="N° de Reservas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* --- FIN DE NUEVOS GRÁFICOS --- */}

      </div>
    </div>
  );
}

export default DashboardView;
