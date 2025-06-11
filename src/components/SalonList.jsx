// src/components/SalonList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SalonCard from './SalonCard'; // Importa el componente de tarjeta corregido
import './SalonList.css'; // Importa sus propios estilos (si los tienes)

function SalonList({ onSalonSelect }) {
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalones = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/espacios');
        setSalones(response.data);
        setError(null);
      } catch (err) {
        console.error("Error al obtener los salones:", err);
        setError("Error al cargar los salones. Asegúrate de que el backend esté corriendo y accesible.");
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
    // Este div utiliza la clase que definimos en App.css para el grid responsive
    <div className="salones-container-vista-unica">
      {salones.length > 0 ? (
        salones.map(salon => (
          <SalonCard 
            key={salon.id} 
            salon={salon}
            onSelect={onSalonSelect} // Pasamos la función del padre al hijo
          />
        ))
      ) : (
        <p>No hay salones disponibles para mostrar en este momento.</p>
      )}
    </div>
  );
}

export default SalonList;
