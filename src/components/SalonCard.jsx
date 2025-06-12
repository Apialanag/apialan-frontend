// src/components/SalonCard.jsx
import React from 'react';
import './SalonCard.css'; // Mantenemos el CSS base para la estructura

// --- INICIO DE LA SOLUCIÓN ---
// Esta función crea un componente oculto que contiene todas las clases dinámicas.
// Esto fuerza a Tailwind CSS a incluir estos estilos en el archivo CSS final.
const TailwindSafelist = () => (
  <div className="hidden">
    <div className="bg-[#050269] hover:bg-[#040156] bg-[#e0e0ff] text-[#050269]"></div>
    <div className="bg-[#1a1783] hover:bg-[#131270] bg-[#e5e5ff] text-[#1a1783]"></div>
    <div className="bg-[#2f2c9c] hover:bg-[#252289] bg-[#eaeaff] text-[#2f2c9c]"></div>
  </div>
);
// --- FIN DE LA SOLUCIÓN ---

function SalonCard({ salon, onSelect, isSelected }) {
  
  // Función para obtener los colores correctos según el nombre del espacio
  const getEspacioColorStyles = (nombreEspacio) => {
    if (nombreEspacio.includes('Grande')) {
      return {
        header: 'bg-[#050269]',
        hover: 'hover:bg-[#040156]',
        badge: 'bg-[#e0e0ff] text-[#050269]'
      };
    } else if (nombreEspacio.includes('Mediana')) {
      return {
        header: 'bg-[#1a1783]',
        hover: 'hover:bg-[#131270]',
        badge: 'bg-[#e5e5ff] text-[#1a1783]'
      };
    } else { // Por defecto, se asume que es la Sala Pequeña
      return {
        header: 'bg-[#2f2c9c]',
        hover: 'hover:bg-[#252289]',
        badge: 'bg-[#eaeaff] text-[#2f2c9c]'
      };
    }
  };

  const colorStyles = getEspacioColorStyles(salon.nombre);

  return (
    <div
      className={`salon-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(salon)}
    >
      <div className={`card-header ${colorStyles.header}`}>
        <h3 className="card-title">{salon.nombre}</h3>
      </div>
      <div className="card-body">
        <div className="card-info-row">
          <span className={`info-badge ${colorStyles.badge}`}>
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
          <div className={`boton-reservar-card ${colorStyles.header} ${colorStyles.hover}`}>
            {isSelected ? 'Seleccionado ✓' : 'Seleccionar este Espacio'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalonCard;
