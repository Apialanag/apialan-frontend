import React from 'react';
import { Link } from 'react-router-dom';
import './PagoFallido.css'; // Asegúrate de crear este archivo CSS

const PagoFallido = () => {
  return (
    <div className="pago-fallido-container">
      <div className="pago-fallido-card">
        <div className="pago-fallido-icono-cruz">✕</div>
        <h1>Error en el Pago</h1>
        <p>Lamentablemente, no pudimos procesar tu pago.</p>
        <p>
          Puedes intentarlo de nuevo o contactar a nuestro soporte si el problema persiste.
          No se ha realizado ningún cargo a tu cuenta.
        </p>
        <div className="pago-fallido-acciones">
          <Link to="/reservar" className="boton-reintentar-pago">Intentar de Nuevo</Link>
          <Link to="/" className="boton-secundario">Volver al Inicio</Link>
        </div>
      </div>
    </div>
  );
};

export default PagoFallido;
