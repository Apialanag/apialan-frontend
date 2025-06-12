// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Mantenemos el CSS para la estructura

function SalonCard({ salon, onSelect, isSelected }) {
  
  // --- PALETA DE COLORES ACTUALIZADA ---
  // Se introduce un color de acento rojo para el salón principal.
  const getEspacioColorStyles = (nombreEspacio) => {
    if (nombreEspacio.includes('Grande')) {
      return {
        '--header-bg': '#B91C1C',        // Rojo Corporativo (Red 700)
        '--header-hover-bg': '#991B1B',   // Versión más oscura (Red 800)
        '--badge-bg': '#FEE2E2',        // Fondo de badge rojo pálido
        '--badge-text': '#991B1B',
      };
    } else if (nombreEspacio.includes('Mediana')) {
      return {
        '--header-bg': '#3730a3',        // Azul Intermedio (Indigo 800)
        '--header-hover-bg': '#312b92',   // Versión más oscura
        '--badge-bg': '#eef2ff',
        '--badge-text': '#3730a3',
      };
    } else { // Por defecto, para la Sala Pequeña
      return {
        '--header-bg': '#4f46e5',        // Azul Brillante (Indigo 600)
        '--header-hover-bg': '#4338ca',   // Versión más oscura (Indigo 700)
        '--badge-bg': '#e0e7ff',
        '--badge-text': '#4f46e5',
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
