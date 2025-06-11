// src/components/CustomCalendar.jsx
import React, { useState, useEffect } from 'react';
import './CustomCalendar.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function CustomCalendar({ 
  selectedDate, 
  onDateSelect, 
  onMonthChange,
  disponibilidadMensual,
  formatearFechaParaAPI 
}) {
  const [displayDate, setDisplayDate] = useState(selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      if (selectedDate.getMonth() !== displayDate.getMonth() || selectedDate.getFullYear() !== displayDate.getFullYear()) {
        setDisplayDate(new Date(selectedDate));
      }
    } else if (displayDate.getMonth() !== new Date().getMonth()) {
        setDisplayDate(new Date());
    }
  }, [selectedDate]);

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
    if (currentDate < today || dayOfWeek === 0 || dayOfWeek === 6) {
      dayClass += ' disabled';
      isDisabled = true;
    }

    const infoDia = disponibilidadMensual[dateString];
    if (!isDisabled && infoDia && infoDia.ocupados >= infoDia.totalBloques) {
      dayClass += ' unavailable';
      isDisabled = true;
    }
    
    if (selectedDate && formatearFechaParaAPI(selectedDate) === dateString) {
      dayClass += ' selected';
    }
    
    if (formatearFechaParaAPI(today) === dateString && !dayClass.includes('selected')) {
      dayClass += ' today';
    }
    
    calendarDays.push(
      <button 
        key={day} 
        className={dayClass}
        onClick={() => !isDisabled && onDateSelect(currentDate)}
        disabled={isDisabled}
      >
        {day}
      </button>
    );
  }

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