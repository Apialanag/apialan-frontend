// src/components/ReservasManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import EditReservationModal from './EditReservationModal';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale'; // Import specific locale
import { parse, format } from 'date-fns'; // Import parse and format
import 'react-datepicker/dist/react-datepicker.css';
import useDebounce from '../hooks/useDebounce';

registerLocale('es', es);

function ReservasManager() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState(null);
  const [fechaFinFiltro, setFechaFinFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busquedaFiltro, setBusquedaFiltro] = useState('');
  const debouncedBusqueda = useDebounce(busquedaFiltro, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);

  const formatearFechaParaAPI = (date) => date ? date.toISOString().split('T')[0] : null;

  const fetchReservas = useCallback(async (pageToFetch) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        fecha_inicio: formatearFechaParaAPI(fechaInicioFiltro),
        fecha_fin: formatearFechaParaAPI(fechaFinFiltro),
        estado: estadoFiltro,
        busqueda: debouncedBusqueda,
        page: pageToFetch,
        limit: 10,
      };
      
      Object.keys(params).forEach(key => (params[key] === null || params[key] === '') && delete params[key]);
      
      const response = await api.get('/admin/reservas', { params });
      
      // Sort reservations by fecha_reserva ascending (closest first)
      const sortedReservas = response.data.reservas.sort((a, b) => {
        const dateA = parse(a.fecha_reserva, 'yyyy-MM-dd', new Date());
        const dateB = parse(b.fecha_reserva, 'yyyy-MM-dd', new Date());
        return dateA - dateB;
      });

      setReservas(sortedReservas);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);

    } catch (err) {
      console.error("Error al obtener las reservas de admin:", err);
      setError('No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  }, [estadoFiltro, debouncedBusqueda, fechaInicioFiltro, fechaFinFiltro]);

  useEffect(() => {
    if (currentPage === 1) {
        fetchReservas(1);
    } else {
        setCurrentPage(1);
    }
  }, [debouncedBusqueda, estadoFiltro, fechaInicioFiltro, fechaFinFiltro]);

  useEffect(() => {
    fetchReservas(currentPage);
  }, [currentPage, fetchReservas]);


  const handleClearFilters = () => {
    setFechaInicioFiltro(null);
    setFechaFinFiltro(null);
    setEstadoFiltro('');
    setBusquedaFiltro('');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const getPaginationItems = () => {
    const items = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) items.push('...');
      if (currentPage > 2) items.push(currentPage - 1);
      if (currentPage !== 1 && currentPage !== totalPages) items.push(currentPage);
      if (currentPage < totalPages - 1) items.push(currentPage + 1);
      if (currentPage < totalPages - 2) items.push('...');
      items.push(totalPages);
    }
    return [...new Set(items)];
  };

  const handleOpenEditModal = (reserva) => { setEditingReservation(reserva); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingReservation(null); };
  const handleUpdateReservation = (updatedReserva) => { 
    setReservas(reservas.map(reserva => reserva.id === updatedReserva.id ? updatedReserva : reserva)); 
  };
  // const formatearFecha = (fechaISO) => { const opciones = { year: 'numeric', month: 'long', day: 'numeric' }; return new Date(fechaISO).toLocaleDateString('es-CL', opciones); };
  const formatearFecha = (fechaISO) => {
    // Assuming fechaISO is 'YYYY-MM-DD'
    try {
      const date = parse(fechaISO, 'yyyy-MM-dd', new Date());
      return format(date, 'PPP', { locale: es }); // 'PPP' is a long date format, e.g., "1 de ene. de 2023"
    } catch (e) {
      console.error("Error parsing date:", fechaISO, e);
      return fechaISO; // Fallback to original string if parsing fails
    }
  };
  
  const handleCancelReserva = async (reservaId) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar la reserva con ID ${reservaId}?`)) return;
    try { 
      await api.delete(`/reservas/${reservaId}`); 
      fetchReservas(currentPage);
    } catch (err) { 
      console.error(`Error al cancelar la reserva ${reservaId}:`, err); 
      setError(`Error al cancelar la reserva: ${err.response?.data?.error || 'Error del servidor'}`);
    } 
  };
  
  if (loading) return <p>Cargando reservas...</p>;

  return (
    <> 
      <p>Filtra las reservas por fecha, estado o cliente.</p>
      {error && <p className="mensaje-error">{error}</p>}
      <div className="filtros-container">
          <div className="filtro-item filtro-busqueda">
            <label htmlFor="busqueda">Buscar:</label>
            <input
              type="text"
              id="busqueda"
              placeholder="Nombre o email del cliente..."
              value={busquedaFiltro}
              onChange={(e) => setBusquedaFiltro(e.target.value)}
              className="filtro-input"
            />
          </div>
          <div className="filtro-item">
            <label htmlFor="estado">Estado:</label>
            <select id="estado" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="filtro-select">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="pagado">Pagado</option>
              <option value="cancelada_por_admin">Cancelada (Admin)</option>
              <option value="cancelada_por_cliente">Cancelada (Cliente)</option>
            </select>
          </div>
          <div className="filtro-item">
            <label htmlFor="fecha-inicio">Desde:</label>
            <DatePicker id="fecha-inicio" selected={fechaInicioFiltro} onChange={(date) => setFechaInicioFiltro(date)} selectsStart startDate={fechaInicioFiltro} endDate={fechaFinFiltro} locale="es" dateFormat="dd/MM/yyyy" placeholderText="Fecha de inicio" isClearable />
          </div>
          <div className="filtro-item">
            <label htmlFor="fecha-fin">Hasta:</label>
            <DatePicker id="fecha-fin" selected={fechaFinFiltro} onChange={(date) => setFechaFinFiltro(date)} selectsEnd startDate={fechaInicioFiltro} endDate={fechaFinFiltro} minDate={fechaInicioFiltro} locale="es" dateFormat="dd/MM/yyyy" placeholderText="Fecha de fin" isClearable />
          </div>
          <div className="filtro-acciones">
            <button onClick={handleClearFilters} className="boton-secundario">Limpiar Filtros</button>
          </div>
      </div>
      <div className="reservas-table-container">
          <table className="reservas-table">
            <thead>
              <tr><th>ID</th><th>Salón</th><th>Cliente</th><th>Email</th><th>Fecha</th><th>Horario</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {reservas.length > 0 ? (
                reservas.map(reserva => (
                  <tr key={reserva.id} className={reserva.estado_reserva.includes('cancelada') ? 'fila-cancelada' : ''}>
                    <td>{reserva.id}</td><td>{reserva.nombre_espacio}</td><td>{reserva.cliente_nombre}</td><td>{reserva.cliente_email}</td><td>{formatearFecha(reserva.fecha_reserva)}</td><td>{reserva.hora_inicio.substring(0, 5)} - {reserva.hora_termino.substring(0, 5)}</td>
                    <td><span className={`status-badge status-${reserva.estado_reserva}`}>{reserva.estado_reserva.replace(/_/g, ' ')}</span></td>
                    <td><button onClick={() => handleOpenEditModal(reserva)} className="action-button edit">Editar</button><button onClick={() => handleCancelReserva(reserva.id)} className="action-button cancel" disabled={reserva.estado_reserva.includes('cancelada')}>Cancelar</button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No hay reservas que coincidan con los filtros seleccionados.</td></tr>
              )}
            </tbody>
          </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination-container">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn arrow">Anterior</button>
            {getPaginationItems().map((item, index) =>
              typeof item === 'number' ? (
                <button key={index} onClick={() => handlePageChange(item)} className={`pagination-btn number ${currentPage === item ? 'active' : ''}`}>{item}</button>
              ) : ( <span key={index} className="pagination-ellipsis">{item}</span> )
            )}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn arrow">Siguiente</button>
        </div>
      )}
      {isModalOpen && (<EditReservationModal reserva={editingReservation} onClose={handleCloseModal} onUpdate={handleUpdateReservation} />)}
    </>
  );
}

export default ReservasManager;
