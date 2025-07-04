// src/components/SalonCardSkeleton.jsx
import React from 'react';
import './SalonCardSkeleton.css'; // Crearemos este archivo para los estilos

function SalonCardSkeleton() {
  return (
    <div className="salon-card-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-gallery-hint"></div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-info-row">
          <div className="skeleton-badge"></div>
          <div className="skeleton-price-group">
            <div className="skeleton-price"></div>
            <div className="skeleton-price-original"></div>
          </div>
        </div>
        <div className="skeleton-price-hint"></div>
        <div className="skeleton-comodidades-section">
          <div className="skeleton-comodidades-title"></div>
          <div className="skeleton-comodidades-tags">
            <div className="skeleton-tag"></div>
            <div className="skeleton-tag"></div>
            <div className="skeleton-tag"></div>
          </div>
        </div>
        <div className="skeleton-action">
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );
}

export default SalonCardSkeleton;
