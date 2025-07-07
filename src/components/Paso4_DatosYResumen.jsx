import React, { useState } from 'react';
import api from '../api';
import './Paso4_DatosYResumen.css';

function Paso4_DatosYResumen(props) {
  // Desestructurar todas las props necesarias del objeto props
  const {
    salonSeleccionado,
    fechaSeleccionada,
    horaInicio,
    horaTermino,
    duracionCalculada,
    desglosePrecio,
    onReservationSuccess,
    prevStep,
    esSocio,
    rutSocio,
    nombreSocioAutofill,
    emailSocioAutofill,
    codigoCuponInput,
    setCodigoCuponInput,
    cuponAplicado,
    setCuponAplicado, // Esta es la que da problemas
    errorCupon,
    setErrorCupon,
    validandoCupon,
    setValidandoCupon
    // onSocioDataChange, // Sigue comentada
  } = props;

  // Se eliminan los logs iniciales de props desestructuradas
  // console.log('[Paso4] Inicio componente. Props de Cupón (después de desestructurar):', { ... });
  // console.log('[Paso4] Props generales recibidas (después de desestructurar):', { ... });

  // Inicialización de estados intentando cargar desde localStorage si no hay datos de socio
  const [clienteNombre, setClienteNombre] = useState(() => {
    if (nombreSocioAutofill) return nombreSocioAutofill;
    if (!esSocio && !nombreSocioAutofill) { // Asegurarse que esSocio es evaluado en el contexto de la primera carga
      return localStorage.getItem('lastBookingName') || '';
    }
    return '';
  });

  const [clienteEmail, setClienteEmail] = useState(() => {
    if (emailSocioAutofill) return emailSocioAutofill;
    if (!esSocio && !emailSocioAutofill) {
      return localStorage.getItem('lastBookingEmail') || '';
    }
    return '';
  });

  const [clienteTelefono, setClienteTelefono] = useState(() => {
    // Telefono no viene del socio, así que solo depende de !esSocio para cargar de localStorage
    // y que no haya datos de socio que indiquen un contexto diferente.
    if (!esSocio && !nombreSocioAutofill && !emailSocioAutofill) { // Condición más general para no-socio
      return localStorage.getItem('lastBookingPhone') || '';
    }
    return '';
  });

  const [rutLocal, setRutLocal] = useState(rutSocio || '');
  const [mensajeSocio, setMensajeSocio] = useState('');

  // Nuevos estados para facturación
  const [tipoDocumento, setTipoDocumento] = useState('boleta'); // 'boleta' o 'factura'
  const [facturacionRut, setFacturacionRut] = useState('');
  const [facturacionRazonSocial, setFacturacionRazonSocial] = useState('');
  const [facturacionGiro, setFacturacionGiro] = useState('');
  const [facturacionDireccion, setFacturacionDireccion] = useState('');


  // Efecto para autorelleno de socio y limpieza (prioriza datos de socio sobre localStorage)
  // Este useEffect se encarga de actualizar si el estado de socio cambia DESPUÉS del montaje inicial.
  React.useEffect(() => {
    if (esSocio && nombreSocioAutofill) {
      setClienteNombre(nombreSocioAutofill);
      setClienteEmail(emailSocioAutofill || '');
      setRutLocal(rutSocio || '');
      setMensajeSocio(`Datos de socio cargados: ${nombreSocioAutofill}.`);
      localStorage.removeItem('lastBookingName');
      localStorage.removeItem('lastBookingEmail');
      localStorage.removeItem('lastBookingPhone');
    } else if (!esSocio) {
      // Si se desloguea de socio (esSocio cambia de true a false),
      // limpiamos los campos si eran del socio.
      // La carga inicial desde localStorage ya ocurrió en useState.
      // No se recargan datos de localStorage aquí para no sobrescribir ediciones manuales post-deslogueo.
      if (clienteNombre === nombreSocioAutofill && nombreSocioAutofill) { // Solo limpiar si el valor actual es el del socio
        setClienteNombre(localStorage.getItem('lastBookingName') || ''); // Intentar recargar de localStorage tras deslogueo
      }
      if (clienteEmail === emailSocioAutofill && emailSocioAutofill) {
        setClienteEmail(localStorage.getItem('lastBookingEmail') || ''); // Intentar recargar de localStorage tras deslogueo
      }
      // El teléfono no se autocompleta por socio, así que no se limpia aquí basado en socio.
      // Si se desloguea, y había algo en localStorage, ya debería estar cargado por el useState.
      // Si no había nada, el campo de teléfono permanecerá como esté.
      setMensajeSocio('');
    }
  }, [nombreSocioAutofill, emailSocioAutofill, rutSocio, esSocio]); // Faltaba clienteNombre y clienteEmail en dependencias? No, porque este efecto es para *reaccionar* a cambios de socio.

  const [notasAdicionales, setNotasAdicionales] = useState('');
  const [mensajeReserva, setMensajeReserva] = useState({ texto: '', tipo: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Props para cupones (setters que vienen de BookingPage)
  // Estas props ya están desestructuradas en la definición del componente:
  // setCodigoCuponInput, cuponAplicado, setCuponAplicado, errorCupon, setErrorCupon,
  // validandoCupon, setValidandoCupon.
  // Usaremos directamente setCuponAplicado (que es la prop de BookingPage)
  // en lugar de setCuponAplicadoGlobal.

  // const IVA_RATE = 0.19; // No es necesario aquí si BookingPage recalcula todo.

  const handleAplicarCuponLocal = async () => {
    // Se conservan los console.error para errores de programación (props no siendo funciones)
    // Se eliminan los logs de flujo normal y de datos.
    // console.log('[Paso4] Inicio handleAplicarCuponLocal.');
    // console.log('[Paso4] typeof setCuponAplicado:', typeof setCuponAplicado, setCuponAplicado);
    // console.log('[Paso4] typeof setErrorCupon:', typeof setErrorCupon, setErrorCupon);
    // console.log('[Paso4] typeof setValidandoCupon:', typeof setValidandoCupon, setValidandoCupon);

    if (!codigoCuponInput.trim()) return;

    if (typeof setValidandoCupon === 'function') {
      setValidandoCupon(true);
    } else {
      console.error('[Paso4] setValidandoCupon NO es una función!', setValidandoCupon);
    }

    if (typeof setErrorCupon === 'function') {
      setErrorCupon('');
    } else {
      console.error('[Paso4] setErrorCupon NO es una función!', setErrorCupon);
    }

    // console.log('[Paso4] handleAplicarCuponLocal. Enviando:', { codigo_cupon: codigoCuponInput, monto_neto_base_reserva: desglosePrecio.netoOriginal });

    try {
      const response = await api.post('/cupones/validar', {
        codigo_cupon: codigoCuponInput,
        monto_neto_base_reserva: desglosePrecio.netoOriginal
      });
      // console.log('[Paso4] Respuesta de /cupones/validar:', response.data);

      if (response.data && response.data.esValido) {
        const cuponDataParaBookingPage = {
          codigo: response.data.codigoCuponValidado,
          montoDescontado: response.data.montoDescontado,
          mensaje: response.data.mensaje,
          cuponId: response.data.cuponId,
          netoConDescuentoDelCupon: response.data.netoConDescuento,
          netoOriginalAlAplicar: desglosePrecio.netoOriginal
        };
        // console.log('[Paso4] Cupón válido. Llamando a setCuponAplicado con:', cuponDataParaBookingPage);
        if (typeof setCuponAplicado === 'function') {
          setCuponAplicado(cuponDataParaBookingPage);
        } else {
          console.error('[Paso4] setCuponAplicado NO es una función al intentar aplicar cupón válido!', setCuponAplicado);
        }
      } else {
        // console.log('[Paso4] Cupón no válido o no aplicable. Mensaje:', response.data.mensaje);
        if (typeof setCuponAplicado === 'function') {
          setCuponAplicado(null);
        } else {
          console.error('[Paso4] setCuponAplicado NO es una función al intentar setear cupón a null!', setCuponAplicado);
        }
        if (typeof setErrorCupon === 'function') {
          setErrorCupon(response.data.mensaje || 'Cupón no válido o no aplicable.');
        } else {
          console.error('[Paso4] setErrorCupon NO es una función al setear error!', setErrorCupon);
        }
      }
    } catch (err) {
      console.error("[Paso4] Error al validar cupón (catch):", err.response || err.message); // Loguear err.message también
      if (typeof setCuponAplicado === 'function') {
        setCuponAplicado(null);
      } else {
        console.error('[Paso4] setCuponAplicado NO es una función en catch!', setCuponAplicado);
      }
      if (typeof setErrorCupon === 'function') {
        setErrorCupon(err.response?.data?.mensaje || err.message || 'Error al conectar con el servicio de cupones.');
      } else {
        console.error('[Paso4] setErrorCupon NO es una función en catch!', setErrorCupon);
      }
    } finally {
      if (typeof setValidandoCupon === 'function') {
        setValidandoCupon(false);
      } else {
        console.error('[Paso4] setValidandoCupon NO es una función en finally!', setValidandoCupon);
      }
    }
  };

  const handleRemoverCuponLocal = () => {
    // console.log('[Paso4] Inicio handleRemoverCuponLocal.');
    // console.log('[Paso4] typeof setCuponAplicado (remover):', typeof setCuponAplicado, setCuponAplicado);
    // console.log('[Paso4] typeof setErrorCupon (remover):', typeof setErrorCupon, setErrorCupon);
    // console.log('[Paso4] typeof setCodigoCuponInput (remover):', typeof setCodigoCuponInput, setCodigoCuponInput);

    if (typeof setCuponAplicado === 'function') {
      setCuponAplicado(null);
    } else {
      console.error('[Paso4] setCuponAplicado NO es una función en handleRemoverCuponLocal!', setCuponAplicado);
    }
    if (typeof setErrorCupon === 'function') {
      setErrorCupon('');
    } else {
      console.error('[Paso4] setErrorCupon NO es una función en handleRemoverCuponLocal!', setErrorCupon);
    }
    if (typeof setCodigoCuponInput === 'function') {
      setCodigoCuponInput('');
    } else {
      console.error('[Paso4] setCodigoCuponInput NO es una función en handleRemoverCuponLocal!', setCodigoCuponInput);
    }
  };


  const formatearFechaParaAPI = (date) => date ? date.toISOString().split('T')[0] : '';
  
  const isFormValid = () => {
    let isValid = clienteNombre.trim() !== '' && clienteEmail.trim() !== '' && /\S+@\S+\.\S+/.test(clienteEmail);
    if (tipoDocumento === 'factura') {
      isValid = isValid &&
                  facturacionRut.trim() !== '' &&
                  facturacionRazonSocial.trim() !== '' &&
                  facturacionGiro.trim() !== '' &&
                  facturacionDireccion.trim() !== '';
    }
    return isValid;
  };
  
  const handleSubmit = async () => {
    const formIsValid = isFormValid();
    // console.log('[Paso4] handleSubmit: isFormValid() resultado:', formIsValid);
    // console.log('[Paso4] handleSubmit: Valores para validación:', { clienteNombre, clienteEmail, tipoDocumento, facturacionRut, facturacionRazonSocial, facturacionGiro, facturacionDireccion });

    if (!formIsValid) {
      setMensajeReserva({ texto: 'Por favor, complete todos los campos requeridos y asegúrese de que el email sea válido.', tipo: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setMensajeReserva({ texto: 'Procesando...', tipo: 'info' });
    // console.log('[Paso4] Después de setIsSubmitting y setMensajeReserva');

    const datosReserva = {};
    // console.log('[Paso4] datosReserva inicializado:', datosReserva);

    // console.log('[Paso4] handleSubmit - Valores ANTES de construir datosReserva:', { salonSeleccionado, fechaSeleccionada, desglosePrecio, cuponAplicado, clienteNombre, clienteEmail, clienteTelefono, horaInicio, horaTermino, notasAdicionales, tipoDocumento, esSocio, rutLocal });

    datosReserva.espacio_id = salonSeleccionado?.id;
    // console.log('[Paso4] datosReserva después de espacio_id:', datosReserva, 'salonSeleccionado:', salonSeleccionado);

    datosReserva.cliente_nombre = clienteNombre;
    datosReserva.cliente_email = clienteEmail;
    datosReserva.cliente_telefono = clienteTelefono;
    // console.log('[Paso4] datosReserva después de datos cliente:', datosReserva);

    datosReserva.fecha_reserva = formatearFechaParaAPI(fechaSeleccionada);
    datosReserva.hora_inicio = horaInicio;
    datosReserva.hora_termino = horaTermino;
    // console.log('[Paso4] datosReserva después de fecha y hora:', datosReserva, 'fechaSeleccionada:', fechaSeleccionada);

    datosReserva.costo_total = desglosePrecio?.total;
    // console.log('[Paso4] datosReserva después de costo_total:', datosReserva, 'desglosePrecio:', desglosePrecio);

    datosReserva.notas_adicionales = notasAdicionales;
    datosReserva.tipo_documento = tipoDocumento;
    // console.log('[Paso4] datosReserva después de notas y tipoDoc:', datosReserva);

    if (tipoDocumento === 'factura') {
      datosReserva.facturacion_rut = facturacionRut;
      datosReserva.facturacion_razon_social = facturacionRazonSocial;
      datosReserva.facturacion_giro = facturacionGiro;
      datosReserva.facturacion_direccion = facturacionDireccion;
      // console.log('[Paso4] datosReserva después de datos factura:', datosReserva);
    }

    if (esSocio && rutLocal) {
      datosReserva.rut_socio = rutLocal;
      // console.log('[Paso4] datosReserva después de rutSocio:', datosReserva);
    }

    if (cuponAplicado && cuponAplicado.codigo && cuponAplicado.montoDescontado > 0) {
      datosReserva.codigo_cupon_aplicado = cuponAplicado.codigo;
      datosReserva.monto_descuento_aplicado = cuponAplicado.montoDescontado;
      if (cuponAplicado.cuponId) {
        datosReserva.cupon_id = cuponAplicado.cuponId;
      }
      // console.log('[Paso4] datosReserva después de datos cupón:', datosReserva, 'cuponAplicado:', cuponAplicado);
    }

    // Se podría dejar este log si aún se está depurando la interacción con el backend.
    // console.log('[Paso4] Enviando a /reservas FINAL:', datosReserva);

    try {
      // El backend debe usar el desglosePrecio.total como referencia y recalcular/verificar
      // el desglose final con el cupón para guardarlo de forma segura.
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

          <hr className="form-separator" />

          {/* Sección de Cupón de Descuento */}
          <div className="cupon-section form-group">
            <h3>¿Tienes un Cupón de Descuento?</h3>
            <div className="cupon-input-group">
              <input
                type="text"
                id="codigo-cupon"
                placeholder="Ingresa tu código"
                value={codigoCuponInput}
                onChange={(e) => { setCodigoCuponInput(e.target.value.toUpperCase()); setErrorCupon(''); }}
                disabled={!!cuponAplicado} // Deshabilitar si ya hay un cupón aplicado
              />
              {!cuponAplicado ? (
                <button
                  onClick={handleAplicarCuponLocal} // Esta función se definirá aquí
                  disabled={validandoCupon || !codigoCuponInput.trim()}
                  className="boton-aplicar-cupon"
                >
                  {validandoCupon ? 'Validando...' : 'Aplicar'}
                </button>
              ) : (
                <button
                  onClick={handleRemoverCuponLocal} // Esta función se definirá aquí
                  className="boton-remover-cupon"
                >
                  Quitar Cupón
                </button>
              )}
            </div>
            {errorCupon && <p className="mensaje-error-cupon">{errorCupon}</p>}
            {cuponAplicado && cuponAplicado.mensaje && <p className="mensaje-exito-cupon">{cuponAplicado.mensaje}</p>}
          </div>

          <hr className="form-separator" />

          {/* Selector de Tipo de Documento */}
          <div className="form-group tipo-documento-selector">
            <h3>Tipo de Documento Tributario</h3>
            <div className="radio-group">
              <label>
                <input type="radio" value="boleta" checked={tipoDocumento === 'boleta'} onChange={(e) => setTipoDocumento(e.target.value)} />
                Boleta
              </label>
              <label>
                <input type="radio" value="factura" checked={tipoDocumento === 'factura'} onChange={(e) => setTipoDocumento(e.target.value)} />
                Factura (Empresa)
              </label>
            </div>
          </div>

          {/* Campos de Facturación (Condicional) */}
          {tipoDocumento === 'factura' && (
            <div className="datos-facturacion-section">
              <h4>Datos para Facturación</h4>
              <p>Por favor, completa los datos para la emisión de tu factura.</p>
              <div className="form-group">
                <label htmlFor="facturacion-rut">RUT Empresa *</label>
                <input type="text" id="facturacion-rut" placeholder="Ej: 76.123.456-7" value={facturacionRut} onChange={(e) => setFacturacionRut(e.target.value)} required={tipoDocumento === 'factura'} />
              </div>
              <div className="form-group">
                <label htmlFor="facturacion-razon-social">Razón Social *</label>
                <input type="text" id="facturacion-razon-social" placeholder="Nombre legal de la empresa" value={facturacionRazonSocial} onChange={(e) => setFacturacionRazonSocial(e.target.value)} required={tipoDocumento === 'factura'} />
              </div>
              <div className="form-group">
                <label htmlFor="facturacion-giro">Giro *</label>
                <input type="text" id="facturacion-giro" placeholder="Actividad económica principal" value={facturacionGiro} onChange={(e) => setFacturacionGiro(e.target.value)} required={tipoDocumento === 'factura'} />
              </div>
              <div className="form-group">
                <label htmlFor="facturacion-direccion">Dirección Comercial *</label>
                <textarea id="facturacion-direccion" placeholder="Calle, Número, Comuna, Ciudad" value={facturacionDireccion} onChange={(e) => setFacturacionDireccion(e.target.value)} rows="3" required={tipoDocumento === 'factura'} />
              </div>
            </div>
          )}
        </div>
        <div className="panel-resumen">
          <h3>Resumen de tu Reserva</h3>
          <div className="resumen-fila"><span>Espacio:</span><strong>{salonSeleccionado?.nombre}</strong></div>
          <div className="resumen-fila"><span>Fecha:</span><strong>{fechaSeleccionada?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</strong></div>
          <div className="resumen-fila"><span>Horario:</span><strong>{horaInicio} - {horaTermino}</strong></div>
          <div className="resumen-fila"><span>Duración:</span><strong>{duracionCalculada} {duracionCalculada === 1 ? 'hora' : 'horas'}</strong></div>

          <div className="resumen-desglose-precio">
            <div className="resumen-fila">
              <span>Neto Original:</span>
              <strong>${(desglosePrecio.netoOriginal || 0).toLocaleString('es-CL')}</strong>
            </div>
            {cuponAplicado && desglosePrecio.montoDescuentoCupon > 0 && (
              <div className="resumen-fila descuento-cupon">
                <span>Descuento Cupón ({cuponAplicado.codigo}):</span>
                <strong>-${(desglosePrecio.montoDescuentoCupon || 0).toLocaleString('es-CL')}</strong>
              </div>
            )}
            <div className="resumen-fila subtotal-descuento">
              <span>Subtotal (Neto con desc.):</span>
              <strong>${(desglosePrecio.netoConDescuento || 0).toLocaleString('es-CL')}</strong>
            </div>
            <div className="resumen-fila">
              <span>IVA (19%):</span>
              <strong>${(desglosePrecio.iva || 0).toLocaleString('es-CL')}</strong>
            </div>
          </div>
          <hr className="resumen-separador" />
          <div className="resumen-total">
            <span>Total Final:</span>
            <strong>${(desglosePrecio.total || 0).toLocaleString('es-CL')}</strong>
          </div>
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
