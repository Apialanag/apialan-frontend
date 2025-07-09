// src/components/CustomCalendar.jsx
import React, { useState, useEffect } from 'react';
import './CustomCalendar.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { isSameDay, isBefore, isAfter } from 'date-fns'; // Necesitaremos utilidades de fecha

function CustomCalendar({ 
  selection, // Objeto: { startDate: Date|null, endDate: Date|null }
  onSelectionChange, // Función: (newSelection) => void
  onMonthChange,
  disponibilidadMensual,
  formatearFechaParaAPI,
  blockedDatesList,
  selectionMode = 'single' // Nueva prop con valor por defecto
}) {
  // currentSelection interno para manejar el proceso de selección
  const initialSelection = selection || { startDate: null, endDate: null, discreteDates: [] };
  const [currentSelection, setCurrentSelection] = useState(initialSelection);
  const [hoveredDate, setHoveredDate] = useState(null); // Para visualización de rango mientras se selecciona

  // displayDate se basa en la fecha de inicio de la selección o la fecha actual
  const [displayDate, setDisplayDate] = useState(initialSelection?.startDate || initialSelection?.discreteDates?.[0] || new Date());

  useEffect(() => {
    // Sincronizar el estado interno si la prop 'selection' cambia desde fuera
    // Asegurar que discreteDates siempre sea un array
    const newSelection = selection || { startDate: null, endDate: null, discreteDates: [] };
    if (!Array.isArray(newSelection.discreteDates)) {
      newSelection.discreteDates = [];
    }
    setCurrentSelection(newSelection);
  }, [selection]);

  useEffect(() => {
    // Actualizar displayDate si el mes de startDate (o la primera fecha de discreteDates) cambia
    let DDate = null;
    if (selectionMode === 'multiple-discrete' && currentSelection?.discreteDates?.length > 0) {
        DDate = currentSelection.discreteDates[0];
    } else if (currentSelection?.startDate) {
        DDate = currentSelection.startDate;
    }

    if (DDate) {
      if (DDate.getMonth() !== displayDate.getMonth() ||
          DDate.getFullYear() !== displayDate.getFullYear()) {
        setDisplayDate(new Date(DDate));
      }
    } else if (displayDate.getMonth() !== new Date().getMonth()) {
      // Si no hay selección, volver al mes actual si displayDate se quedó en otro mes
      setDisplayDate(new Date());
    }
  }, [currentSelection, selectionMode, displayDate]);

  const daysOfWeek = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // *** LA CORRECCIÓN ESTÁ AQUÍ ***
  // Usamos la variable correcta: 'firstDayOfMonth' en lugar de 'firstDay'
  const startingDayOfWeek = (firstDayOfMonth.getDay() === 0) ? 6 : firstDayOfMonth.getDay() - 1; 

  const calendarDays = [];

  // Añadir celdas vacías para los días antes del 1ro del mes
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="day-cell empty"></div>);
  }

  // Añadir los días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dateString = formatearFechaParaAPI(currentDate);

    let dayClass = 'day-cell';
    let isDisabled = false;

    const dayOfWeek = currentDate.getDay();
    // Deshabilitar fechas pasadas y fines de semana (Domingo=0, Sábado=6)
    if (currentDate < today || dayOfWeek === 0 || dayOfWeek === 6) {
      dayClass += ' disabled';
      isDisabled = true;
    }

    // Comprobar si la fecha está en la lista de blockedDatesList
    // Asegurarse de que blockedDatesList es un array antes de usar .includes()
    if (!isDisabled && Array.isArray(blockedDatesList) && blockedDatesList.includes(dateString)) {
      dayClass += ' blocked-by-admin'; // Clase específica para días bloqueados por admin
      isDisabled = true;
    }

    // Comprobar disponibilidad por ocupación (si no está ya deshabilitado por otra razón)
    const infoDia = disponibilidadMensual ? disponibilidadMensual[dateString] : null;
    if (!isDisabled && infoDia && infoDia.ocupados >= infoDia.totalBloques) {
      dayClass += ' unavailable'; // Día completo por reservas normales
      isDisabled = true;
    }

    // Lógica de clases para selección
    const { startDate, endDate } = currentSelection;

    if (selectionMode === 'single') {
      if (startDate && isSameDay(currentDate, startDate)) {
        dayClass += ' selected';
      }
    } else if (selectionMode === 'range') {
      if (startDate && isSameDay(currentDate, startDate)) {
        dayClass += ' selected start-date';
      }
      if (endDate && isSameDay(currentDate, endDate)) {
        dayClass += ' selected end-date';
      }
      if (startDate && endDate && isAfter(currentDate, startDate) && isBefore(currentDate, endDate)) {
        dayClass += ' in-range';
      }
      // Visualización de pre-selección con hover para rango
      if (startDate && !endDate && hoveredDate && isAfter(hoveredDate, startDate) &&
          (isSameDay(currentDate, hoveredDate) || (isAfter(currentDate, startDate) && isBefore(currentDate, hoveredDate)))) {
        if (!isDisabled) dayClass += ' in-hover-range';
      }
       // Caso especial hover para seleccionar un solo día en modo rango (hover sobre el mismo start date)
      if (startDate && !endDate && hoveredDate && isSameDay(hoveredDate, startDate) && isSameDay(currentDate, startDate)) {
        if (!isDisabled && !dayClass.includes('in-hover-range')) dayClass += ' in-hover-range';
      }
    } else if (selectionMode === 'multiple-discrete') {
      const { discreteDates = [] } = currentSelection || { discreteDates: [] };
      if (discreteDates.some(d => isSameDay(d, currentDate))) {
        dayClass += ' selected';
      }
    }

    // Clase 'today' si no está ya seleccionada o es parte de un rango visualmente activo de otra manera
    // Para modo 'multiple-discrete', 'selected' ya cubre el caso.
    if (formatearFechaParaAPI(today) === dateString &&
        !dayClass.includes('selected') &&
        !(selectionMode === 'range' && (dayClass.includes('start-date') || dayClass.includes('in-range') || dayClass.includes('in-hover-range')))
      ) {
      dayClass += ' today';
    }
    
    calendarDays.push(
      <button 
        key={day} 
        className={dayClass}
        onClick={() => !isDisabled && handleDayClick(currentDate)}
        onMouseEnter={() => !isDisabled && setHoveredDate(currentDate)}
        onMouseLeave={() => setHoveredDate(null)}
        disabled={isDisabled}
      >
        {day}
      </button>
    );
  }

  const handleDayClick = (date) => {
    if (selectionMode === 'single') {
      const newSelection = { startDate: date, endDate: date };
      setCurrentSelection(newSelection);
      onSelectionChange(newSelection);
    } else if (selectionMode === 'range') {
      const { startDate, endDate } = currentSelection || {};

      if (!startDate || (startDate && endDate)) {
        setCurrentSelection({ startDate: date, endDate: null, discreteDates: [] });
        onSelectionChange({ startDate: date, endDate: null, discreteDates: [] });
      } else if (startDate && !endDate) {
        if (isBefore(date, startDate) || isSameDay(date, startDate)) {
          setCurrentSelection({ startDate: date, endDate: null, discreteDates: [] });
          onSelectionChange({ startDate: date, endDate: null, discreteDates: [] });
        } else {
          // Nueva fecha es posterior a startDate, se completa el rango (solo para modo 'range').
          // Validar que no haya días deshabilitados en el medio
          let tempDate = new Date(startDate);
          let rangeIsValid = true;
          // Avanzar día por día desde el día DESPUÉS de startDate hasta el día ANTES de 'date' (la nueva endDate)
          tempDate.setDate(tempDate.getDate() + 1);
          while (isBefore(tempDate, date)) {
            const tempDateString = formatearFechaParaAPI(tempDate);
            // const dayOfWeek = tempDate.getDay(); // No necesitamos dayOfWeek para esta validación específica.

            // Un día intermedio en un rango es inválido SI Y SOLO SI:
            // 1. Es una fecha pasada.
            // 2. Está en la lista de blockedDatesList (bloqueado por admin).
            // 3. Está completamente ocupado según disponibilidadMensual.
            // NO consideramos si es fin de semana para la validez del *rango intermedio*.
            let dayInMiddleIsInvalid = false;

            if (tempDate < today) {
              dayInMiddleIsInvalid = true;
            }

            if (!dayInMiddleIsInvalid && Array.isArray(blockedDatesList) && blockedDatesList.includes(tempDateString)) {
              dayInMiddleIsInvalid = true;
            }

            const infoDia = disponibilidadMensual ? disponibilidadMensual[tempDateString] : null;
            if (!dayInMiddleIsInvalid && infoDia && infoDia.ocupados >= infoDia.totalBloques) {
              dayInMiddleIsInvalid = true;
            }

            if (dayInMiddleIsInvalid) {
              rangeIsValid = false;
              break;
            }
            tempDate.setDate(tempDate.getDate() + 1);
          }

          if (rangeIsValid) {
            setCurrentSelection({ ...currentSelection, endDate: date });
            onSelectionChange({ ...currentSelection, endDate: date });
          } else {
            // Si el rango no es válido (contiene días deshabilitados), reiniciar la selección con la fecha clickeada como nueva startDate.
            setCurrentSelection({ startDate: date, endDate: null });
            onSelectionChange({ startDate: date, endDate: null });
            alert("El rango seleccionado contiene días no disponibles. Por favor, elija otro rango.");
          }
        }
      }
    } else if (selectionMode === 'multiple-discrete') {
      const { discreteDates = [] } = currentSelection || { discreteDates: [] }; // Inicializar si currentSelection es null
      const dateIndex = discreteDates.findIndex(d => isSameDay(d, date));
      let newDiscreteDates;

      if (dateIndex > -1) { // Ya seleccionada, quitarla
        newDiscreteDates = [...discreteDates.slice(0, dateIndex), ...discreteDates.slice(dateIndex + 1)];
      } else { // No seleccionada, añadirla
        newDiscreteDates = [...discreteDates, date].sort((a,b) => a - b); // Mantener ordenado
      }
      const newSelection = { startDate: null, endDate: null, discreteDates: newDiscreteDates };
      setCurrentSelection(newSelection);
      onSelectionChange(newSelection);
    }
    setHoveredDate(null); // Limpiar hoveredDate después del click
  };

  const handlePrevMonth = () => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1);
    setDisplayDate(newDate);
    if(onMonthChange) onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1);
    setDisplayDate(newDate);
    if(onMonthChange) onMonthChange(newDate);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="nav-button" aria-label="Mes anterior"><FaChevronLeft /></button>
        <span className="month-title">{monthNames[month]} {year}</span>
        <button onClick={handleNextMonth} className="nav-button" aria-label="Mes siguiente"><FaChevronRight /></button>
      </div>
      <div className="days-of-week-grid">
        {daysOfWeek.map(day => <div key={day} className="day-of-week">{day}</div>)}
      </div>
      <div className="calendar-grid">
        {calendarDays}
      </div>
    </div>
  );
}

export default CustomCalendar;