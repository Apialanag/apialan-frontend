// src/components/Paso3_SeleccionHorario.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import './Paso3_SeleccionHorario.css';

function Paso3_SeleccionHorario({
  salonSeleccionado,
  fechaSeleccionada,
  horaInicio,
  setHoraInicio,
  horaTermino,
  setHoraTermino,
  // --- CORRECCIÓN CLAVE: Añadir estos props para recibirlos del padre ---
  costoCalculado,
  duracionCalculada,
  // -----------------------------------------------------------------
  nextStep,
  prevStep
}) {
  const [horariosDelDia, setHorariosDelDia] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(true);
  const [opcionesHoraTermino, setOpcionesHoraTermino] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const formatearFechaParaAPI = (date) => date ? date.toISOString().split('T')[0] : '';

  useEffect(() => {
    if (salonSeleccionado && fechaSeleccionada) {
      const fetchDisponibilidadDia = async () => {
        setCargandoHorarios(true);
        setHorariosDelDia([]);
        setMensaje('');
        try {
          const response = await api.get(`/reservas`, {
            params: { espacio_id: salonSeleccionado.id, fecha: formatearFechaParaAPI(fechaSeleccionada) }
          });
          const reservasExistentes = response.data;
          const horariosPosibles = Array.from({ length: 9 }, (_, i) => ({ hora: `${10 + i}:00`, disponible: true }));

          reservasExistentes.forEach(reserva => {
            const hInicio = parseInt(reserva.hora_inicio.split(':')[0]);
            const hTermino = parseInt(reserva.hora_termino.split(':')[0]);
            for (let i = hInicio; i < hTermino; i++) {
              const horario = horariosPosibles.find(h => h.hora === `${i}:00`);
              if (horario) horario.disponible = false;
            }
          });
          setHorariosDelDia(horariosPosibles);
        } catch (err) {
          console.error("Error cargando horarios:", err);
          setMensaje('Error al cargar la disponibilidad.');
        } finally {
          setCargandoHorarios(false);
        }
      };
      fetchDisponibilidadDia();
    }
  }, [salonSeleccionado, fechaSeleccionada]);

  useEffect(() => {
    if (horaInicio && horariosDelDia.length > 0) {
      const [hInicioNum] = horaInicio.split(':').map(Number);
      const nuevasOpciones = [];
      for (let h = hInicioNum + 1; h <= 19; h++) {
        const bloqueAnterior = `${h - 1}:00`;
        const horario = horariosDelDia.find(hd => hd.hora === bloqueAnterior);
        if (horario && horario.disponible) {
          nuevasOpciones.push({ hora: `${h}:00`, disponible: true });
        } else {
          break;
        }
      }
      setOpcionesHoraTermino(nuevasOpciones);
      if (horaTermino && !nuevasOpciones.find(opt => opt.hora === horaTermino)) {
        setHoraTermino('');
      }
    } else {
      setOpcionesHoraTermino([]);
    }
  }, [horaInicio, horariosDelDia, horaTermino, setHoraTermino]);

  const handleSeleccionarHoraInicio = (hora) => {
    setHoraInicio(hora);
    setHoraTermino('');
  };

  return (
    <div className="paso-container">
      <h2>Paso 3: Seleccione un Horario</h2>
      <div className="seleccion-horario-grid">
        <div className="columna-horarios">
          <p><strong>Hora de Inicio</strong></p>
          {cargandoHorarios ? <p>Cargando...</p> : (
            <div className="horarios-container">
              {horariosDelDia.map(horario => (
                <button
                  key={`inicio-${horario.hora}`}
                  onClick={() => handleSeleccionarHoraInicio(horario.hora)}
                  disabled={!horario.disponible}
                  className={`boton-horario ${!horario.disponible ? 'ocupado' : (horario.hora === horaInicio ? 'seleccionado' : 'disponible')}`}
                >
                  {horario.hora}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="columna-horarios">
          <p><strong>Hora de Término</strong></p>
          {horaInicio ? (
            <div className="horarios-container">
              {opcionesHoraTermino.length > 0 ? opcionesHoraTermino.map(opcion => (
                <button
                  key={`termino-${opcion.hora}`}
                  onClick={() => setHoraTermino(opcion.hora)}
                  className={`boton-horario disponible ${opcion.hora === horaTermino ? 'seleccionado' : ''}`}
                >
                  {opcion.hora}
                </button>
              )) : <p className="no-options-text">No hay horarios de término disponibles.</p>}
            </div>
          ) : <p className="no-options-text">Selecciona una hora de inicio primero.</p>}
        </div>
      </div>

      {horaTermino && (
        <div className="resumen-horario">
          <p>Duración: <strong>{duracionCalculada} {duracionCalculada === 1 ? 'hora' : 'horas'}</strong></p>
          <p>Total Estimado: <strong>${(costoCalculado || 0).toLocaleString('es-CL')}</strong></p>
        </div>
      )}

      {mensaje && <p className="mensaje-error">{mensaje}</p>}

      <div className="navegacion-pasos">
        <button onClick={prevStep} className="boton-volver">← Volver</button>
        <button onClick={nextStep} disabled={!horaInicio || !horaTermino} className="boton-principal">Continuar →</button>
      </div>
    </div>
  );
}

export default Paso3_SeleccionHorario;
