import React, { useState, useEffect, useCallback } from 'react';
import CustomCalendar from './CustomCalendar';
import { getBlockedDates, addBlockedDate, deleteBlockedDate } from '../api';
import './BlockedDatesManager.css'; // Crearemos este archivo CSS luego
import { format as formatDate, parseISO } from 'date-fns';

function BlockedDatesManager() {
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBlockedDates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getBlockedDates();
      // Asegurarse de que las fechas del backend (YYYY-MM-DD strings) se conviertan a objetos Date para el calendario
      // y para la lista, si es necesario, o mantenerlos como strings si es más fácil para la lógica de bloqueo.
      // Por ahora, las mantendremos como strings formateados 'yyyy-MM-dd' para la lógica de bloqueo.
      setBlockedDates(response.data.map(bd => ({ ...bd, date: formatDate(parseISO(bd.date), 'yyyy-MM-dd') })));
    } catch (err) {
      console.error("Error fetching blocked dates:", err);
      setError("Error al cargar las fechas bloqueadas. Intente de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedDates();
  }, [fetchBlockedDates]);

  const formatearFechaParaAPI = (date) => date ? formatDate(date, 'yyyy-MM-dd') : '';

  // Nueva función para manejar el objeto de selección del CustomCalendar
  const handleCalendarSelection = (selectionObject) => {
    // Para bloquear días, solo nos interesa startDate, y como el modo será 'single',
    // startDate y endDate serán la misma.
    if (selectionObject && selectionObject.startDate) {
      setSelectedDate(selectionObject.startDate);
    } else {
      setSelectedDate(null); // Si por alguna razón no hay startDate (ej. al deseleccionar)
    }
  };

  const handleBlockDate = async () => {
    if (!selectedDate) {
      alert("Por favor, seleccione una fecha para bloquear.");
      return;
    }
    const dateString = formatearFechaParaAPI(selectedDate);
    if (blockedDates.some(bd => bd.date === dateString)) {
      alert("Esta fecha ya está bloqueada.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await addBlockedDate(dateString, reason);
      setBlockedDates([...blockedDates, { date: dateString, reason }]);
      setSelectedDate(null);
      setReason('');
      alert("Fecha bloqueada exitosamente.");
    } catch (err) {
      console.error("Error blocking date:", err);
      setError("Error al bloquear la fecha.");
      alert("Error al bloquear la fecha. Verifique si ya está bloqueada o inténtelo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBlockedDate = async (dateToDelete) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteBlockedDate(dateToDelete);
      setBlockedDates(blockedDates.filter(bd => bd.date !== dateToDelete));
      alert("Bloqueo de fecha eliminado exitosamente.");
    } catch (err) {
      console.error("Error deleting blocked date:", err);
      setError("Error al eliminar el bloqueo de la fecha.");
      alert("Error al eliminar el bloqueo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Adaptar la prop tileDisabled para CustomCalendar si es necesario
  // Por ahora, CustomCalendar no tiene una prop directa para deshabilitar fechas específicas
  // sino que lo hace basado en disponibilidadMensual o fechas pasadas.
  // Vamos a pasar las fechas bloqueadas a CustomCalendar para que pueda marcarlas visualmente.
  // Esto requerirá una modificación en CustomCalendar.

  return (
    <div className="blocked-dates-manager">
      <h3>Gestionar Días Bloqueados</h3>
      {error && <p className="error-message">{error}</p>}
      <div className="block-date-form">
        <div className="calendar-section">
          <CustomCalendar
            // Para modo 'single', selection espera { startDate, endDate } donde ambos son la misma fecha
            selection={selectedDate ? { startDate: selectedDate, endDate: selectedDate, discreteDates: [] } : null}
            onSelectionChange={handleCalendarSelection}
            blockedDatesList={blockedDates.map(bd => bd.date)}
            formatearFechaParaAPI={formatearFechaParaAPI}
            disponibilidadMensual={{}} // No se usa para mostrar ocupación, solo para seleccionar
            selectionMode='single' // Especificar el modo de selección
          />
        </div>
        <div className="form-section">
          {selectedDate && (
            <p>Fecha seleccionada: <strong>{selectedDate.toLocaleDateString('es-ES')}</strong></p>
          )}
          <textarea
            placeholder="Motivo del bloqueo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
          />
          <button onClick={handleBlockDate} disabled={!selectedDate || isLoading}>
            {isLoading ? 'Bloqueando...' : 'Bloquear Fecha Seleccionada'}
          </button>
        </div>
      </div>

      <h4>Fechas Bloqueadas Actualmente:</h4>
      {isLoading && blockedDates.length === 0 && <p>Cargando fechas bloqueadas...</p>}
      {!isLoading && blockedDates.length === 0 && <p>No hay fechas bloqueadas.</p>}
      <ul className="blocked-dates-list">
        {blockedDates.map(({ date, reason: r }) => (
          <li key={date}>
            <span>{formatDate(parseISO(date), 'dd/MM/yyyy')} ({r || 'Sin motivo'})</span>
            <button onClick={() => handleDeleteBlockedDate(date)} disabled={isLoading}>
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BlockedDatesManager;
