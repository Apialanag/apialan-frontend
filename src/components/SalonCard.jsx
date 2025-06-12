// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Mantenemos el CSS para la estructura

function SalonCard({ salon, onSelect, isSelected }) {
  
  // --- PALETA DE COLORES ACTUALIZADA ---
  // El salón principal usa el color del header, los otros usan colores vivos.
  const getEspacioColorStyles = (nombreEspacio) => {
    if (nombreEspacio.includes('Grande')) {
      return {
        '--header-bg': '#4f46e5',        // Azul Corporativo (como el header)
        '--header-hover-bg': '#4338ca',   // Versión más oscura
        '--badge-bg': '#e0e7ff',        // Fondo de badge azul pálido
        '--badge-text': '#4338ca',
      };
    } else if (nombreEspacio.includes('Mediana')) {
      return {
        '--header-bg': '#B91C1C',        // Rojo Vibrante (Red 700)
        '--header-hover-bg': '#991B1B',   // Versión más oscura
        '--badge-bg': '#FEE2E2',        // Fondo de badge rojo pálido
        '--badge-text': '#991B1B',
      };
    } else { // Por defecto, para la Sala Pequeña
      return {
        '--header-bg': '#9333EA',        // Morado Vibrante (Purple 600)
        '--header-hover-bg': '#7E22CE',   // Versión más oscura
        '--badge-bg': '#F5F3FF',        // Fondo de badge morado pálido
        '--badge-text': '#7E22CE',
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
      <div className="card-header">
        <h3 className="card-title">{salon.nombre}</h3>
      </div>
      <div className="card-body">
        <div className="card-info-row">
          <span className="info-badge">
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
          <div className="boton-reservar-card">
            {isSelected ? 'Seleccionado ✓' : 'Seleccionar este Espacio'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalonCard;

