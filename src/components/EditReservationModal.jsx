import React, { useState, useEffect } from 'react';
import api from '../api';
import './EditReservationModal.css';

function EditReservationModal({ reserva, onClose, onUpdate, initialMode = 'view' }) { // Añadir initialMode
  // Estados locales para los campos del formulario del modal
  const [currentEstadoReserva, setCurrentEstadoReserva] = useState('');
  const [initialEstadoReserva, setInitialEstadoReserva] = useState('');
  const [modoEdicionEstado, setModoEdicionEstado] = useState(initialMode === 'edit'); // Usar initialMode
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cuando el modal se abre o la reserva cambia, actualizamos los estados internos
  useEffect(() => {
    if (reserva) {
      setCurrentEstadoReserva(reserva.estado_reserva || 'pendiente');
      setInitialEstadoReserva(reserva.estado_reserva || 'pendiente');
      setModoEdicionEstado(initialMode === 'edit'); // Establecer modo edición basado en initialMode
      setError('');
    }
  }, [reserva, initialMode]); // Añadir initialMode a las dependencias

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
            <p><strong>Neto:</strong> {reserva.costo_neto_historico != null ? `$${Math.round(parseFloat(reserva.costo_neto_historico)).toLocaleString('es-CL')}` : '-'}</p>
            <p><strong>IVA:</strong> {reserva.costo_iva_historico != null ? `$${Math.round(parseFloat(reserva.costo_iva_historico)).toLocaleString('es-CL')}` : '-'}</p>
            <p><strong>Total:</strong> {reserva.costo_total_historico != null ? `$${Math.round(parseFloat(reserva.costo_total_historico)).toLocaleString('es-CL')}` : '-'}</p>
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

          <div className="estado-section">
            <h4>Estado Actual</h4>
            <p><strong>Estado Reserva:</strong> {reserva.estado_reserva ? reserva.estado_reserva.replace(/_/g, ' ') : 'N/A'}</p>
            <p><strong>Estado Pago:</strong> {reserva.estado_pago ? reserva.estado_pago.replace(/_/g, ' ') : 'N/A'}</p>
          </div>

          {modoEdicionEstado && (
            <div className="form-group-estado">
              <label htmlFor="estado-reserva">Nuevo Estado de la Reserva:</label>
              <select
                id="estado-reserva"
                value={currentEstadoReserva}
                onChange={(e) => setCurrentEstadoReserva(e.target.value)}
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada_por_admin">Cancelada por Admin</option>
              </select>
            </div>
          )}

          {error && <p className="mensaje-error">{error}</p>}
        </div>

        <div className="modal-footer">
          {modoEdicionEstado ? (
            <>
              <button
                onClick={handleSaveChanges}
                disabled={isSubmitting || currentEstadoReserva === initialEstadoReserva}
                className="boton-principal"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios de Estado'}
              </button>
              <button onClick={onClose} className="boton-secundario">Cancelar</button>
              {/* Cancelar en modo edición ahora simplemente cierra el modal,
                  ya que el modal se abrirá en el modo correcto la próxima vez.
                  Alternativamente, podría volver a modo 'view' si initialMode fue 'view'.
                  Pero si se abrió para 'edit', cerrar es lo más simple.
              */}
            </>
          ) : ( // Modo visualización
            <>
              {/* Si se abrió en modo 'view', no mostramos el botón 'Modificar Estado' aquí,
                  ya que el usuario usó 'Cambiar Estado' desde la tabla si quería editar.
                  Si se quiere permitir cambiar a modo edición desde modo vista, se añadiría aquí.
                  Por ahora, si initialMode es 'view', solo hay botón 'Cerrar'.
              */}
               {initialMode === 'view' && <button onClick={() => setModoEdicionEstado(true)} className="boton-principal">Modificar Estado</button>}
              <button onClick={onClose} className="boton-secundario">Cerrar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditReservationModal;