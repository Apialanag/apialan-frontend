import { useState, useEffect } from 'react';

// Este hook toma un valor (lo que el usuario está escribiendo) y un delay en milisegundos
function useDebounce(value, delay) {
  // Estado para guardar el valor "retrasado" (debounced)
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configura un temporizador que actualizará el valor debounced después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Función de limpieza: si el usuario sigue escribiendo, se cancela el temporizador anterior
    // y se inicia uno nuevo. Esto es la magia del debounce.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se re-ejecuta si el valor o el delay cambian

  return debouncedValue;
}

export default useDebounce;