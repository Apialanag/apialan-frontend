// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Asegúrate de que el archivo CSS está importado

function SalonCard({ salon, onSelect, isSelected }) {
  
  const getHeaderColorClass = () => {
    if (salon.nombre.includes('Grande')) return 'header-grande';
    if (salon.nombre.includes('Mediana')) return 'header-mediana';
    if (salon.nombre.includes('Pequeña')) return 'header-pequena';
    return 'header-default';
  };

  return (
    // Aplicamos la clase base 'salon-card' y la clase condicional 'selected'
    // El onClick llama a la función 'onSelect' que recibe de su padre (App o SalonList)
    <div 
      className={`salon-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(salon)}
    >
      <div className={`card-header ${getHeaderColorClass()}`}>
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
