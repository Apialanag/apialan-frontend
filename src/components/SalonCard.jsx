// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Mantenemos el CSS para la estructura

function SalonCard({ salon, onSelect, isSelected }) {
  
  // --- PALETA DE DISEÑO FINAL: "Identidad Corporativa con Jerarquía Visual" ---
  const getEspacioColorStyles = (nombreEspacio) => {
    if (nombreEspacio.includes('Grande')) {
      return {
        '--header-bg': '#4f46e5',        // Azul Corporativo (Primario)
        '--header-hover-bg': '#4338ca',
        '--badge-bg': '#e0e7ff',
        '--badge-text': '#4338ca',
        '--button-bg': '#4f46e5',       // Botón coincide con la cabecera
        '--button-hover-bg': '#4338ca',
      };
    } else if (nombreEspacio.includes('Mediana')) {
      return {
        // --- CAMBIO A ROJO MÁS VIBRANTE ---
        '--header-bg': '#DC2626',        // Rojo Vibrante (Red-600)
        '--header-hover-bg': '#B91C1C',   // Rojo más oscuro para el hover (Red-700)
        '--badge-bg': '#FEE2E2',
        '--badge-text': '#B91C1C',
        '--button-bg': '#DC2626',       // Botón coincide con la cabecera
        '--button-hover-bg': '#B91C1C',
      };
    } else { // Por defecto, para la Sala Pequeña
      return {
        '--header-bg': '#374151',        // Gris Carbón (Neutral de Soporte)
        '--header-hover-bg': '#1F2937',
        '--badge-bg': '#F3F4F6',
        '--badge-text': '#1F2937',
        '--button-bg': '#374151',       // Botón coincide con la cabecera
        '--button-hover-bg': '#1F2937',
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
