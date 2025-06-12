// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Mantenemos el CSS para la estructura

function SalonCard({ salon, onSelect, isSelected }) {
  
  // --- PALETA DE DISEÑO UNIFICADA ---
  // Define un único conjunto de colores para todas las tarjetas.
  const colorStyles = {
    '--header-bg': '#4f46e5',        // Azul Corporativo para TODAS las cabeceras
    '--badge-bg': '#eef2ff',         // Un único color de badge para consistencia
    '--badge-text': '#4338ca',
    '--button-bg': '#B91C1C',       // Rojo Corporativo para el botón de ACCIÓN
    '--button-hover-bg': '#991B1B', // Rojo más oscuro para el hover
  };

  return (
    // Aplicamos las variables CSS al contenedor principal de la tarjeta
    <div
      className={`salon-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(salon)}
      style={colorStyles}
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
