import React, { useState, useEffect, useCallback } from 'react';
import api, { getBlockedDates } from '../api'; // Importar getBlockedDates
import CustomCalendar from './CustomCalendar';
import './Paso2_SeleccionFecha.css';
import { parse as parseDate, format as formatDate, parseISO, isSameDay } from 'date-fns'; // Añadir isSameDay

function Paso2_SeleccionFecha({ salonSeleccionado, rangoSeleccionado, setRangoSeleccionado, nextStep, prevStep }) {
  const [disponibilidadMensual, setDisponibilidadMensual] = useState({});
  const [blockedDates, setBlockedDates] = useState([]); // Estado para fechas bloqueadas
  // mesCalendario se basará en startDate del rango, o la fecha actual si no hay startDate
  const [mesCalendario, setMesCalendario] = useState(rangoSeleccionado?.startDate || new Date());
  const [isLoadingBlockedDates, setIsLoadingBlockedDates] = useState(false);
  const [currentSelectionMode, setCurrentSelectionMode] = useState('single'); // 'single', 'range', 'multiple-discrete'

  const formatearFechaParaAPI = (date) => date ? formatDate(date, 'yyyy-MM-dd') : '';

  const fetchBlockedDatesForCalendar = useCallback(async () => {
    setIsLoadingBlockedDates(true);
    try {
      const response = await getBlockedDates();
      // Almacenamos las fechas como strings 'yyyy-MM-dd' que es lo que CustomCalendar espera
      setBlockedDates(response.data.map(bd => formatDate(parseISO(bd.date), 'yyyy-MM-dd')));
    } catch (error) {
      console.error("Error fetching blocked dates for calendar:", error);
      // Manejar el error como sea apropiado, quizás mostrar un mensaje al usuario
    } finally {
      setIsLoadingBlockedDates(false);
    }
  }, []);
  
  useEffect(() => {
    fetchBlockedDatesForCalendar(); // Cargar fechas bloqueadas al montar o cambiar dependencias
  }, [fetchBlockedDatesForCalendar]);

  useEffect(() => {
    if (salonSeleccionado) {
      const anio = mesCalendario.getFullYear();
      const mesNum = mesCalendario.getMonth() + 1;
      const mesFormateado = `${anio}-${mesNum < 10 ? `0${mesNum}` : mesNum}`;

      // --- LA CORRECCIÓN CLAVE ---
      // Usamos 'api.get' y pasamos los parámetros. La URL base ya está configurada.
      api.get(`/reservas`, {
        params: { espacio_id: salonSeleccionado.id, mes: mesFormateado }
      }).then(response => {
        const disponibilidadProcesada = {};
        const totalBloquesPorDia = 9;
        response.data.forEach(reserva => {
          // --- COMIENZO DE LA MODIFICACIÓN ---
          // Verificar que reserva.fecha_reserva sea un string válido y no esté vacío
          // y que tenga un formato que se asemeje a YYYY-MM-DD antes de parsear.
          // Esto es una heurística simple; una validación más robusta podría usar regex.
          if (typeof reserva.fecha_reserva === 'string' && reserva.fecha_reserva.trim() !== '' && reserva.fecha_reserva.includes('-')) {
            // Parse reserva.fecha_reserva (e.g., '2023-10-26') as a local date
            const fechaDateObj = parseDate(reserva.fecha_reserva, 'yyyy-MM-dd', new Date());

            // Verificar si la fecha parseada es válida antes de continuar
            if (fechaDateObj instanceof Date && !isNaN(fechaDateObj)) {
              const fecha = formatearFechaParaAPI(fechaDateObj); // Convert back to 'yyyy-MM-dd' string for key
              if (!disponibilidadProcesada[fecha]) {
                disponibilidadProcesada[fecha] = { ocupados: 0, totalBloques: totalBloquesPorDia };
              }
              // Asegurarse de que hora_inicio y hora_termino también son válidos antes de parsear
              if (reserva.hora_inicio && reserva.hora_termino && reserva.hora_inicio.includes(':') && reserva.hora_termino.includes(':')) {
                const hInicio = parseInt(reserva.hora_inicio.split(':')[0]);
                const hTermino = parseInt(reserva.hora_termino.split(':')[0]);
                if (!isNaN(hInicio) && !isNaN(hTermino)) {
                  disponibilidadProcesada[fecha].ocupados += (hTermino - hInicio);
                } else {
                  console.warn(`Horas inválidas para la reserva con fecha ${reserva.fecha_reserva}: inicio='${reserva.hora_inicio}', termino='${reserva.hora_termino}'`);
                }
              } else {
                console.warn(`Horas faltantes o en formato incorrecto para la reserva con fecha ${reserva.fecha_reserva}`);
              }
            } else {
              console.warn(`Fecha inválida encontrada en reserva: ${reserva.fecha_reserva}. Esta reserva será omitida.`);
            }
          } else {
            console.warn(`Valor de fecha_reserva inválido o ausente: ${reserva.fecha_reserva}. Esta reserva será omitida.`);
          }
          // --- FIN DE LA MODIFICACIÓN ---
        });
        setDisponibilidadMensual(disponibilidadProcesada);
      }).catch(err => console.error("Error cargando disponibilidad mensual:", err));
    }
  }, [salonSeleccionado, mesCalendario]);

  // Ajustar mes del calendario si cambia la fecha de inicio de la selección
  useEffect(() => {
    if (rangoSeleccionado?.startDate && mesCalendario.getMonth() !== rangoSeleccionado.startDate.getMonth()) {
      setMesCalendario(new Date(rangoSeleccionado.startDate));
    } else if (!rangoSeleccionado?.startDate && mesCalendario.getMonth() !== new Date().getMonth()) {
      setMesCalendario(new Date()); // Volver al mes actual si no hay selección
    }
  }, [rangoSeleccionado?.startDate, mesCalendario]);

  // Ajustar mes del calendario si cambia la fecha de inicio de la selección
  useEffect(() => {
    if (rangoSeleccionado?.startDate && mesCalendario.getMonth() !== rangoSeleccionado.startDate.getMonth()) {
      setMesCalendario(new Date(rangoSeleccionado.startDate));
    } else if (!rangoSeleccionado?.startDate && mesCalendario.getMonth() !== new Date().getMonth()) {
      setMesCalendario(new Date()); // Volver al mes actual si no hay selección
    }
  }, [rangoSeleccionado?.startDate, mesCalendario]);

  const handleModeChange = (mode) => {
    setCurrentSelectionMode(mode);
    setRangoSeleccionado(null); // Resetear selección al cambiar de modo
    // TODO: Si se usa un estado separado para 'multiple-discrete', resetearlo también.
  };

  return (
    <div className="paso-container">
      <h2>Paso 2: {currentSelectionMode === 'single' ? 'Seleccione una Fecha' : currentSelectionMode === 'range' ? 'Seleccione un Rango de Fechas' : 'Seleccione Días'}</h2>

      <div className="modo-seleccion-container">
        <button
          onClick={() => handleModeChange('single')}
          className={currentSelectionMode === 'single' ? 'active' : ''}
        >
          Un solo día
        </button>
        <button
          onClick={() => handleModeChange('range')}
          className={currentSelectionMode === 'range' ? 'active' : ''}
        >
          Rango de días
        </button>
        <button
          onClick={() => handleModeChange('multiple-discrete')}
          className={currentSelectionMode === 'multiple-discrete' ? 'active' : ''}
          // Habilitar cuando CustomCalendar esté listo para multiple-discrete
        >
          Varios días (no consecutivos)
        </button>
      </div>

      <div className="calendario-wrapper">
        <CustomCalendar 
          selection={rangoSeleccionado} // rangoSeleccionado ahora es { startDate, endDate, discreteDates }
          onSelectionChange={setRangoSeleccionado} // setRangoSeleccionado recibe el objeto completo
          onMonthChange={setMesCalendario}
          disponibilidadMensual={disponibilidadMensual}
          formatearFechaParaAPI={formatearFechaParaAPI}
          blockedDatesList={blockedDates}
          selectionMode={currentSelectionMode}
        />
      </div>
      
      {isLoadingBlockedDates && <p>Cargando información de disponibilidad...</p>}

      {((currentSelectionMode === 'single' || currentSelectionMode === 'range') && rangoSeleccionado?.startDate) ||
       (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado?.discreteDates && rangoSeleccionado.discreteDates.length > 0) ? (
        <div className="fecha-seleccionada-info">
          {currentSelectionMode === 'single' && rangoSeleccionado?.startDate &&
            `Fecha seleccionada: <strong>${rangoSeleccionado.startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>`
          }
          {currentSelectionMode === 'range' && rangoSeleccionado?.startDate && rangoSeleccionado?.endDate && !isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate) &&
            <>
              Fecha de inicio: <strong>{rangoSeleccionado.startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
              <br />
              Fecha de fin: <strong>{rangoSeleccionado.endDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
            </>
          }
          {currentSelectionMode === 'range' && rangoSeleccionado?.startDate && (!rangoSeleccionado?.endDate || isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate)) &&
            `Día de inicio seleccionado: <strong>${rangoSeleccionado.startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> (Seleccione día de fin)`
          }
          {currentSelectionMode === 'multiple-discrete' && rangoSeleccionado?.discreteDates && rangoSeleccionado.discreteDates.length > 0 &&
            <>
              Días seleccionados:
              <ul>
                {rangoSeleccionado.discreteDates.map(date => (
                  <li key={date.toISOString()}><strong>{date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</strong></li>
                ))}
              </ul>
            </>
          }
        </div>
      ) : null}

      <div className="navegacion-pasos">
        <button onClick={prevStep} className="boton-volver">← Volver</button>
        <button
          onClick={nextStep}
          disabled={
            isLoadingBlockedDates ||
            (currentSelectionMode === 'single' && !rangoSeleccionado?.startDate) ||
            (currentSelectionMode === 'range' && (!rangoSeleccionado?.startDate || !rangoSeleccionado?.endDate || isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate))) || // Para rango, se requieren inicio y fin distintos
            (currentSelectionMode === 'multiple-discrete' && (!rangoSeleccionado?.discreteDates || rangoSeleccionado.discreteDates.length === 0))
          }
          className="boton-principal"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}

export default Paso2_SeleccionFecha;
