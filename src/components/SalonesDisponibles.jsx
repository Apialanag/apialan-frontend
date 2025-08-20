import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api';

const SalonesDisponibles = (props) => {
  const [salones, setSalones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { triggerNextStep } = props;

  useEffect(() => {
    const fetchSalones = async () => {
      try {
        const response = await api.get('/espacios');
        setSalones(response.data);
      } catch (err) {
        console.error("Error fetching salons for chatbot:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalones();
  }, []);

  const handleSalonSelect = (salonName) => {
    // This is where you could trigger the next step with the selected salon
    // For now, we just log it and end the conversation branch.
    console.log(`Salon selected: ${salonName}`);
    triggerNextStep({ trigger: '5' }); // Go to a new step after selection
  };

  if (loading) {
    return <div>Cargando salones...</div>;
  }

  return (
    <div style={{ width: '100%' }}>
      <p>Claro, aquí tienes nuestras salas. Haz clic en la que te interese.</p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {salones.map(salon => (
          <button
            key={salon.id}
            onClick={() => handleSalonSelect(salon.nombre)}
            style={{
              backgroundColor: '#fff',
              border: '1px solid #00bfff',
              borderRadius: '5px',
              padding: '10px',
              margin: '5px 0',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {salon.nombre}
          </button>
        ))}
      </div>
    </div>
  );
};

SalonesDisponibles.propTypes = {
  triggerNextStep: PropTypes.func,
};

export default SalonesDisponibles;
