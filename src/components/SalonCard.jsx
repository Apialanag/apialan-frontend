// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Mantenemos el CSS para la estructura

// Se añade la prop "esSocio" para recibirla desde BookingPage.jsx
function SalonCard({ salon, onSelect, isSelected, esSocio }) {
  
  // Se mantiene tu paleta de colores final aprobada
  const getEspacioColorStyles = (nombreEspacio) => {
    const corporateColors = {
      '--button-bg': '#4f46e5',
      '--button-hover-bg': '#4338ca',
      '--badge-bg': '#e0e7ff',
      '--badge-text': '#4338ca',
    };

    if (nombreEspacio.includes('Grande')) {
      return {
        ...corporateColors,
        '--header-bg': '#3730a3', // Azul oscuro y premium
      };
    } else if (nombreEspacio.includes('Mediana')) {
      return {
        ...corporateColors,
        '--header-bg': '#2563EB', // Azul celeste / vivo
      };
    } else { // Por defecto, para la Sala Pequeña
      return {
        ...corporateColors,
        '--header-bg': '#60A5FA', // Azul más claro y accesible
      };
    }
  };

  const cssVariables = getEspacioColorStyles(salon.nombre);

  // Lógica para obtener el precio de socio
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
          
          {/* Visualización de precios dinámicos actualizada */}
          <div style={{ textAlign: 'right' }}>
            {esSocio && (
              <span className="price-tag" style={{ color: '#16a34a', display: 'block' }}>
                ${precioSocioFormateado}/hr
              </span>
            )}
            <span 
              className="price-tag" 
              style={{ 
                textDecoration: esSocio ? 'line-through' : 'none',
                textDecorationColor: esSocio ? '#ef4444' : 'inherit', // Línea roja
                color: esSocio ? '#9ca3af' : 'inherit', // Gris para el precio tachado
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
