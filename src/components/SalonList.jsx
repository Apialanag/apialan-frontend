// src/components/SalonList.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import SalonCard from './SalonCard';
import SalonCardSkeleton from './SalonCardSkeleton'; // Importar el skeleton
import './SalonList.css';

// This map provides a reliable source for salon images, bypassing the unreliable API endpoint for images.
const salonImageMap = {
  1: 'https://raw.githubusercontent.com/af-andres/img/main/alan/salones/salon-eventos.png',
  2: 'https://github.com/af-andres/img/blob/main/alan/salones/salon-reuniones.png?raw=true',
  3: 'https://github.com/af-andres/img/blob/main/alan/salones/salon-coworking.png?raw=true',
};

function SalonList({ onSalonSelect, esSocio }) {
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalones = async () => {
      setLoading(true);
      try {
        const response = await api.get('/espacios');
        // Transform the API response to include the image URLs in the structure expected by SalonCard.
        const salonesConImagenes = response.data.map(salon => {
          const imageUrl = salonImageMap[salon.id];
          return {
            ...salon,
            // SalonCard expects a 'fotos' array with at least one object containing a 'url' property.
            fotos: imageUrl ? [{ url: imageUrl }] : salon.fotos || [],
          };
        });
        setSalones(salonesConImagenes);
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
