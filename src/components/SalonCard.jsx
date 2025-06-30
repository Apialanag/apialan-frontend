
// src/components/SalonCard.jsx
import React, { useState } from 'react';
import './SalonCard.css';
import SalonImageModal from './SalonImageModal'; // Importar el modal

function SalonCard({ salon, onSelect, isSelected, esSocio }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    // Si hay fotos, abre el modal. Si no, ejecuta la acción de selección.
    // Opcionalmente, podrías querer que siempre se seleccione y además se abra el modal si hay fotos.
    // En este caso, el modal se abre independientemente de la selección.
    // Si el modal debe abrirse EN LUGAR de onSelect, la lógica cambiaría.
    // Por ahora, onSelect se llama desde el botón, y el clic en la card abre el modal.
    if (salon.fotos && salon.fotos.length > 0) {
      setIsModalOpen(true);
    } else {
      // Si no hay fotos, se puede ejecutar onSelect directamente o no hacer nada.
      // Para este ejemplo, si no hay fotos, no hacemos nada especial al hacer clic en la card
      // y dejamos que el botón "Seleccionar" maneje la selección.
      // Si quieres que el clic en la card también seleccione, puedes llamar a onSelect(salon) aquí.
      console.log("No hay fotos para mostrar en el modal.");
    }
  };

  const handleOpenModal = (e) => {
    // Detiene la propagación para evitar que onSelect se active si el modal se abre
    // desde un clic que también podría interpretarse como una selección.
    e.stopPropagation();
    if (salon.fotos && salon.fotos.length > 0) {
      setIsModalOpen(true);
    } else {
      // Si no hay fotos, y el usuario hizo clic en un área que pensó abriría fotos,
      // podrías querer seleccionar el salón. O simplemente no hacer nada.
      // Para mantener la lógica original de selección a través del botón:
      console.log("No hay fotos para mostrar.");
      // Si el clic en la card (no en el botón) debe seleccionar si no hay fotos:
      // onSelect(salon);
    }
  };


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
    <>
      <div
        className={`salon-card ${isSelected ? 'selected' : ''}`}
        // onClick={() => onSelect(salon)} // El clic general ahora puede abrir el modal
        onClick={handleCardClick} // Usar handleCardClick para la lógica del modal/selección
        style={cssVariables}
      >
        <div className="card-header" onClick={handleOpenModal} style={{ cursor: (salon.fotos && salon.fotos.length > 0) ? 'pointer' : 'default' }}>
          <h3 className="card-title">{salon.nombre}</h3>
          {(salon.fotos && salon.fotos.length > 0) && (
            <span className="view-gallery-hint">Ver galería</span>
          )}
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
          {/* Asegurarse de que el botón de seleccionar todavía funcione como se espera */}
          {/* Si el clic en la tarjeta abre el modal, el botón podría ser solo para seleccionar */}
          <div className="boton-reservar-card" onClick={(e) => { e.stopPropagation(); onSelect(salon); }}>
            {isSelected ? 'Seleccionado ✓' : 'Seleccionar este Espacio'}
          </div>
        </div>
      </div>
    </div>
    <SalonImageModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      images={salon.fotos || []} // Pasar las fotos del salón
    />
  </>
  );
}

export default SalonCard;
