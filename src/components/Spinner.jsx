import React from 'react';
import './Spinner.css';

const Spinner = ({ message = 'Procesando...' }) => {
  return (
    <div className="spinner-overlay">
      <div className="spinner-container">
        <div className="spinner-icon"></div>
        <p className="spinner-message">{message}</p>
      </div>
    </div>
  );
};

export default Spinner;
