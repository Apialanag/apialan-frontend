import React, { useState, useEffect } from 'react';
import api from '../api';
import './EditReservationModal.css';

function EditReservationModal({ reserva, onClose, onUpdate }) {
  // Estados locales para los campos del formulario del modal
  const [currentEstadoReserva, setCurrentEstadoReserva] = useState('');
  // estadoPago se mostrará pero no será directamente editable si la lógica principal es:
  // confirmar reserva -> backend actualiza estado_pago a 'pagado'
  // const [currentEstadoPago, setCurrentEstadoPago] = useState('');
  const [initialEstadoReserva, setInitialEstadoReserva] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cuando el modal se abre o la reserva cambia, actualizamos los estados internos
  useEffect(() => {
    if (reserva) {
      setCurrentEstadoReserva(reserva.estado_reserva || 'pendiente');
      setInitialEstadoReserva(reserva.estado_reserva || 'pendiente');
      // setCurrentEstadoPago(reserva.estado_pago || 'pendiente_pago');
    }
  }, [reserva]);

  const handleSaveChanges = async () => {
    if (!reserva || currentEstadoReserva === initialEstadoReserva) return; // No guardar si no hay cambios

    setIsSubmitting(true);
    setError('');

    // Solo enviamos estado_reserva. El backend se encarga de estado_pago si es necesario.
    const updatedData = {
      estado_reserva: currentEstadoReserva,
    };

    try {
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
            <label htmlFor="estado-reserva">Actualizar Estado de la Reserva:</label>
            <select 
              id="estado-reserva" 
              value={currentEstadoReserva}
              onChange={(e) => setCurrentEstadoReserva(e.target.value)}
            >
              {/* Opciones basadas en los estados que el admin puede setear.
                   'pendiente' es un estado inicial común.
                   Si el backend usa 'pendiente_pago' como estado de reserva, ajustar aquí.
              */}
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada_por_admin">Cancelada por Admin</option>
              {/* <option value="cancelada_por_cliente">Cancelada por Cliente</option>  Generalmente el cliente la cancela por otra vía */}
              {/* <option value="pagado">Pagado</option>  'pagado' es un estado_pago, no un estado_reserva usualmente seteable directamente si 'confirmada' lo implica */}
            </select>
          </div>

          <p><strong>Estado de Pago Actual:</strong> {reserva.estado_pago ? reserva.estado_pago.replace(/_/g, ' ') : 'N/A'}</p>
          {/* El estado_pago se actualiza por el backend al confirmar. No se ofrece control directo aquí para simplificar. */}

          {error && <p className="mensaje-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="boton-secundario">Cancelar</button>
          <button
            onClick={handleSaveChanges}
            disabled={isSubmitting || currentEstadoReserva === initialEstadoReserva}
            className="boton-principal"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditReservationModal;