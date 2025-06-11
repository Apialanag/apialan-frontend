// src/components/Paso2_SeleccionFecha.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomCalendar from './CustomCalendar'; // <-- Importa nuestro calendario
import './Paso2_SeleccionFecha.css'; // <-- Importa sus propios estilos

function Paso2_SeleccionFecha({ salonSeleccionado, fechaSeleccionada, setFechaSeleccionada, nextStep, prevStep }) {
  const [disponibilidadMensual, setDisponibilidadMensual] = useState({});
  const [mesCalendario, setMesCalendario] = useState(fechaSeleccionada || new Date());

  const formatearFechaParaAPI = (date) => date ? date.toISOString().split('T')[0] : '';
  
  useEffect(() => {
    if (salonSeleccionado) {
      const anio = mesCalendario.getFullYear();
      const mesNum = mesCalendario.getMonth() + 1;
      const mesFormateado = `${anio}-${mesNum < 10 ? `0${mesNum}` : mesNum}`;

      axios.get(`http://localhost:3000/api/reservas`, {
        params: { espacio_id: salonSeleccionado.id, mes: mesFormateado }
      }).then(response => {
        const disponibilidadProcesada = {};
        const totalBloquesPorDia = 9;
        response.data.forEach(reserva => {
          const fecha = formatearFechaParaAPI(new Date(reserva.fecha_reserva));
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
