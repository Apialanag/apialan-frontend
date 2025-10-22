// src/components/SalonList.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import SalonCard from './SalonCard';
import SalonCardSkeleton from './SalonCardSkeleton'; // Importar el skeleton
import './SalonList.css';

// --- CAMBIO 1: Aceptamos la nueva propiedad 'esSocio' ---
function SalonList({ onSalonSelect, esSocio }) {
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalones = async () => {
      setLoading(true);
      try {
        const response = await api.get('/espacios');
        setSalones(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al obtener los salones:", err);
        const errorMessage = `Error al cargar los salones. No se pudo conectar a la API.`;
        setError(errorMessage);
        setSalones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSalones();
  }, []);

  if (error) return <p style={{ color: 'var(--color-red-500)' }}>{error}</p>;

  return (
    <div className="salones-container-vista-unica">
      {loading ? (
        // Mostrar 3 skeletons mientras carga
        Array.from({ length: 3 }).map((_, index) => (
          <SalonCardSkeleton key={index} />
        ))
      ) : salones.length > 0 ? (
        salones.map(salon => (
          <SalonCard 
            key={salon.id} 
            salon={salon}
            onSelect={onSalonSelect}
            esSocio={esSocio}
          />
        ))
      ) : (
        <p>No hay salones disponibles para mostrar en este momento.</p>
      )}
    </div>
  );
}

export default SalonList;