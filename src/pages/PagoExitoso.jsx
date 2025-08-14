import React from 'react';
import { Link } from 'react-router-dom';
import './PagoExitoso.css'; // Asegúrate de crear este archivo CSS

const PagoExitoso = () => {
  return (
    <div className="pago-exitoso-container">
      <div className="pago-exitoso-card">
        <div className="pago-exitoso-icono-check">✔</div>
        <h1>¡Pago Exitoso!</h1>
        <p>Tu reserva ha sido confirmada con éxito.</p>
        <p>Hemos enviado un correo electrónico con los detalles de tu reserva. Si no lo encuentras, por favor revisa tu carpeta de spam.</p>
        <div className="pago-exitoso-acciones">
          <Link to="/" className="boton-volver-inicio">Volver al Inicio</Link>
          {/* Opcional: podrías añadir un botón para ver "Mis Reservas" si tienes esa página */}
          {/* <Link to="/mis-reservas" className="boton-secundario">Ver Mis Reservas</Link> */}
        </div>
      </div>
    </div>
  );
};

export default PagoExitoso;
