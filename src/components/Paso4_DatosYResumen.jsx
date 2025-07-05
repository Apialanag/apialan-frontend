import React, { useState } from 'react';
import api from '../api';
import './Paso4_DatosYResumen.css';

function Paso4_DatosYResumen({
  salonSeleccionado,
  fechaSeleccionada,
  horaInicio,
  horaTermino,
  duracionCalculada,
  // costoCalculado, // Reemplazado por desglosePrecio
  desglosePrecio,
  onReservationSuccess,
  prevStep,
  esSocio,
  rutSocio,
  nombreSocioAutofill,
  emailSocioAutofill,
  // Props para cupones desde BookingPage
  codigoCuponInput,
  setCodigoCuponInput,
  cuponAplicado,
  // setCuponAplicado, // La lógica de aplicar cupón estará aquí
  errorCupon,
  setErrorCupon,
  validandoCupon,
  setValidandoCupon,
  // setDesglosePrecio, // Para actualizar el desglose general
  // onSocioDataChange,
}) { // La desestructuración original se mantiene por ahora para el resto del componente

  // Loguear las props de cupón accediéndolas desde el objeto 'props' si está disponible,
  // o desde las variables desestructuradas si 'props' no se pasó explícitamente.
  // Nota: Para que 'props' esté disponible aquí, la firma de la función debería ser 'function Paso4_DatosYResumen(props) {'
  // Como la firma actual desestructura, usaremos las variables desestructuradas para el log,
  // ya que 'props' como tal no estaría definido en este scope a menos que cambiemos la firma.
  // El log anterior ya hacía esto, lo mantendremos y confiaremos en él.
  console.log('[Paso4] Inicio componente. Props de Cupón (desestructuradas):', {
    codigoCuponInput,
    setCodigoCuponInput: typeof setCodigoCuponInput, // Loguear typeof para funciones
    cuponAplicado,
    setCuponAplicado: typeof setCuponAplicado,
    errorCupon,
    setErrorCupon: typeof setErrorCupon,
    validandoCupon,
    setValidandoCupon: typeof setValidandoCupon
  });
  console.log('[Paso4] Props generales recibidas (desestructuradas):', { salonSeleccionado, fechaSeleccionada, horaInicio, horaTermino, desglosePrecio });

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
    console.log('[Paso4] Inicio handleAplicarCuponLocal.');
    console.log('[Paso4] typeof setCuponAplicado:', typeof setCuponAplicado);
    console.log('[Paso4] typeof setErrorCupon:', typeof setErrorCupon);
    console.log('[Paso4] typeof setValidandoCupon:', typeof setValidandoCupon, setValidandoCupon); // Loguear el valor también
    console.log('[Paso4] Props object:', props); // Loguear el objeto props completo

    if (!codigoCuponInput.trim()) return;

    // Verificar si setValidandoCupon es una función antes de llamarla
    if (typeof setValidandoCupon === 'function') {
      setValidandoCupon(true);
    } else {
      console.error('[Paso4] setValidandoCupon no es una función!', setValidandoCupon);
      // Podrías querer manejar este error de alguna manera, o simplemente no llamar a la función.
      // Por ahora, solo lo logueamos y continuamos, pero la UI de carga no funcionará.
    }

    // Verificar si setErrorCupon es una función antes de llamarla
    if (typeof setErrorCupon === 'function') {
      setErrorCupon('');
    } else {
      console.error('[Paso4] setErrorCupon no es una función!', setErrorCupon);
    }

    console.log('[Paso4] handleAplicarCuponLocal. Enviando:', { codigo_cupon: codigoCuponInput, monto_neto_base_reserva: desglosePrecio.netoOriginal });

    try {
      // El endpoint y la estructura del payload deben coincidir con el backend
      const response = await api.post('/cupones/validar', {
        codigo_cupon: codigoCuponInput,
        monto_neto_base_reserva: desglosePrecio.netoOriginal // Neto antes de cualquier cupón
      });
      console.log('[Paso4] Respuesta de /cupones/validar:', response.data);

      if (response.data && response.data.esValido) {
        const cuponDataParaBookingPage = {
          codigo: response.data.codigoCuponValidado,
          montoDescontado: response.data.montoDescontado,
          mensaje: response.data.mensaje,
          cuponId: response.data.cuponId,
          netoConDescuentoDelCupon: response.data.netoConDescuento,
          netoOriginalAlAplicar: desglosePrecio.netoOriginal
        };
        console.log('[Paso4] Cupón válido. Llamando a setCuponAplicado con:', cuponDataParaBookingPage);
        if (typeof setCuponAplicado === 'function') {
          setCuponAplicado(cuponDataParaBookingPage);
        } else {
          console.error('[Paso4] setCuponAplicado no es una función al intentar aplicar cupón válido!', setCuponAplicado);
        }
      } else {
        console.log('[Paso4] Cupón no válido o no aplicable. Mensaje:', response.data.mensaje);
        if (typeof setCuponAplicado === 'function') {
          setCuponAplicado(null);
        } else {
          console.error('[Paso4] setCuponAplicado no es una función al intentar setear cupón a null!', setCuponAplicado);
        }
        if (typeof setErrorCupon === 'function') {
          setErrorCupon(response.data.mensaje || 'Cupón no válido o no aplicable.');
        }
      }
    } catch (err) {
      console.error("[Paso4] Error al validar cupón (catch):", err.response || err);
      if (typeof setCuponAplicado === 'function') {
        setCuponAplicado(null);
      }
      if (typeof setErrorCupon === 'function') {
        setErrorCupon(err.response?.data?.mensaje || 'Error al conectar con el servicio de cupones.');
      }
    } finally {
      if (typeof setValidandoCupon === 'function') {
        setValidandoCupon(false);
      }
    }
  };

  const handleRemoverCuponLocal = () => {
    setCuponAplicado(null); // Llama al setter de BookingPage
    setErrorCupon('');
    setCodigoCuponInput('');
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
    if (!isFormValid()) {
      let errorMsg = 'Por favor, complete su nombre y email correctamente.';
      if (tipoDocumento === 'factura' &&
          (facturacionRut.trim() === '' || facturacionRazonSocial.trim() === '' || facturacionGiro.trim() === '' || facturacionDireccion.trim() === '')) {
        errorMsg = 'Por favor, complete todos los datos de contacto y facturación requeridos.';
      }
      setMensajeReserva({ texto: errorMsg, tipo: 'error' });
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
      // Enviar el desglose de precios al backend si la API lo espera
      // Según el Paso 2 del plan, el backend calcula y guarda neto, iva, total.
      // Por lo tanto, el frontend podría enviar solo el precio_neto_total o el precio_total_final,
      // o el backend lo recalcula basado en el espacio_id, duracion y si es socio.
      // Para mantener consistencia con el backend que ahora guarda el desglose,
      // es mejor que el backend sea la fuente de verdad para el desglose guardado.
      // El frontend envía la información necesaria para que el backend haga ese cálculo.
      // Si la API /reservas ahora espera explícitamente costo_neto, costo_iva, costo_total, se deben enviar.
      // Por ahora, asumiré que el backend recalcula y solo necesitamos enviar un `costo_total` como referencia,
      // o que el backend infiere todo de `espacio_id`, `duracion` y `rutSocio`.
      // Si el backend espera el desglose, se enviaría:
      // costo_neto: desglosePrecio.neto,
      // costo_iva: desglosePrecio.iva,
      // costo_total: desglosePrecio.total,
      // Por ahora, mantendré el envío de un solo 'costo_total' que el backend podría usar o ignorar si recalcula.
      costo_total: desglosePrecio.total, // El backend podría usar esto como 'costo_total_historico' o recalcular.
      notas_adicionales: notasAdicionales,
      tipo_documento: tipoDocumento,
    };

    if (tipoDocumento === 'factura') {
      datosReserva.facturacion_rut = facturacionRut;
      datosReserva.facturacion_razon_social = facturacionRazonSocial;
      datosReserva.facturacion_giro = facturacionGiro;
      datosReserva.facturacion_direccion = facturacionDireccion;
    }

    if (esSocio && rutLocal) {
      datosReserva.rut_socio = rutLocal;
    }
    // No enviar rut_socio si no es socio, incluso si rutLocal tiene algo (podría ser un RUT de facturación no socio)

    // Añadir datos del cupón si está aplicado
    if (cuponAplicado && cuponAplicado.codigo && cuponAplicado.montoDescontado > 0) {
      datosReserva.codigo_cupon_aplicado = cuponAplicado.codigo;
      datosReserva.monto_descuento_aplicado = cuponAplicado.montoDescontado;
      if (cuponAplicado.cuponId) {
        datosReserva.cupon_id = cuponAplicado.cuponId; // Enviar el ID del cupón
      }
    }


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
