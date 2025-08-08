// src/components/CuponesManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api, { createCupon, updateCupon } from '../api'; // Importar funciones de API
import CuponForm from './CuponForm'; // Importar el formulario
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
    setError(''); // Limpiar errores del modal
  };

  const fetchCupones = useCallback(async (page = 1, activo = '', codigo = '') => {
    setLoading(true);
    // setError(''); // No limpiar error general aquí para que no parpadee si el modal tuvo un error
    try {
      const params = { page, limit: 10 }; // Asumiendo 10 por página, ajustar si es necesario
      if (activo) params.activo = activo;
      if (codigo) params.busqueda_codigo = codigo; // O el nombre del param que espere el backend

      // Asegúrate que la ruta '/cupones' sea la correcta para tu API
      const response = await api.get('/cupones', { params });

      // Asumiendo que la respuesta del backend tiene la forma:
      // { cupones: [...], totalPages: X, currentPage: Y }
      setCupones(response.data.cupones || []);
      setTotalPages(response.data.totalPages || 0);
      setCurrentPage(response.data.currentPage || 1);
      setError(''); // Limpiar error si la carga fue exitosa
    } catch (err) {
      console.error("Error al obtener los cupones:", err);
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido al cargar cupones.';
      setError(`No se pudieron cargar los cupones. ${errorMessage}`);
      setCupones([]); // Limpiar cupones en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleSaveCupon = async (formData) => {
    console.log('Enviando datos de cupón:', formData); // <<--- DEBUGGING
    setLoading(true); // Podríamos tener un loading específico para el modal
    setError('');
    try {
      if (editingCupon && editingCupon.id) {
        // Estamos editando
        await updateCupon(editingCupon.id, formData);
        // Podríamos añadir un mensaje de éxito aquí (ej. con un estado de notificación)
      } else {
        // Estamos creando
        await createCupon(formData);
        // Podríamos añadir un mensaje de éxito aquí
      }
      fetchCupones(currentPage, filtroActivo, filtroCodigo); // Refrescar lista
      handleCloseModal(); // Cerrar modal
    } catch (err) {
      console.error("Error al guardar el cupón:", err);
      const errorMessage = err.response?.data?.message || // El backend puede enviar 'message'
                           err.response?.data?.error ||   // o 'error'
                           err.message ||
                           'Error desconocido al guardar el cupón.';
      setError(`Error al guardar el cupón: ${errorMessage}`);
      // No cerramos el modal en caso de error para que el usuario pueda corregir
    } finally {
      setLoading(false); // Desactivar loading general o el específico del modal
    }
  };

  // Mensaje de error general para la carga de la lista
  const listError = error && !isModalOpen ? <p className="mensaje-error">{error}</p> : null;
  // Mensaje de error específico para el modal
  const modalError = error && isModalOpen ? <p className="mensaje-error" style={{marginTop: '10px', marginBottom: '0px'}}>{error}</p> : null;


  if (loading && !isModalOpen) return <p>Cargando cupones...</p>; // Solo mostrar loading general si el modal no está abierto

  return (
    <div className="cupones-manager">
      <h2>Gestión de Cupones</h2>
      <p>Aquí puedes crear, editar y administrar los cupones de descuento.</p>
      {listError}

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
                    <button
                      className="action-button edit"
                      onClick={() => handleOpenModal(cupon)}
                      title="Editar Cupón"
                    >
                      Editar
                    </button>
                    {/* Aquí podrían ir otras acciones como Desactivar/Activar si se implementan */}
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
        <div className="modal-backdrop"> {/* No cerrar al hacer clic fuera por ahora, usar botón Cancelar */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</h2>
            {modalError /* Mostrar error específico del modal aquí arriba del formulario */}
            {loading && isModalOpen && <p>Guardando cupón...</p>}
            {!loading && ( // Solo mostrar el formulario si no estamos en estado de carga del modal
              <CuponForm
                initialData={editingCupon}
                onSubmit={handleSaveCupon}
                onCancel={handleCloseModal}
                isLoading={loading && isModalOpen} // Pasar el estado de carga específico del modal
              />
            )}
            {/* Los botones de acción ahora están dentro de CuponForm */}
          </div>
        </div>
      )}

      {totalPages > 1 && !loading && ( // No mostrar paginación si está cargando
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
