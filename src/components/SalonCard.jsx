// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Mantenemos el CSS para la estructura

function SalonCard({ salon, onSelect, isSelected }) {
  
  // Esta función ahora devuelve los valores de color, no clases de Tailwind.
  const getEspacioColorStyles = (nombreEspacio) => {
    if (nombreEspacio.includes('Grande')) {
      return {
        '--header-bg': '#050269',
        '--header-hover-bg': '#040156',
        '--badge-bg': '#e0e0ff',
        '--badge-text': '#050269',
      };
    } else if (nombreEspacio.includes('Mediana')) {
      return {
        '--header-bg': '#1a1783',
        '--header-hover-bg': '#131270',
        '--badge-bg': '#e5e5ff',
        '--badge-text': '#1a1783',
      };
    } else { // Por defecto, para la Sala Pequeña
      return {
        '--header-bg': '#2f2c9c',
        '--header-hover-bg': '#252289',
        '--badge-bg': '#eaeaff',
        '--badge-text': '#2f2c9c',
      };
    }
  };

  const cssVariables = getEspacioColorStyles(salon.nombre);

  return (
    // Aplicamos las variables CSS al contenedor principal de la tarjeta
    <div
      className={`salon-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(salon)}
      style={cssVariables}
    >
      <div className="card-header"> {/* Ya no necesita clases de color dinámicas */}
        <h3 className="card-title">{salon.nombre}</h3>
      </div>
      <div className="card-body">
        <div className="card-info-row">
          <span className="info-badge"> {/* Ya no necesita clases de color dinámicas */}
            Capacidad: {salon.capacidad} personas
          </span>
          <span className="price-tag">
            ${new Intl.NumberFormat('es-CL').format(salon.precio_por_hora)}/hr
          </span>
        </div>
        <div className="comodidades-section">
          <h4 className="comodidades-title">Comodidades:</h4>
          <div className="comodidades-tags">
            {salon.comodidades.map(comodidad => (
              <span key={comodidad} className="comodidad-tag">{comodidad}</span>
            ))}
          </div>
        </div>
        <div className="card-action">
          <div className="boton-reservar-card"> {/* Ya no necesita clases de color dinámicas */}
            {isSelected ? 'Seleccionado ✓' : 'Seleccionar este Espacio'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalonCard;
