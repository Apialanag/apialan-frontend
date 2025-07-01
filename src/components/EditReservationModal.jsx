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
      // Se usa el endpoint PUT con la instancia 'api' centralizada, lo cual es correcto.
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
        <h2>Detalles Reserva ID: {reserva.id}</h2>
        <div className="modal-body">
          <div className="reserva-info-section">
            <h4>Información del Cliente y Reserva</h4>
            <p><strong>Cliente:</strong> {reserva.cliente_nombre} ({reserva.cliente_email})</p>
            <p><strong>Teléfono:</strong> {reserva.cliente_telefono || 'No provisto'}</p>
            <p><strong>Salón:</strong> {reserva.nombre_espacio}</p>
            <p><strong>Fecha:</strong> {new Date(reserva.fecha_reserva).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</p> {/* Asegurar UTC para parsear bien la fecha */}
            <p><strong>Horario:</strong> {reserva.hora_inicio} - {reserva.hora_termino}</p>
            <p><strong>Notas Adicionales:</strong> {reserva.notas_adicionales || 'Ninguna'}</p>
          </div>

          <hr />

          <div className="reserva-billing-section">
            <h4>Información de Pago y Facturación</h4>
            <p><strong>Neto:</strong> ${(parseFloat(reserva.costo_neto_historico) || 0).toLocaleString('es-CL')}</p>
            <p><strong>IVA:</strong> ${(parseFloat(reserva.costo_iva_historico) || 0).toLocaleString('es-CL')}</p>
            <p><strong>Total:</strong> ${(parseFloat(reserva.costo_total_historico) || 0).toLocaleString('es-CL')}</p>
            <p><strong>Tipo Documento:</strong> {reserva.tipo_documento ? reserva.tipo_documento.charAt(0).toUpperCase() + reserva.tipo_documento.slice(1) : 'No especificado'}</p>
            {reserva.tipo_documento === 'factura' && (
              <div className="factura-details">
                <h5>Datos de Factura:</h5>
                <p><strong>RUT:</strong> {reserva.facturacion_rut || 'N/A'}</p>
                <p><strong>Razón Social:</strong> {reserva.facturacion_razon_social || 'N/A'}</p>
                <p><strong>Giro:</strong> {reserva.facturacion_giro || 'N/A'}</p>
                <p><strong>Dirección:</strong> {reserva.facturacion_direccion || 'N/A'}</p>
              </div>
            )}
          </div>
          
          <hr />

          <h4>Actualizar Estados</h4>
          <div className="form-group">
            <label htmlFor="estado-reserva">Estado de la Reserva</label>
            <select 
              id="estado-reserva" 
              value={estadoReserva} 
              onChange={(e) => setEstadoReserva(e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="pagado">Pagado</option>
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

export default EditReservationModal;