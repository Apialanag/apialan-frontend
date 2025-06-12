import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Ya no se usa axios directamente.
import api from '../api'; // <-- 1. IMPORTAMOS NUESTRA INSTANCIA CENTRALIZADA
import SalonCard from './SalonCard';
import './SalonList.css';

function SalonList({ onSalonSelect }) {
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalones = async () => {
      setLoading(true);
      try {
        // --- 2. LA CORRECCIÓN CLAVE ---
        // Usamos 'api.get()' con solo la parte final de la ruta.
        const response = await api.get('/espacios');
        setSalones(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al obtener los salones:", err);
        // Mensaje de error mejorado para depuración
        const errorMessage = `Error al cargar los salones. No se pudo conectar a la API. (URL de destino: ${api.defaults.baseURL})`;
        setError(errorMessage);
        setSalones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSalones();
  }, []);

  if (loading) return <p>Cargando salones...</p>;
  if (error) return <p style={{ color: 'var(--color-red-500)' }}>{error}</p>;

  return (
    <div className="salones-container-vista-unica">
      {salones.length > 0 ? (
        salones.map(salon => (
          <SalonCard 
            key={salon.id} 
            salon={salon}
            onSelect={onSalonSelect}
          />
        ))
      ) : (
        <p>No hay salones disponibles para mostrar en este momento.</p>
      )}
    </div>
  );
}

export default SalonList;
