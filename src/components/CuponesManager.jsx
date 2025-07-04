// src/components/CuponesManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
// Importaremos un futuro Modal y DatePicker si son necesarios aquí o en subcomponentes.
// import DatePicker, { registerLocale } from 'react-datepicker';
// import { es } from 'date-fns/locale';
// import 'react-datepicker/dist/react-datepicker.css';
// registerLocale('es', es);

function CuponesManager() {
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para paginación (si el backend la soporta para cupones)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Estados para filtros
  const [filtroActivo, setFiltroActivo] = useState(''); // '', 'true', 'false'
  const [filtroCodigo, setFiltroCodigo] = useState(''); // Para buscar por código de cupón

  // Estados para el modal de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCupon, setEditingCupon] = useState(null); // null para crear, objeto cupón para editar

  const handleOpenModal = (cupon = null) => {
    setEditingCupon(cupon); // Si es null, es para crear. Si tiene datos, es para editar.
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCupon(null); // Limpiar el cupón en edición al cerrar
  };

  const fetchCupones = useCallback(async (page = 1, activo = '', codigo = '') => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 }; // Asumiendo 10 por página, ajustar si es necesario
      if (activo) params.activo = activo;
      if (codigo) params.busqueda_codigo = codigo; // O el nombre del param que espere el backend

      // Asegúrate que la ruta '/admin/cupones' sea la correcta para tu API de administrador
      const response = await api.get('/admin/cupones', { params });

      // Asumiendo que la respuesta del backend tiene la forma:
      // { cupones: [...], totalPages: X, currentPage: Y }
      setCupones(response.data.cupones || []);
      setTotalPages(response.data.totalPages || 0);
      setCurrentPage(response.data.currentPage || 1);

    } catch (err) {
      console.error("Error al obtener los cupones:", err);
      setError('No se pudieron cargar los cupones. ' + (err.response?.data?.error || err.message));
      setCupones([]); // Limpiar cupones en caso de error
    } finally {
      setLoading(false);
    }
  }, []); // Las dependencias reales se añadirán después, por ahora [] para que se llame una vez

  // Ajustar el useEffect que llama a fetchCupones para resetear la página a 1 cuando los filtros cambian.
  useEffect(() => {
    // Si alguno de los filtros cambia, queremos volver a la página 1.
    // Pero si solo currentPage cambia, no queremos resetear los filtros.
    // Esta lógica es un poco más compleja que el useEffect de ReservasManager,
    // ya que no usamos un debouncedInput para el código aquí (aún).
    // Por ahora, para simplificar, la llamada a fetchCupones se hará con la página actual,
    // y si el usuario quiere ver la primera página de un nuevo filtro, tendrá que ir manualmente.
    // O, podemos hacer que cualquier cambio de filtro resetee currentPage a 1.
    // Vamos a probar reseteando currentPage a 1 si filtroActivo o filtroCodigo cambian.
    // Necesitamos un efecto separado para eso o una lógica más elaborada.

    // Efecto para llamar a fetchCupones cuando cambian los filtros o la página
    fetchCupones(currentPage, filtroActivo, filtroCodigo);
  }, [currentPage, filtroActivo, filtroCodigo, fetchCupones]);


  // Efecto para resetear la página a 1 cuando los filtros cambian
  useEffect(() => {
    if (currentPage !== 1) { // Solo resetear si no estamos ya en la página 1
        setCurrentPage(1);
    }
    // No es necesario llamar a fetchCupones aquí de nuevo, el efecto anterior lo hará
    // cuando currentPage cambie a 1 (si era diferente).
    // O si currentPage ya era 1, el efecto anterior se disparará por cambio de filtro.
  }, [filtroActivo, filtroCodigo]); // Dependencias: los filtros


  // --- Funciones de formato ---
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'N/A';
    try {
      // Asumiendo que fechaISO ya es YYYY-MM-DD o un formato que Date puede parsear a la fecha correcta localmente
      return new Date(fechaISO).toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit'});
    } catch (e) {
      return 'Fecha Inválida';
    }
  };

  const formatearValor = (valor, tipo) => {
    if (tipo === 'porcentaje') return `${valor}%`;
    if (tipo === 'fijo') return `$${Number(valor).toLocaleString('es-CL')}`;
    return valor;
  };


  if (loading) return <p>Cargando cupones...</p>;
  if (error) return <p className="mensaje-error">{error}</p>;

  return (
    <div className="cupones-manager">
      <h2>Gestión de Cupones</h2>
      <p>Aquí puedes crear, editar y administrar los cupones de descuento.</p>

      <div className="filtros-y-acciones-cupones">
        <div className="filtros-cupones-grupo">
          <div className="filtro-item">
            <label htmlFor="filtro-estado-cupon">Estado:</label>
            <select
              id="filtro-estado-cupon"
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <div className="filtro-item">
            <label htmlFor="filtro-codigo-cupon">Buscar por Código:</label>
            <input
              type="text"
              id="filtro-codigo-cupon"
              value={filtroCodigo}
              onChange={(e) => setFiltroCodigo(e.target.value)}
              placeholder="Ej: VERANO20"
              className="filtro-input"
            />
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()} // Se definirá handleOpenModal
          className="boton-principal"
        >
          Crear Nuevo Cupón
        </button>
      </div>

      <div className="cupones-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Descripción</th>
              <th>Usos (Act/Máx)</th>
              <th>Monto Mín. (Neto)</th>
              <th>Válido Desde</th>
              <th>Válido Hasta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cupones.length > 0 ? (
              cupones.map(cupon => (
                <tr key={cupon.id}>
                  <td>{cupon.codigo}</td>
                  <td>{cupon.tipo_descuento === 'porcentaje' ? 'Porcentaje' : 'Fijo'}</td>
                  <td>{formatearValor(cupon.valor_descuento, cupon.tipo_descuento)}</td>
                  <td>{cupon.descripcion || '-'}</td>
                  <td>{cupon.usos_actuales} / {cupon.usos_maximos || '∞'}</td>
                  <td>{cupon.monto_minimo_reserva_neto ? `$${Number(cupon.monto_minimo_reserva_neto).toLocaleString('es-CL')}` : '-'}</td>
                  <td>{formatearFecha(cupon.fecha_validez_desde)}</td>
                  <td>{formatearFecha(cupon.fecha_validez_hasta)}</td>
                  <td>
                    <span className={`status-badge ${cupon.activo ? 'status-activo' : 'status-inactivo'}`}>
                      {cupon.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {/* <button className="action-button edit" onClick={() => { setEditingCupon(cupon); setIsModalOpen(true); }}>Editar</button>
                    <button
                      className={`action-button ${cupon.activo ? 'cancel' : 'activate'}`}
                      // onClick={() => handleToggleActivo(cupon)}
                    >
                      {cupon.activo ? 'Desactivar' : 'Activar'}
                    </button> */}
                    (Acciones)
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
                  No hay cupones para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TODO: Paginación */}

      {/* Modal de Formulario de Cupón (a crear en el siguiente paso) */}
      {/* Este es un placeholder visual. La funcionalidad del modal se hará después. */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</h2>
            <p>Formulario del cupón aquí...</p>
            <p>Cupón a editar: {editingCupon ? editingCupon.codigo : 'Nuevo'}</p>
            <div className="modal-footer">
              <button onClick={handleCloseModal} className="boton-secundario">Cancelar</button>
              <button className="boton-principal">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
            className="pagination-btn arrow"
          >
            Anterior
          </button>
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
            className="pagination-btn arrow"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default CuponesManager;
