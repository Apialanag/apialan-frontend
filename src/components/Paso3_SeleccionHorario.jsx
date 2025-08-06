// src/components/Paso3_SeleccionHorario.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import HorarioSkeleton from './HorarioSkeleton'; // Importar el skeleton
import './Paso3_SeleccionHorario.css';
import { eachDayOfInterval, isSameDay, format as formatDateFns, isAfter } from 'date-fns'; // Necesario para iterar sobre el rango y isAfter

function Paso3_SeleccionHorario({
  salonSeleccionado,
  rangoSeleccionado, // Ahora es { startDate, endDate, discreteDates }
  currentSelectionMode, // Nueva prop para saber el modo
  horaInicio,
  setHoraInicio,
  horaTermino,
  setHoraTermino,
  desglosePrecio, // Recibe el objeto de desglose en lugar de costoCalculado
  duracionCalculada,
  nextStep,
  prevStep
}) {
  const [horariosDelDia, setHorariosDelDia] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(true);
  const [opcionesHoraTermino, setOpcionesHoraTermino] = useState([]);
  const [mensaje, setMensaje] = useState('');

  // Usar formatDateFns de date-fns para consistencia
  const formatearFechaParaAPI = (date) => date ? formatDateFns(date, 'yyyy-MM-dd') : '';

  // Definimos el buffer en términos de cuántos slots de 1 hora.
  // Para un buffer de 60 minutos, esto sería 1.
  // Si quisiéramos 0 buffer, sería 0.
  const BUFFER_SLOTS = 1;

  useEffect(() => {
    console.log('[Paso3] useEffect - Props recibidas: currentSelectionMode:', currentSelectionMode, 'rangoSeleccionado:', rangoSeleccionado);

    let fechasAProcesar = [];
    let esMultiplesDias = false;

    if (salonSeleccionado && rangoSeleccionado) {
      if (currentSelectionMode === 'single' && rangoSeleccionado.startDate) {
        fechasAProcesar = [rangoSeleccionado.startDate];
        esMultiplesDias = false;
      } else if (currentSelectionMode === 'range' && rangoSeleccionado.startDate && rangoSeleccionado.endDate) {
        if (isAfter(rangoSeleccionado.endDate, rangoSeleccionado.startDate)) {
          fechasAProcesar = eachDayOfInterval({ start: rangoSeleccionado.startDate, end: rangoSeleccionado.endDate });
          esMultiplesDias = fechasAProcesar.length > 1;
        } else if (isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate)) {
          fechasAProcesar = [rangoSeleccionado.startDate];
          esMultiplesDias = false;
        } else {
          console.warn("[Paso3] En modo rango, fecha de fin es anterior a fecha de inicio.");
          fechasAProcesar = [];
        }
      } else if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado.discreteDates && Array.isArray(rangoSeleccionado.discreteDates) && rangoSeleccionado.discreteDates.length > 0) {
        fechasAProcesar = [...rangoSeleccionado.discreteDates].sort((a,b) => a - b);
        esMultiplesDias = fechasAProcesar.length > 1;
      } else if (currentSelectionMode === 'multiple-discrete' && (!rangoSeleccionado.discreteDates || rangoSeleccionado.discreteDates.length === 0)) {
        console.log('[Paso3] Modo multiple-discrete pero discreteDates está vacío o no es un array.');
        fechasAProcesar = [];
      }
    }

    console.log('[Paso3] Fechas a procesar:', fechasAProcesar);

    if (salonSeleccionado && fechasAProcesar.length > 0) {
      const fetchDisponibilidadParaFechas = async () => {
        setCargandoHorarios(true);
        setHorariosDelDia([]);
        setMensaje('');
        setHoraInicio('');
        setHoraTermino('');

        // Inicializar horariosPosibles base (todos disponibles)
        let horariosComunesDisponibles = Array.from({ length: 9 }, (_, i) => ({
          hora: `${10 + i}:00`,
          disponible: true
        }));

        try {
          for (const fechaParaConsultar of fechasAProcesar) {
            const response = await api.get(`/reservas`, {
              params: { espacio_id: salonSeleccionado.id, fecha: formatearFechaParaAPI(fechaParaConsultar) }
            });
            const reservasExistentesParaEsteDia = response.data;

            // Crear una copia temporal de los horarios base para procesar este día específico
            let horariosParaEsteDia = Array.from({ length: 9 }, (_, i) => ({
              hora: `${10 + i}:00`,
              disponible: true
            }));

            reservasExistentesParaEsteDia.forEach(reserva => {
              const hInicio = parseInt(reserva.hora_inicio.split(':')[0]);
              const hTermino = parseInt(reserva.hora_termino.split(':')[0]);
              // Marcar slots de la reserva
              for (let i = hInicio; i < hTermino; i++) {
                const horario = horariosParaEsteDia.find(h => h.hora === `${i}:00`);
                if (horario) horario.disponible = false;
              }
              // Marcar slots de buffer
              for (let i = hTermino; i < hTermino + BUFFER_SLOTS; i++) {
                if (i < 19) {
                  const horarioBuffer = horariosParaEsteDia.find(h => h.hora === `${i}:00`);
                  if (horarioBuffer) horarioBuffer.disponible = false;
                }
              }
            });

            // Actualizar horariosComunesDisponibles: un slot solo es común si está disponible en *todos* los días procesados.
            horariosComunesDisponibles = horariosComunesDisponibles.map((hComun, index) => ({
              ...hComun,
              disponible: hComun.disponible && horariosParaEsteDia[index].disponible
            }));

            // Si en algún punto todos los horarios comunes se vuelven no disponibles, podemos detenernos.
            if (!horariosComunesDisponibles.some(h => h.disponible)) {
              setMensaje(esMultiplesDias ? "No hay horarios comunes disponibles para todas las fechas seleccionadas." : "No hay horarios disponibles para esta fecha.");
              break;
            }
          }

          setHorariosDelDia(horariosComunesDisponibles);
          if (!horariosComunesDisponibles.some(h => h.disponible) && !mensaje) {
             setMensaje(esMultiplesDias ? "No hay horarios comunes disponibles para todas las fechas seleccionadas." : "No hay horarios disponibles para esta fecha.");
          }

        } catch (err) {
          console.error("Error cargando horarios para las fechas seleccionadas:", err);
          setMensaje('Error al cargar la disponibilidad para las fechas seleccionadas.');
          setHorariosDelDia([]);
        } finally {
          setCargandoHorarios(false);
        }
      };
      fetchDisponibilidadParaFechas();
    } else {
      setHorariosDelDia([]);
      setMensaje(salonSeleccionado ? 'Seleccione fecha(s) para ver horarios.' : 'Seleccione un salón primero.');
      setCargandoHorarios(false);
      setHoraInicio('');
      setHoraTermino('');
    }
  }, [salonSeleccionado, rangoSeleccionado, currentSelectionMode, BUFFER_SLOTS, setHoraInicio, setHoraTermino]);

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

  let tituloPaso3 = "Paso 3: Seleccione un Horario";
  if (currentSelectionMode === 'range' && rangoSeleccionado?.startDate && rangoSeleccionado?.endDate && !isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate) && isAfter(rangoSeleccionado.endDate, rangoSeleccionado.startDate)) {
    tituloPaso3 += " (para todos los días del rango)";
  } else if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado?.discreteDates && rangoSeleccionado.discreteDates.length > 1) {
    tituloPaso3 += ` (para los ${rangoSeleccionado.discreteDates.length} días seleccionados)`;
  } else if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado?.discreteDates && rangoSeleccionado.discreteDates.length === 1) {
    // No es necesario añadir nada extra, es como seleccionar un solo día.
  }


  return (
    <div className="paso-container">
      <h2>{tituloPaso3}</h2>
      <div className="seleccion-horario-grid">
        <div className="columna-horarios">
          <p><strong>Hora de Inicio</strong></p>
          <div className="horarios-container">
            {cargandoHorarios ? (
              Array.from({ length: 9 }).map((_, index) => (
                <HorarioSkeleton key={`skeleton-inicio-${index}`} />
              ))
            ) : horariosDelDia.length > 0 && horariosDelDia.some(h => h.disponible) ? (
              horariosDelDia.map(horario => (
                <button
                  key={`inicio-${horario.hora}`}
                  onClick={() => handleSeleccionarHoraInicio(horario.hora)}
                  disabled={!horario.disponible}
                  className={`boton-horario ${!horario.disponible ? 'ocupado' : (horario.hora === horaInicio ? 'seleccionado' : 'disponible')}`}
                >
                  {horario.hora}
                </button>
              ))
            ) : (
              !cargandoHorarios && <p className="no-options-text">{mensaje || "Seleccione una fecha válida."}</p>
            )}
          </div>
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

      {horaTermino && desglosePrecio && (
        <div className="resumen-horario">
          <p>Duración: <strong>{duracionCalculada} {duracionCalculada === 1 ? 'hora' : 'horas'}</strong></p>
          {/* Mostrar el desglose del precio */}
          <p>Subtotal (Neto): <strong>${(desglosePrecio.netoOriginal || 0).toLocaleString('es-CL')}</strong></p>
          <p>IVA (19%): <strong>${Math.round(desglosePrecio.iva || 0).toLocaleString('es-CL')}</strong></p>
          <p>Total Estimado: <strong>${Math.round(desglosePrecio.total || 0).toLocaleString('es-CL')}</strong></p>
        </div>
      )}

      {/* Mostrar mensaje global si no hay horarios disponibles en absoluto o si hubo un error de carga */}
      {mensaje && !cargandoHorarios && (!horariosDelDia || !horariosDelDia.some(h => h.disponible)) &&
        <p className="mensaje-error no-options-text">{mensaje}</p>
      }

      <div className="navegacion-pasos">
        <button onClick={prevStep} className="boton-volver">← Volver</button>
        <button
          onClick={nextStep}
          disabled={!horaInicio || !horaTermino || cargandoHorarios}
          className="boton-principal"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}

export default Paso3_SeleccionHorario;
