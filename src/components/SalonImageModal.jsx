// src/components/SalonImageModal.jsx
import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Importa los estilos del carrusel
import './SalonImageModal.css';

function SalonImageModal({ isOpen, onClose, images }) {
  if (!isOpen) {
    return null;
  }

  // Asegúrate de que images sea un array y no esté vacío
  const validImages = Array.isArray(images) && images.length > 0 ? images : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        {validImages.length > 0 ? (
          <Carousel showThumbs={false} infiniteLoop useKeyboardArrows autoPlay>
            {validImages.map((image, index) => (
              <div key={index}>
                <img src={image} alt={`Salón imagen ${index + 1}`} className="carousel-image" />
              </div>
            ))}
          </Carousel>
        ) : (
          <p>No hay imágenes disponibles para este salón.</p>
        )}
      </div>
    </div>
  );
}

export default SalonImageModal;
