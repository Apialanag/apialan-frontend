import React, { useState, useEffect } from 'react';
import api from '../api';
import CustomCalendar from './CustomCalendar';
import './Paso2_SeleccionFecha.css';
import { parse as parseDate, format as formatDate } from 'date-fns'; // Renamed to avoid conflict

function Paso2_SeleccionFecha({ salonSeleccionado, fechaSeleccionada, setFechaSeleccionada, nextStep, prevStep }) {
  const [disponibilidadMensual, setDisponibilidadMensual] = useState({});
  const [mesCalendario, setMesCalendario] = useState(fechaSeleccionada || new Date());

  // Updated to use date-fns
  const formatearFechaParaAPI = (date) => date ? formatDate(date, 'yyyy-MM-dd') : '';
  
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

  return (
    <div className="paso-container">
      <h2>Paso 2: Seleccione una Fecha</h2>
      <div className="calendario-wrapper">
        <CustomCalendar 
          selectedDate={fechaSeleccionada}
          onDateSelect={setFechaSeleccionada}
          onMonthChange={setMesCalendario}
          disponibilidadMensual={disponibilidadMensual}
          formatearFechaParaAPI={formatearFechaParaAPI}
        />
      </div>
      
      {fechaSeleccionada && (
        <div className="fecha-seleccionada-info">
          Fecha seleccionada: <strong>{fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
        </div>
      )}

      <div className="navegacion-pasos">
        <button onClick={prevStep} className="boton-volver">← Volver</button>
        <button onClick={nextStep} disabled={!fechaSeleccionada} className="boton-principal">Continuar →</button>
      </div>
    </div>
  );
}

export default Paso2_SeleccionFecha;
