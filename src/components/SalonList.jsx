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
    const mockSalones = [
      {
        id: 1,
        nombre: 'Salón Grande',
        capacidad: 10,
        precio_neto_por_hora: 4200,
        comodidades: ['WiFi', 'Proyector'],
        fotos: []
      },
      {
        id: 2,
        nombre: 'Sala Mediana',
        capacidad: 6,
        precio_neto_por_hora: 3360,
        comodidades: ['WiFi', 'Pizarra'],
        fotos: []
      },
      {
        id: 3,
        nombre: 'Sala Pequeña',
        capacidad: 4,
        precio_neto_por_hora: 2520,
        comodidades: ['WiFi'],
        fotos: []
      }
    ];
    setSalones(mockSalones);
    setLoading(false);
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