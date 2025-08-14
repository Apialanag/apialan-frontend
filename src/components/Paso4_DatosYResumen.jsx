import React, { useState } from 'react';
import api, { iniciarPago } from '../api'; // Importar iniciarPago
import { isSameDay } from 'date-fns'; // Importar isSameDay
import './Paso4_DatosYResumen.css';

function Paso4_DatosYResumen(props) {
  // Desestructurar todas las props necesarias del objeto props
  const {
    salonSeleccionado,
    // fechaSeleccionada, // Ya no se usa directamente, se deriva de rangoSeleccionado
    rangoSeleccionado, // Nueva prop
    currentSelectionMode, // Nueva prop
    numDias, // Nueva prop
    horaInicio,
    horaTermino,
    duracionCalculada, // Sigue siendo duración por día
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
  const [reservaConfirmadaId, setReservaConfirmadaId] = useState(null); // Para mostrar el botón de calendario
  const [isCalendarMenuOpen, setIsCalendarMenuOpen] = useState(false); // Para el menú de opciones de calendario

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

  // --- Funciones para generar ICS ---
  const toICSDate = (date, timeString = "00:00") => {
    const [hours, minutes] = timeString.split(':').map(Number);
    // Crear la fecha en la zona horaria local del usuario
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);

    // Convertir a string UTC YYYYMMDDTHHMMSSZ
    const year = localDate.getUTCFullYear();
    const month = (localDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = localDate.getUTCDate().toString().padStart(2, '0');
    const h = localDate.getUTCHours().toString().padStart(2, '0');
    const m = localDate.getUTCMinutes().toString().padStart(2, '0');
    const s = localDate.getUTCSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}T${h}${m}${s}Z`;
  };

  const generateICSContent = () => {
    if (!reservaConfirmadaId || !salonSeleccionado || !rangoSeleccionado || !horaInicio || !horaTermino) {
      console.error("Faltan datos para generar el archivo .ics");
      return null;
    }

    let startDateForICS;
    let descriptionNotes = notasAdicionales || '';

    if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado.discreteDates && rangoSeleccionado.discreteDates.length > 0) {
      startDateForICS = rangoSeleccionado.discreteDates[0];
      if (rangoSeleccionado.discreteDates.length > 1) {
        const otrasFechas = rangoSeleccionado.discreteDates.slice(1).map(d => d.toLocaleDateString('es-ES')).join(', ');
        descriptionNotes += `\n\nEsta reserva es para múltiples días. Fechas adicionales: ${otrasFechas}. Por favor, consulte su email o la plataforma para más detalles.`;
      }
    } else if (rangoSeleccionado.startDate) {
      startDateForICS = rangoSeleccionado.startDate;
      // Si es un rango, la descripción podría indicar el rango completo si se desea,
      // pero el evento .ics se creará para el startDate con la duración de un día.
      // Para una implementación simple, nos enfocamos en el primer día.
      if (currentSelectionMode === 'range' && rangoSeleccionado.endDate && !isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate)) {
          descriptionNotes += `\n\nReserva de rango desde ${rangoSeleccionado.startDate.toLocaleDateString('es-ES')} hasta ${rangoSeleccionado.endDate.toLocaleDateString('es-ES')}. Evento de calendario para el día de inicio.`;
      }
    } else {
      console.error("No hay fecha de inicio válida para el .ics");
      return null;
    }

    const uid = `${reservaConfirmadaId}@tuempresa.com`; // Reemplazar tuempresa.com con tu dominio real
    const dtstamp = toICSDate(new Date());
    const dtstart = toICSDate(startDateForICS, horaInicio);
    const dtend = toICSDate(startDateForICS, horaTermino); // Asume que horaTermino es para el mismo día.

    const summary = `Reserva: ${salonSeleccionado.nombre}`;
    const location = salonSeleccionado.nombre; // O una dirección más específica si la tienes

    // Escapar caracteres especiales para ICS (nueva línea, coma, punto y coma, barra invertida)
    const escapeICS = (text) => {
      if (typeof text !== 'string') return '';
      return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//TuEmpresa//TuApp//ES`, // Reemplazar con datos de tu empresa/app
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(descriptionNotes)}`,
      `LOCATION:${escapeICS(location)}`,
      'STATUS:CONFIRMED', // Asumimos que si se descarga es porque está confirmada (o al menos solicitada firmemente)
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n'); // Usar CRLF para saltos de línea en .ics

    return icsContent;
  };

  const generateGoogleCalendarUrl = () => {
    if (!reservaConfirmadaId || !salonSeleccionado || !rangoSeleccionado || !horaInicio || !horaTermino) {
      console.error("Faltan datos para generar la URL de Google Calendar.");
      return null;
    }

    let startDateForEvent;
    let endDateForEvent; // Necesitamos una fecha de fin para Google Calendar también
    let descriptionText = notasAdicionales || '';

    if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado.discreteDates && rangoSeleccionado.discreteDates.length > 0) {
      startDateForEvent = rangoSeleccionado.discreteDates[0];
      // Para Google Calendar, el evento solo durará para el primer día con la hora especificada
      endDateForEvent = rangoSeleccionado.discreteDates[0];
      if (rangoSeleccionado.discreteDates.length > 1) {
        const otrasFechas = rangoSeleccionado.discreteDates.slice(1).map(d => d.toLocaleDateString('es-ES')).join(', ');
        descriptionText += `\n\nEsta reserva es para múltiples días. Fechas adicionales: ${otrasFechas}. Por favor, consulte su email o la plataforma para más detalles.`;
      }
    } else if (rangoSeleccionado.startDate) {
      startDateForEvent = rangoSeleccionado.startDate;
      // Si es un rango, Google Calendar puede manejar un evento que abarque varios días si DTEND es diferente de DTSTART.
      // Sin embargo, nuestras horas de inicio/fin son por día.
      // Por simplicidad y consistencia con el .ics, crearemos un evento para el primer día del rango.
      // Opcionalmente, si el modo es 'range' y endDate es diferente, podríamos hacer que el evento dure hasta endDate + horaTermino.
      // Por ahora, evento de un solo día:
      endDateForEvent = rangoSeleccionado.startDate;
      if (currentSelectionMode === 'range' && rangoSeleccionado.endDate && !isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate)) {
        descriptionText += `\n\nReserva de rango desde ${rangoSeleccionado.startDate.toLocaleDateString('es-ES')} hasta ${rangoSeleccionado.endDate.toLocaleDateString('es-ES')}. Evento de calendario para el día de inicio.`;
      }
    } else {
      console.error("No hay fecha de inicio válida para la URL de Google Calendar.");
      return null;
    }

    const googleDates = `${toICSDate(startDateForEvent, horaInicio)}/${toICSDate(endDateForEvent, horaTermino)}`;
    const title = `Reserva: ${salonSeleccionado.nombre}`;
    const location = salonSeleccionado.nombre; // O dirección más específica

    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${googleDates}` +
      `&details=${encodeURIComponent(descriptionText)}` +
      `&location=${encodeURIComponent(location)}` +
      `&sf=true&output=xml`;

    return googleCalendarUrl;
  };

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
    console.log('Enviando a /cupones/validar:', { codigo_cupon: codigoCuponInput, monto_neto_base_reserva: desglosePrecio.netoOriginal });

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
      console.error("[Paso4] Error al validar cupón (catch):", err.response ? err.response.data : err.message); // Loguear err.message también
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

  const toggleCalendarMenu = () => {
    setIsCalendarMenuOpen(prev => !prev);
  };

  const handleAddToGoogleCalendar = () => {
    const googleUrl = generateGoogleCalendarUrl();
    if (googleUrl) {
      window.open(googleUrl, '_blank');
    } else {
      alert("No se pudo generar el enlace para Google Calendar. Por favor, verifica los detalles de la reserva.");
    }
    setIsCalendarMenuOpen(false); // Cerrar el menú
  };

  const handleDownloadICS = () => {
    const icsString = generateICSContent();
    if (icsString) {
      const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reserva_salon_${reservaConfirmadaId || 'evento'}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } else {
      alert("No se pudo generar el archivo de calendario. Por favor, verifica los detalles de la reserva.");
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
    setReservaConfirmadaId(null); // Reiniciar para que no se muestre de intentos previos
    setIsCalendarMenuOpen(false); // Asegurar que el menú esté cerrado al iniciar/reintentar
    // console.log('[Paso4] Después de setIsSubmitting y setMensajeReserva');

    const datosReserva = {};
    // console.log('[Paso4] datosReserva inicializado:', datosReserva);

    // console.log('[Paso4] handleSubmit - Valores ANTES de construir datosReserva:', { salonSeleccionado, fechaSeleccionada, desglosePrecio, cuponAplicado, clienteNombre, clienteEmail, clienteTelefono, horaInicio, horaTermino, notasAdicionales, tipoDocumento, esSocio, rutLocal });

    datosReserva.espacio_id = salonSeleccionado?.id;
    // console.log('[Paso4] datosReserva después de espacio_id:', datosReserva, 'salonSeleccionado:', salonSeleccionado);

    datosReserva.cliente_nombre = clienteNombre;
    datosReserva.cliente_email = clienteEmail;
    datosReserva.cliente_telefono = clienteTelefono;

    // Asignar fechas según el modo de selección
    if (currentSelectionMode === 'single' && rangoSeleccionado?.startDate) {
      datosReserva.fecha_reserva = formatearFechaParaAPI(rangoSeleccionado.startDate);
      // datosReserva.fecha_fin_reserva = formatearFechaParaAPI(rangoSeleccionado.startDate); // Opcional si backend lo asume
    } else if (currentSelectionMode === 'range' && rangoSeleccionado?.startDate && rangoSeleccionado?.endDate) {
      datosReserva.fecha_reserva = formatearFechaParaAPI(rangoSeleccionado.startDate);
      datosReserva.fecha_fin_reserva = formatearFechaParaAPI(rangoSeleccionado.endDate);
    } else if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado?.discreteDates && rangoSeleccionado.discreteDates.length > 0) {
      // Para múltiples días discretos, la especificación para Jules sugiere enviar un array `dias_discretos`.
      // Si el backend espera una reserva por cada día, esta parte necesitaría un bucle y múltiples llamadas a la API,
      // o el backend debe manejar la creación de múltiples reservas a partir de este array.
      // Por ahora, enviaremos el array `dias_discretos` y la primera fecha como `fecha_reserva` principal si es necesario.
      datosReserva.dias_discretos = rangoSeleccionado.discreteDates.map(date => formatearFechaParaAPI(date));
      if (rangoSeleccionado.discreteDates.length > 0) {
         datosReserva.fecha_reserva = formatearFechaParaAPI(rangoSeleccionado.discreteDates[0]); // Backend podría necesitar una fecha principal
      }
    }

    datosReserva.hora_inicio = horaInicio;
    datosReserva.hora_termino = horaTermino;
    // datosReserva.costo_total = desglosePrecio?.total; // Nombre anterior
    datosReserva.precio_total_enviado_cliente = desglosePrecio?.total; // Nuevo nombre del campo

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
    // console.log('[Paso4] Enviando a /reservas FINAL:', datosReserva); // Comentado el log anterior
    console.log('[DEBUG Frontend] Enviando al backend /api/reservas:', JSON.stringify(datosReserva, null, 2));


    try {
      const responseReserva = await api.post('/reservas', datosReserva);
      const backendResponse = responseReserva.data;

      // Adaptar a la estructura de respuesta del backend: un array 'reservas'
      const reservaPrincipal = backendResponse.reservas && backendResponse.reservas.length > 0
        ? backendResponse.reservas[0]
        : null;

      if (reservaPrincipal && reservaPrincipal.id) {
        setMensajeReserva({ texto: 'Solicitud de reserva recibida. Redirigiendo al portal de pagos...', tipo: 'info' });

        // Guardar en localStorage si NO es socio
        if (!esSocio) {
          localStorage.setItem('lastBookingName', clienteNombre);
          localStorage.setItem('lastBookingEmail', clienteEmail);
          localStorage.setItem('lastBookingPhone', clienteTelefono);
        }

        // Iniciar el proceso de pago con Mercado Pago
        try {
          // Preparar los datos para la preferencia de pago
          const datosParaPago = {
            reservaId: reservaPrincipal.id,
            titulo: `Reserva de ${salonSeleccionado.nombre}`,
            precio: desglosePrecio.total
          };

          const responsePago = await iniciarPago(datosParaPago);

          if (responsePago.data && responsePago.data.init_point) {
            // Redirigir al usuario al checkout de Mercado Pago
            window.location.href = responsePago.data.init_point;
          } else {
            console.error("Error: El backend no proporcionó un init_point de Mercado Pago.", responsePago.data);
            setMensajeReserva({ texto: 'Error al iniciar el proceso de pago. No se obtuvo URL de la pasarela.', tipo: 'error' });
            setIsSubmitting(false);
          }
        } catch (errorPago) {
          console.error("Error al crear la preferencia de pago:", errorPago.response || errorPago);
          setMensajeReserva({ texto: `Error al contactar la pasarela de pagos: ${errorPago.response?.data?.error || 'Servicio no disponible.'}`, tipo: 'error' });
          setIsSubmitting(false);
        }

      } else {
        // La creación de la reserva no devolvió un ID válido
        console.error("Error: La creación de la reserva no devolvió un ID válido o la estructura esperada.", backendResponse);
        setMensajeReserva({ texto: 'Error al procesar la reserva. No se obtuvo ID.', tipo: 'error' });
        setReservaConfirmadaId(null); // Asegurarse de que no se muestre el botón de calendario
        setIsSubmitting(false);
      }
      
      // El bloque de guardado se movió más arriba, para que ocurra DESPUÉS de una reserva exitosa (reservaPrincipal.id existe)
      // y ANTES del setTimeout que llama a onReservationSuccess.

    } catch (error) {
      console.error("Error al crear reserva:", error.response || error);
      setMensajeReserva({ texto: `Error al crear la reserva: ${error.response?.data?.error || 'No se pudo procesar la solicitud.'}`, tipo: 'error' });
      setReservaConfirmadaId(null); // Asegurarse de que no se muestre el botón de calendario
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

          {/* Lógica para mostrar Fecha(s) */}
          {currentSelectionMode === 'single' && rangoSeleccionado?.startDate && (
            <div className="resumen-fila"><span>Fecha:</span><strong>{rangoSeleccionado.startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div>
          )}
          {currentSelectionMode === 'range' && rangoSeleccionado?.startDate && rangoSeleccionado?.endDate && (
            <>
              <div className="resumen-fila"><span>Desde:</span><strong>{rangoSeleccionado.startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div>
              <div className="resumen-fila"><span>Hasta:</span><strong>{rangoSeleccionado.endDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div>
            </>
          )}
          {currentSelectionMode === 'multiple-discrete' && rangoSeleccionado?.discreteDates && rangoSeleccionado.discreteDates.length > 0 && (
            <div className="resumen-fila">
              <span>Días:</span>
              <ul className="resumen-lista-dias">
                {rangoSeleccionado.discreteDates.map(date => (
                  <li key={date.toISOString()}><strong>{date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</strong></li>
                ))}
              </ul>
            </div>
          )}

          <div className="resumen-fila"><span>Horario:</span><strong>{horaInicio} - {horaTermino}</strong></div>

          {/* Lógica para mostrar Duración */}
          {numDias > 1 ? (
            <>
              <div className="resumen-fila"><span>Duración por día:</span><strong>{duracionCalculada} {duracionCalculada === 1 ? 'hora' : 'horas'}</strong></div>
              <div className="resumen-fila"><span>Número de días:</span><strong>{numDias}</strong></div>
            </>
          ) : (
            <div className="resumen-fila"><span>Duración:</span><strong>{duracionCalculada} {duracionCalculada === 1 ? 'hora' : 'horas'}</strong></div>
          )}

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
              <strong>${Math.round(desglosePrecio.iva || 0).toLocaleString('es-CL')}</strong>
            </div>
          </div>
          <hr className="resumen-separador" />
          <div className="resumen-total">
            <span>Total Final:</span>
            <strong>${Math.round(desglosePrecio.total || 0).toLocaleString('es-CL')}</strong>
          </div>
          <p className="resumen-notas">Una vez enviada la solicitud, recibirás un correo con los datos bancarios para efectuar el pago y confirmar tu reserva.</p>
        </div>
      </div>
      
      {mensajeReserva.texto && (
        <div className={`mensaje-reserva ${mensajeReserva.tipo}`}>
          {mensajeReserva.texto}
        </div>
      )}

      {reservaConfirmadaId && mensajeReserva.tipo === 'exito' && (
        <div className="accion-post-reserva"> {/* Contenedor para posicionamiento relativo del menú */}
          <button onClick={toggleCalendarMenu} className="boton-principal-calendario"> {/* Estilo a definir/ajustar */}
            Añadir a Calendario 📅
          </button>
          {isCalendarMenuOpen && (
            <div className="calendario-opciones-menu"> {/* Estilo a definir */}
              <button
                onClick={handleAddToGoogleCalendar}
                className="opcion-calendario" /* Estilo a definir */
              >
                Google Calendar
              </button>
              <button
                onClick={() => {
                  handleDownloadICS();
                  setIsCalendarMenuOpen(false); // Asegurar que el menú se cierre
                }}
                className="opcion-calendario" /* Estilo a definir */
              >
                Otros Calendarios (.ics)
              </button>
            </div>
          )}
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
