import React, { useState, useEffect, useCallback } from 'react';
import api, { getBlockedDates } from '../api';
import CustomCalendar from './CustomCalendar';
import './Paso2_SeleccionFecha.css';
import { parse as parseDate, format as formatDate, parseISO, isSameDay } from 'date-fns';

function Paso2_SeleccionFecha({
  salonSeleccionado,
  rangoSeleccionado,
  setRangoSeleccionado,
  currentSelectionMode,
  setCurrentSelectionMode,
  nextStep,
  prevStep
}) {
  const [disponibilidadMensual, setDisponibilidadMensual] = useState({});
  const [blockedDates, setBlockedDates] = useState([]);
  const [mesCalendario, setMesCalendario] = useState(rangoSeleccionado?.startDate || new Date());
  const [isLoadingBlockedDates, setIsLoadingBlockedDates] = useState(false);

  const formatearFechaParaAPI = useCallback((date) => date ? formatDate(date, 'yyyy-MM-dd') : '', []);

  const fetchBlockedDatesForCalendar = useCallback(async () => {
    setIsLoadingBlockedDates(true);
    try {
      const response = await getBlockedDates();
      setBlockedDates(response.data.map(bd => formatDate(parseISO(bd.date), 'yyyy-MM-dd')));
    } catch (error) {
      console.error("Error fetching blocked dates for calendar:", error);
    } finally {
      setIsLoadingBlockedDates(false);
    }
  }, []);
  
  useEffect(() => {
    fetchBlockedDatesForCalendar();
  }, [fetchBlockedDatesForCalendar]);

  // useEffect para cargar disponibilidad mensual (TEMPORALMENTE SIMPLIFICADO PARA DEBUG)
  useEffect(() => {
    console.log('[Paso2] DEBUG: useEffect de carga de disponibilidad disparado. Salon:', salonSeleccionado, 'Mes:', mesCalendario, 'FormatearFn:', typeof formatearFechaParaAPI);
    // El cuerpo original de este useEffect se comenta temporalmente:
    /*
    console.log('[Paso2] Estado mesCalendario ha cambiado a:', mesCalendario);
    if (salonSeleccionado) {
      const anio = mesCalendario.getFullYear();
      const mesNum = mesCalendario.getMonth() + 1;
      const mesFormateado = `${anio}-${mesNum < 10 ? `0${mesNum}` : mesNum}`;
      console.log('[Paso2] useEffect[salonSeleccionado, mesCalendario] - Cargando disponibilidad para mes:', mesFormateado);

      api.get(`/reservas`, {
        params: { espacio_id: salonSeleccionado.id, mes: mesFormateado }
      }).then(response => {
        const disponibilidadProcesada = {};
        const totalBloquesPorDia = 9;
        response.data.forEach(reserva => {
          if (typeof reserva.fecha_reserva === 'string' && reserva.fecha_reserva.trim() !== '' && reserva.fecha_reserva.includes('-')) {
            const fechaDateObj = parseDate(reserva.fecha_reserva, 'yyyy-MM-dd', new Date());
            if (fechaDateObj instanceof Date && !isNaN(fechaDateObj)) {
              const fecha = formatearFechaParaAPI(fechaDateObj);
              if (!disponibilidadProcesada[fecha]) {
                disponibilidadProcesada[fecha] = { ocupados: 0, totalBloques: totalBloquesPorDia };
              }
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
        });
        console.log('[Paso2] Disponibilidad mensual recibida y procesada:', disponibilidadProcesada);
        setDisponibilidadMensual(disponibilidadProcesada);
      }).catch(err => console.error("Error cargando disponibilidad mensual:", err));
    }
    */
  }, [salonSeleccionado, mesCalendario, formatearFechaParaAPI]);

  // useEffect para sincronizar mesCalendario si rangoSeleccionado.startDate cambia.
  useEffect(() => {
    if (rangoSeleccionado?.startDate) {
      const nuevaStartDate = rangoSeleccionado.startDate;
      if (mesCalendario instanceof Date && !isNaN(mesCalendario)) {
        if (mesCalendario.getFullYear() !== nuevaStartDate.getFullYear() ||
            mesCalendario.getMonth() !== nuevaStartDate.getMonth()) {
          const mesCalendarioNormalizado = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), 1);
          const nuevaStartDateNormalizada = new Date(nuevaStartDate.getFullYear(), nuevaStartDate.getMonth(), 1);
          if (mesCalendarioNormalizado.getTime() !== nuevaStartDateNormalizada.getTime()) {
            console.log('[Paso2] useEffect [rangoSeleccionado?.startDate] -> Sincronizando mesCalendario con nueva startDate:', nuevaStartDate);
            setMesCalendario(new Date(nuevaStartDate.getFullYear(), nuevaStartDate.getMonth(), 1));
          }
        }
      } else if (nuevaStartDate instanceof Date && !isNaN(nuevaStartDate)) {
        console.log('[Paso2] useEffect [rangoSeleccionado?.startDate] -> mesCalendario inválido, inicializando con nueva startDate:', nuevaStartDate);
        setMesCalendario(new Date(nuevaStartDate.getFullYear(), nuevaStartDate.getMonth(), 1));
      }
    }
  }, [rangoSeleccionado?.startDate, mesCalendario]);

  const handlePaso2MonthChange = (newDisplayMonthDate) => {
    console.log('[Paso2] handlePaso2MonthChange (onMonthChange de CustomCalendar) llamado con:', newDisplayMonthDate);
    setMesCalendario(newDisplayMonthDate);
  };

  const handleModeChange = (mode) => {
    console.log('[Paso2] handleModeChange - Nuevo modo:', mode);
    setCurrentSelectionMode(mode);
    setRangoSeleccionado(null);
    console.log('[Paso2] handleModeChange - rangoSeleccionado reseteado a null');
  };

  const handleCalendarSelectionChange = (newSelection) => {
    console.log('[Paso2] handleCalendarSelectionChange - Recibido de CustomCalendar:', newSelection);
    setRangoSeleccionado(newSelection);
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
        >
          Varios días (no consecutivos)
        </button>
      </div>

      <div className="calendario-wrapper">
        <CustomCalendar 
          selection={rangoSeleccionado}
          onSelectionChange={handleCalendarSelectionChange}
          onMonthChange={handlePaso2MonthChange}
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
            <p>Fecha seleccionada: <strong>{rangoSeleccionado.startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>
          }
          {currentSelectionMode === 'range' && rangoSeleccionado?.startDate && rangoSeleccionado?.endDate && !isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate) &&
            <div>
              <p>Fecha de inicio: <strong>{rangoSeleccionado.startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>
              <p>Fecha de fin: <strong>{rangoSeleccionado.endDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>
            </div>
          }
          {currentSelectionMode === 'range' && rangoSeleccionado?.startDate && (!rangoSeleccionado?.endDate || isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate)) &&
            <p>Día de inicio seleccionado: <strong>{rangoSeleccionado.startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> (Seleccione día de fin)</p>
          }
          {currentSelectionMode === 'multiple-discrete' && rangoSeleccionado?.discreteDates && rangoSeleccionado.discreteDates.length > 0 &&
            <div>
              <p>Días seleccionados:</p>
              <ul>
                {rangoSeleccionado.discreteDates.map(date => (
                  <li key={date.toISOString()}><strong>{date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</strong></li>
                ))}
              </ul>
            </div>
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
            (currentSelectionMode === 'range' && (!rangoSeleccionado?.startDate || !rangoSeleccionado?.endDate || isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate))) ||
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
