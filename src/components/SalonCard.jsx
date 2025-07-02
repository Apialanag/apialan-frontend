
// src/components/SalonCard.jsx
import React, { useState } from 'react';
import './SalonCard.css';
import SalonImageModal from './SalonImageModal'; // Importar el modal

function SalonCard({ salon, onSelect, isSelected, esSocio }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Esta función se llamará cuando se haga clic en el área general de la tarjeta.
  // Su única responsabilidad será llamar a onSelect.
  const handleSelectSalon = () => {
    onSelect(salon);
  };

  // Esta función se llamará SOLO cuando se haga clic en el área del header (o el hint "Ver galería").
  // Se encargará de abrir el modal SI hay fotos.
  const handleOpenGalleryModal = (e) => {
    // Detenemos la propagación para evitar que el clic en el header
    // también active handleSelectSalon si el header está dentro del div principal de la tarjeta.
    e.stopPropagation();
    if (salon.fotos && salon.fotos.length > 0) {
      setIsModalOpen(true);
    }
    // Si no hay fotos, no hacemos nada, ya que el clic fue específicamente para abrir la galería.
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

  // Asumiendo que la API ahora devuelve precio_neto_por_hora y precio_neto_socio_por_hora
  // y que el backend ya hizo la conversión de precios totales a netos.
  // Si precio_neto_socio_por_hora no viene en el objeto salon, usamos una lógica similar a la anterior
  // pero con los nombres de campo actualizados y asumiendo que los valores son netos.
  const IVA_RATE = 0.19;

  const getPrecioNetoSocio = (salon) => {
    // Si la API ya provee 'precio_neto_socio_por_hora', usarlo directamente.
    if (salon.precio_neto_socio_por_hora) {
      return parseFloat(salon.precio_neto_socio_por_hora);
    }
    // Lógica de fallback si 'precio_neto_socio_por_hora' no está definido directamente en el salón
    // y se basa en el nombre (esto debería actualizarse si la API cambia).
    // Estos serían precios NETOS para socios.
    if (salon.nombre.includes('Grande')) return Math.round(5000 / (1 + IVA_RATE)); // Ejemplo: si 5000 era el total
    if (salon.nombre.includes('Mediana')) return Math.round(4000 / (1 + IVA_RATE)); // Ejemplo: si 4000 era el total
    if (salon.nombre.includes('Pequeña')) return Math.round(3000 / (1 + IVA_RATE)); // Ejemplo: si 3000 era el total
    return parseFloat(salon.precio_neto_por_hora); // Si no hay precio socio específico, socio paga precio normal neto
  };

  const precioNetoNormal = parseFloat(salon.precio_neto_por_hora);
  const precioNetoSocio = getPrecioNetoSocio(salon);

  // Para mostrar en la tarjeta, generalmente se muestra el precio final (total con IVA)
  const precioTotalNormal = Math.round(precioNetoNormal * (1 + IVA_RATE));
  const precioTotalSocio = Math.round(precioNetoSocio * (1 + IVA_RATE));

  const precioTotalNormalFormateado = new Intl.NumberFormat('es-CL').format(precioTotalNormal);
  const precioTotalSocioFormateado = new Intl.NumberFormat('es-CL').format(precioTotalSocio);

  return (
    <>
      <div
        className={`salon-card ${isSelected ? 'selected' : ''}`}
        onClick={handleSelectSalon} // Clic en la tarjeta general selecciona el salón
        style={cssVariables}
      >
        {/* El div del header ahora solo es responsable de abrir la galería */}
        <div
          className="card-header"
          onClick={(salon.fotos && salon.fotos.length > 0) ? handleOpenGalleryModal : undefined}
          style={{ cursor: (salon.fotos && salon.fotos.length > 0) ? 'pointer' : 'default' }}
        >
          <h3 className="card-title">{salon.nombre}</h3>
          {(salon.fotos && salon.fotos.length > 0) && (
            <span className="view-gallery-hint" onClick={handleOpenGalleryModal}> {/* También permite clic en el hint */}
              Ver galería
            </span>
          )}
        </div>
        {/* El resto del cuerpo de la tarjeta. Si se hace clic aquí, se seleccionará el salón debido al onClick en el div principal. */}
        <div className="card-body">
        <div className="card-info-row">
          <span className="info-badge">
            Capacidad: {salon.capacidad} personas
          </span>
          <div style={{ textAlign: 'right' }}>
            {esSocio && (
              <span className="price-tag" style={{ color: '#DC2626', display: 'block' }}>
                ${precioTotalSocioFormateado}/hr
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
              ${precioTotalNormalFormateado}/hr
            </span>
          </div>
        </div>
        <div className="price-breakdown-hint">
          *Precios por hora con IVA incluido.
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
          {/* El botón de seleccionar explícitamente sigue funcionando igual,
              deteniendo la propagación para no interferir con el onClick del div padre (handleSelectSalon)
              si ya está haciendo lo mismo. Aunque en este caso, onSelect(salon) es la misma acción.
              La propagación es más crucial si el botón hiciera algo diferente.
          */}
          <div className="boton-reservar-card" onClick={(e) => {
              e.stopPropagation(); // Buena práctica mantenerlo
              onSelect(salon);
            }}>
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
