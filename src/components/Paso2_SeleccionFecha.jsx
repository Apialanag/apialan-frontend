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
          // Parse reserva.fecha_reserva (e.g., '2023-10-26') as a local date
          const fechaDateObj = parseDate(reserva.fecha_reserva, 'yyyy-MM-dd', new Date());
          const fecha = formatearFechaParaAPI(fechaDateObj); // Convert back to 'yyyy-MM-dd' string for key
          if (!disponibilidadProcesada[fecha]) {
            disponibilidadProcesada[fecha] = { ocupados: 0, totalBloques: totalBloquesPorDia };
          }
          const hInicio = parseInt(reserva.hora_inicio.split(':')[0]);
          const hTermino = parseInt(reserva.hora_termino.split(':')[0]);
          disponibilidadProcesada[fecha].ocupados += (hTermino - hInicio);
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
