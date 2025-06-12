// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Mantenemos el CSS para la estructura

function SalonCard({ salon, onSelect, isSelected }) {
  
  // --- PALETA DE DISEÑO PROFESIONAL: "Gradiente de Confianza y Calidez" ---
  const getEspacioColorStyles = (nombreEspacio) => {
    if (nombreEspacio.includes('Grande')) {
      return {
        '--header-bg': '#4f46e5',        // Azul Corporativo (Ancla de la Marca)
        '--header-hover-bg': '#4338ca',   // Versión más oscura
        '--badge-bg': '#e0e7ff',
        '--badge-text': '#4338ca',
      };
    } else if (nombreEspacio.includes('Mediana')) {
      return {
        '--header-bg': '#0d9488',        // Verde Azulado (Teal) - Creatividad y Calma
        '--header-hover-bg': '#0f766e',   // Versión más oscura
        '--badge-bg': '#ccfbf1',
        '--badge-text': '#0f766e',
      };
    } else { // Por defecto, para la Sala Pequeña
      return {
        '--header-bg': '#f59e0b',        // Ámbar/Dorado - Energía y Enfoque
        '--header-hover-bg': '#d97706',   // Versión más oscura
        '--badge-bg': '#fef3c7',
        '--badge-text': '#d97706',
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
