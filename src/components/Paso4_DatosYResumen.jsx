import React, { useState } from 'react';
import api from '../api';
import './Paso4_DatosYResumen.css';

function Paso4_DatosYResumen({
  salonSeleccionado,
  fechaSeleccionada,
  horaInicio,
  horaTermino,
  duracionCalculada,
  costoCalculado,
  onReservationSuccess,
  prevStep,
  esSocio, // Ya existía, para lógica de precios, etc.
  rutSocio,
  nombreSocioAutofill,
  emailSocioAutofill,
  // onSocioDataChange, // Necesario para limpiar datos de socio si el RUT se borra/cambia en este paso
}) {
  const [clienteNombre, setClienteNombre] = useState(nombreSocioAutofill || '');
  const [clienteEmail, setClienteEmail] = useState(emailSocioAutofill || '');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [rutLocal, setRutLocal] = useState(rutSocio || '');
  const [mensajeSocio, setMensajeSocio] = useState('');

  // Efecto para cargar datos desde localStorage al montar (solo si no es socio)
  React.useEffect(() => {
    if (!esSocio) {
      const savedName = localStorage.getItem('lastBookingName');
      const savedEmail = localStorage.getItem('lastBookingEmail');
      const savedPhone = localStorage.getItem('lastBookingPhone');
      if (savedName) setClienteNombre(savedName);
      if (savedEmail) setClienteEmail(savedEmail);
      if (savedPhone) setClienteTelefono(savedPhone);
    }
  }, []); // Se ejecuta solo una vez al montar, si no es socio en ese momento.

  // Efecto para autorelleno de socio y limpieza (prioriza datos de socio sobre localStorage)
  React.useEffect(() => {
    if (esSocio && nombreSocioAutofill) {
      setClienteNombre(nombreSocioAutofill);
      setClienteEmail(emailSocioAutofill || '');
      setRutLocal(rutSocio || '');
      setMensajeSocio(`Datos de socio cargados: ${nombreSocioAutofill}.`);
      // Borramos los datos de no-socio de localStorage si se valida como socio,
      // para evitar que reaparezcan si luego se desloguea.
      localStorage.removeItem('lastBookingName');
      localStorage.removeItem('lastBookingEmail');
      localStorage.removeItem('lastBookingPhone');
    } else if (!esSocio) {
      // Si se desloguea de socio, limpiamos campos si eran del socio.
      // No recargamos de localStorage aquí, eso solo pasa al montar inicialmente o si el usuario refresca como no-socio.
      if (clienteNombre === nombreSocioAutofill && nombreSocioAutofill) setClienteNombre('');
      if (clienteEmail === emailSocioAutofill && emailSocioAutofill) setClienteEmail('');
      setMensajeSocio('');
    }
  }, [nombreSocioAutofill, emailSocioAutofill, rutSocio, esSocio]);

  const [notasAdicionales, setNotasAdicionales] = useState('');
  const [mensajeReserva, setMensajeReserva] = useState({ texto: '', tipo: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatearFechaParaAPI = (date) => date ? date.toISOString().split('T')[0] : '';
  
  const isFormValid = () => {
    return clienteNombre.trim() !== '' && clienteEmail.trim() !== '' && /\S+@\S+\.\S+/.test(clienteEmail);
  };
  
  const handleSubmit = async () => {
    if (!isFormValid()) {
      setMensajeReserva({ texto: 'Por favor, complete su nombre y email correctamente.', tipo: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setMensajeReserva({ texto: 'Procesando...', tipo: 'info' });

    const datosReserva = {
      espacio_id: salonSeleccionado.id,
      cliente_nombre: clienteNombre,
      cliente_email: clienteEmail,
      cliente_telefono: clienteTelefono,
      fecha_reserva: formatearFechaParaAPI(fechaSeleccionada),
      hora_inicio: horaInicio,
      hora_termino: horaTermino,
      costo_total: costoCalculado,
      notas_adicionales: notasAdicionales,
    };

    // Usar rutLocal aquí porque es el que podría haber sido modificado por el usuario en este paso.
    // Si esSocio es true, significa que la validación original fue exitosa.
    if (esSocio && rutLocal) {
      datosReserva.rut_socio = rutLocal;
    } else if (!esSocio && rutLocal.trim() !== '') {
      // Si el usuario ingresó un RUT aquí pero no es socio validado (o se deslogueó),
      // podríamos querer enviar ese RUT igualmente, o no, dependiendo de la lógica de negocio.
      // Por ahora, solo enviamos rut_socio si esSocio es true.
      // Si se quiere enviar siempre que haya algo en rutLocal:
      // datosReserva.rut_socio = rutLocal;
    }


    try {
      await api.post('/reservas', datosReserva); 
      setMensajeReserva({ texto: '¡Solicitud de reserva enviada! Revisa tu correo para ver las instrucciones de pago.', tipo: 'exito' });

      // Guardar en localStorage si NO es socio
      if (!esSocio) {
        localStorage.setItem('lastBookingName', clienteNombre);
        localStorage.setItem('lastBookingEmail', clienteEmail);
        localStorage.setItem('lastBookingPhone', clienteTelefono);
      }
      
      setTimeout(() => {
        onReservationSuccess();
      }, 4000);
    } catch (error) {
      console.error("Error al crear reserva:", error.response || error);
      setMensajeReserva({ texto: `Error: ${error.response?.data?.error || 'No se pudo procesar la solicitud.'}`, tipo: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="paso-container">
      <h2>Paso 4: Completa tu Reserva</h2>

      {mensajeSocio && <div className="mensaje-socio-info">{mensajeSocio}</div>}

      <div className="datos-y-resumen-grid">
        <div className="formulario-datos-personales">
          <h3>Tus Datos de Contacto</h3>
          {/* Campo RUT (opcionalmente visible o editable aquí) */}
          {/* Si se decide mostrar/editar el RUT aquí, se necesitará una lógica más compleja
              para revalidar o limpiar los campos si el RUT cambia y no coincide con el socio validado.
              Por simplicidad, asumimos que el RUT validado en pasos anteriores es el que se usa,
              o que si el usuario cambia nombre/email, es una anulación manual del autofill.
          */}
           {/* <div className="form-group">
            <label htmlFor="cliente-rut">RUT (Socio)</label>
            <input
              type="text"
              id="cliente-rut"
              placeholder="RUT del socio (si aplica)"
              value={rutLocal}
              onChange={handleRutChange} // Necesitaría handleRutChange
              readOnly={!esSocio} // Podría ser readOnly si es socio y ya validado
            />
          </div> */}

          <p>Completa los siguientes campos para confirmar tu reserva.</p>
          <div className="form-group">
            <label htmlFor="cliente-nombre">Nombre Completo *</label>
            <input type="text" id="cliente-nombre" placeholder="Tu nombre" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="cliente-email">Email *</label>
            <input type="email" id="cliente-email" placeholder="tu@email.com" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="cliente-telefono">Teléfono (opcional)</label>
            <input type="tel" id="cliente-telefono" placeholder="Ej: 912345678" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="notas-adicionales">Comentarios Adicionales</label>
            <textarea id="notas-adicionales" placeholder="¿Algún requerimiento especial?" value={notasAdicionales} onChange={(e) => setNotasAdicionales(e.target.value)} rows="4" />
          </div>
        </div>
        <div className="panel-resumen">
          <h3>Resumen de tu Reserva</h3>
          <div className="resumen-fila"><span>Espacio:</span><strong>{salonSeleccionado?.nombre}</strong></div>
          <div className="resumen-fila"><span>Fecha:</span><strong>{fechaSeleccionada?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</strong></div>
          <div className="resumen-fila"><span>Horario:</span><strong>{horaInicio} - {horaTermino}</strong></div>
          <div className="resumen-fila"><span>Duración:</span><strong>{duracionCalculada} {duracionCalculada === 1 ? 'hora' : 'horas'}</strong></div>
          <hr className="resumen-separador" />
          <div className="resumen-total"><span>Total:</span><strong>${(costoCalculado || 0).toLocaleString('es-CL')}</strong></div>
          {/* --- TEXTO ACTUALIZADO --- */}
          <p className="resumen-notas">Una vez enviada la solicitud, recibirás un correo con los datos bancarios para efectuar el pago y confirmar tu reserva.</p>
        </div>
      </div>
      
      {mensajeReserva.texto && (
        <div className={`mensaje-reserva ${mensajeReserva.tipo}`}>
          {mensajeReserva.texto}
        </div>
      )}

      <div className="navegacion-pasos">
        <button onClick={prevStep} disabled={isSubmitting} className="boton-volver">← Volver</button>
        <button onClick={handleSubmit} disabled={!isFormValid() || isSubmitting} className="boton-principal">
          {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
        </button>
      </div>
    </div>
  );
}

export default Paso4_DatosYResumen;
