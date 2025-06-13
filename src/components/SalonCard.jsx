
// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css';

function SalonCard({ salon, onSelect, isSelected, esSocio }) {
  
  const getEspacioColorStyles = (nombreEspacio) => {
    const corporateColors = {
      '--button-bg': '#4f46e5',
      '--button-hover-bg': '#4338ca',
      '--badge-bg': '#e0e7ff',
      '--badge-text': '#4338ca',
    };

    if (nombreEspacio.includes('Grande')) {
      return { ...corporateColors, '--header-bg': '#3730a3' };
    } else if (nombreEspacio.includes('Mediana')) {
      return { ...corporateColors, '--header-bg': '#2563EB' };
    } else {
      return { ...corporateColors, '--header-bg': '#60A5FA' };
    }
  };

  const cssVariables = getEspacioColorStyles(salon.nombre);

  const getPrecioSocio = (salon) => {
    if (salon.nombre.includes('Grande')) return 5000;
    if (salon.nombre.includes('Mediana')) return 4000;
    if (salon.nombre.includes('Pequeña')) return 3000;
    return salon.precio_por_hora;
  };
  
  const precioSocio = getPrecioSocio(salon);
  const precioNormalFormateado = new Intl.NumberFormat('es-CL').format(salon.precio_por_hora);
  const precioSocioFormateado = new Intl.NumberFormat('es-CL').format(precioSocio);

  return (
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
          <div style={{ textAlign: 'right' }}>
            {esSocio && (
              <span className="price-tag" style={{ color: '#DC2626', display: 'block' }}>
                ${precioSocioFormateado}/hr
              </span>
            )}
            <span 
              className="price-tag" 
              style={{ 
                textDecoration: esSocio ? 'line-through' : 'none',
                textDecorationColor: esSocio ? '#ef4444' : 'inherit',
                color: esSocio ? '#9ca3af' : 'inherit',
                fontSize: esSocio ? '0.9em' : '1.125em'
              }}
            >
              ${precioNormalFormateado}/hr
            </span>
          </div>
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
