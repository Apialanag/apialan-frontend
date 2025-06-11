// src/components/EditReservationModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import './EditReservationModal.css';

function EditReservationModal({ reserva, onClose, onUpdate }) {
  // Estados locales para los campos del formulario del modal
  const [estadoReserva, setEstadoReserva] = useState('');
  const [estadoPago, setEstadoPago] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cuando el modal se abre, llenamos los campos con los datos de la reserva actual
  useEffect(() => {
    if (reserva) {
      setEstadoReserva(reserva.estado_reserva || 'pendiente');
      setEstadoPago(reserva.estado_pago || 'pendiente_pago');
    }
  }, [reserva]);

  const handleSaveChanges = async () => {
    if (!reserva) return;

    setIsSubmitting(true);
    setError('');

    const updatedData = {
      estado_reserva: estadoReserva,
      estado_pago: estadoPago,
    };

    try {
      // Usamos el endpoint PUT que ya tenemos en el backend
      const response = await api.put(`/reservas/${reserva.id}`, updatedData);
      
      // Llamamos a la función onUpdate pasada desde el padre para actualizar la tabla
      onUpdate(response.data.reserva);
      
      onClose(); // Cerrar el modal
    } catch (err) {
      console.error("Error al actualizar la reserva:", err);
      setError(err.response?.data?.error || 'Error al guardar los cambios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si no hay una reserva para editar, no renderizar nada
  if (!reserva) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Reserva ID: {reserva.id}</h2>
        <div className="modal-body">
          <p><strong>Cliente:</strong> {reserva.cliente_nombre}</p>
          <p><strong>Salón:</strong> {reserva.nombre_espacio}</p>
          
          <div className="form-group">
            <label htmlFor="estado-reserva">Estado de la Reserva</label>
            <select 
              id="estado-reserva" 
              value={estadoReserva} 
              onChange={(e) => setEstadoReserva(e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="completada">Completada</option>
              <option value="cancelada_por_admin">Cancelada por Admin</option>
              <option value="cancelada_por_cliente">Cancelada por Cliente</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="estado-pago">Estado del Pago</label>
            <select 
              id="estado-pago" 
              value={estadoPago} 
              onChange={(e) => setEstadoPago(e.target.value)}
            >
              <option value="pendiente_pago">Pendiente de Pago</option>
              <option value="pagado">Pagado</option>
              <option value="reembolsado">Reembolsado</option>
            </select>
          </div>

          {error && <p className="mensaje-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="boton-secundario">Cancelar</button>
          <button onClick={handleSaveChanges} disabled={isSubmitting} className="boton-principal">
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// *** LÍNEA CLAVE FALTANTE ***
// Aseguramos que el componente se pueda importar por defecto.
export default EditReservationModal;
