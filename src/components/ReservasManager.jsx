// src/components/ReservasManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import EditReservationModal from './EditReservationModal';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { parse, format, parseISO, format as formatDateFns } from 'date-fns'; // Asegúrate de tener format también si lo usas aparte
import 'react-datepicker/dist/react-datepicker.css';
import useDebounce from '../hooks/useDebounce';
import { CSVLink } from 'react-csv'; // Importar CSVLink

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
  const [modalInitialMode, setModalInitialMode] = useState('view'); // 'view' o 'edit'
  // const [csvData, setCsvData] = useState([]); // Se generarán al momento
  // const [csvHeaders, setCsvHeaders] = useState([]); // Se definirán en la función de exportación

  const formatearMonedaRedondeada = (valor) => {
    const numero = parseFloat(valor || 0);
    const redondeado = Math.round(numero);
    return `$${redondeado.toLocaleString('es-CL')}`;
  };

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
      
      console.log("API Response (first 5):", response.data.reservas.slice(0, 5).map(r => ({ id: r.id, fecha_reserva: r.fecha_reserva })));

      // Sort reservations by fecha_reserva ascending (closest first)
      const sortedReservas = response.data.reservas.sort((a, b) => {
        const dateA = parseISO(a.fecha_reserva); // Use parseISO for ISO 8601 strings
        const dateB = parseISO(b.fecha_reserva); // Use parseISO for ISO 8601 strings
        // Log individual comparisons for the first few items if needed for deeper debugging
        // if (response.data.reservas.indexOf(a) < 2 || response.data.reservas.indexOf(b) < 2) {
        //   console.log(`Comparing A: ${a.fecha_reserva} (parsed: ${dateA}) with B: ${b.fecha_reserva} (parsed: ${dateB}) -> Result: ${dateA - dateB}`);
        // }
        return dateA - dateB; // Sort ascending (earliest first)
      });

      console.log("Sorted Reservas (first 5):", sortedReservas.slice(0, 5).map(r => ({ id: r.id, fecha_reserva: r.fecha_reserva })));

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

  const escapeCsvCell = (cellData) => {
    if (cellData == null) { // Captura undefined y null
      return '';
    }
    const stringData = String(cellData);
    // Si contiene comas, saltos de línea o comillas dobles, encerrar entre comillas dobles
    // y duplicar las comillas dobles internas.
    if (stringData.includes(',') || stringData.includes('\n') || stringData.includes('"')) {
      return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
  };

  const handleExportCSV = () => {
    if (reservas.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const headers = [
      'ID Reserva', 'Salón', 'Cliente', 'Email Cliente', 'Teléfono Cliente',
      'Fecha Reserva', 'Hora Inicio', 'Hora Término',
      'Costo Neto', 'Costo IVA', 'Costo Total',
      'Estado Reserva', 'Estado Pago', 'Tipo Documento',
      'RUT Facturación', 'Razón Social', 'Giro', 'Dirección Facturación',
      'RUT Socio', 'Notas Adicionales', 'Fecha Creación'
    ];

    const dataRows = reservas.map(r => [
      r.id,
      r.nombre_espacio,
      r.cliente_nombre,
      r.cliente_email,
      r.cliente_telefono,
      r.fecha_reserva ? formatDateFns(parseISO(r.fecha_reserva), 'yyyy-MM-dd') : '', // Formato simple para CSV
      r.hora_inicio ? r.hora_inicio.substring(0,5) : '',
      r.hora_termino ? r.hora_termino.substring(0,5) : '',
      r.costo_neto_historico != null ? Math.round(parseFloat(r.costo_neto_historico)) : '',
      r.costo_iva_historico != null ? Math.round(parseFloat(r.costo_iva_historico)) : '',
      r.costo_total_historico != null ? Math.round(parseFloat(r.costo_total_historico)) : '',
      r.estado_reserva ? r.estado_reserva.replace(/_/g, ' ') : '',
      r.estado_pago ? r.estado_pago.replace(/_/g, ' ') : '',
      r.tipo_documento ? (r.tipo_documento.charAt(0).toUpperCase() + r.tipo_documento.slice(1)) : '',
      r.facturacion_rut,
      r.facturacion_razon_social,
      r.facturacion_giro,
      r.facturacion_direccion,
      r.rut_socio,
      r.notas_adicionales,
      r.fecha_creacion ? formatDateFns(parseISO(r.fecha_creacion), 'yyyy-MM-dd HH:mm:ss') : ''
    ].map(escapeCsvCell)); // Aplicar escape a cada celda

    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reservas_${formatDateFns(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert("La exportación CSV no es soportada en este navegador.");
    }
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

  // const handleOpenEditModal = (reserva) => { setEditingReservation(reserva); setIsModalOpen(true); };
  const handleOpenViewModal = (reserva) => {
    setEditingReservation(reserva);
    setModalInitialMode('view');
    setIsModalOpen(true);
  };

  const handleOpenEditStateModal = (reserva) => {
    setEditingReservation(reserva);
    setModalInitialMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReservation(null);
    // No es necesario resetear modalInitialMode aquí, se setea antes de abrir.
  };

  const handleUpdateReservation = (updatedReserva) => { 
    setReservas(reservas.map(reserva => reserva.id === updatedReserva.id ? updatedReserva : reserva)); 
  };
  // const formatearFecha = (fechaISO) => { const opciones = { year: 'numeric', month: 'long', day: 'numeric' }; return new Date(fechaISO).toLocaleDateString('es-CL', opciones); };
  const formatearFecha = (fechaISO) => {
    // fechaISO es un string como "2024-06-27T00:00:00.000Z"
    // El objetivo es mostrar la fecha "nominal" (2024-06-27) independientemente de la zona horaria del usuario
    // o de la parte horaria del string ISO.
    try {
      if (!fechaISO || typeof fechaISO !== 'string' || fechaISO.length < 10) {
        // Si fechaISO no es válido o es demasiado corto para ser YYYY-MM-DD...
        console.warn("formatearFecha recibió un valor de fechaISO inválido:", fechaISO);
        return "Fecha inválida";
      }
      // Tomamos solo la parte de la fecha (YYYY-MM-DD) del string ISO.
      const datePart = fechaISO.substring(0, 10);

      // Parseamos esta parte. `parse` interpretará 'yyyy-MM-dd' como medianoche local.
      // Esto es lo que queremos para que `format` luego muestre el día correcto
      // sin corrimientos por zona horaria desde UTC.
      const fechaNominal = parse(datePart, 'yyyy-MM-dd', new Date());

      return format(fechaNominal, 'PPP', { locale: es }); // 'PPP' es un formato largo, ej: "27 de jun. de 2024"
    } catch (e) {
      console.error("Error formatting date for display:", fechaISO, e);
      return fechaISO; // Fallback al string original si algo falla
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
          {/* ... otros filtros ... */}
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
            {/* El botón de exportar se añadirá aquí, pero sin usar CSVLink directamente en el JSX de renderizado.
                Se llamará a una función handleExportCSV que generará y descargará el archivo.
            */}
            <button
              onClick={() => handleExportCSV()} // Se creará esta función
              className="boton-principal export-csv-button"
              disabled={reservas.length === 0 || loading}
            >
              Exportar a CSV
            </button>
          </div>
      </div>
      <div className="reservas-table-container">
          <table className="reservas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Salón</th>
                <th>Cliente</th>
                <th>Email</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Subtotal Neto</th>
                <th>Descuento Cupón</th>
                <th>Neto Final</th>
                <th>IVA (19%)</th>
                <th>Total General</th>
                <th>Tipo Doc.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.length > 0 ? (
                reservas.map(reserva => (
                  <tr key={reserva.id} className={reserva.estado_reserva.includes('cancelada') ? 'fila-cancelada' : ''}>
                    <td>{reserva.id}</td>
                    <td>{reserva.nombre_espacio}</td>
                    <td>{reserva.cliente_nombre}</td>
                    <td>{reserva.cliente_email}</td>
                    <td>{formatearFecha(reserva.fecha_reserva)}</td>
                    <td>{reserva.hora_inicio.substring(0, 5)} - {reserva.hora_termino.substring(0, 5)}</td>
                    {/* Subtotal Neto */}
                    <td>{formatearMonedaRedondeada(reserva.costo_neto_historico)}</td>
                    {/* Descuento Cupón */}
                    <td>
                      {parseFloat(reserva.monto_descuento_aplicado || 0) !== 0 ?
                        formatearMonedaRedondeada(reserva.monto_descuento_aplicado) :
                        '-'}
                    </td>
                    {/* Neto Final */}
                    <td>
                      {formatearMonedaRedondeada(
                        parseFloat(reserva.costo_neto_historico || 0) - parseFloat(reserva.monto_descuento_aplicado || 0)
                      )}
                    </td>
                    {/* IVA (19%) */}
                    <td>{formatearMonedaRedondeada(reserva.costo_iva_historico)}</td>
                    {/* Total General */}
                    <td>{formatearMonedaRedondeada(reserva.costo_total_historico)}</td>
                    <td>{reserva.tipo_documento ? reserva.tipo_documento.charAt(0).toUpperCase() + reserva.tipo_documento.slice(1) : 'N/A'}</td>
                    <td><span className={`status-badge status-${reserva.estado_reserva}`}>{reserva.estado_reserva.replace(/_/g, ' ')}</span></td>
                    <td className="actions-cell">
                      <button onClick={() => handleOpenViewModal(reserva)} className="action-button view">Ver</button>
                      <button onClick={() => handleOpenEditStateModal(reserva)} className="action-button edit-state">Editar</button>
                      {/* El botón de cancelar reserva se elimina de aquí */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>No hay reservas que coincidan con los filtros seleccionados.</td></tr>
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
      {isModalOpen && (
        <EditReservationModal
          reserva={editingReservation}
          onClose={handleCloseModal}
          onUpdate={handleUpdateReservation}
          initialMode={modalInitialMode} // Pasar el modo inicial
        />
      )}
    </>
  );
}

export default ReservasManager;
