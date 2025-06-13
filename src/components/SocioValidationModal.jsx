// src/components/SocioValidationModal.jsx
import React, { useState } from 'react';
import api from '../api'; // Usaremos esto para la validación
import './SocioValidationModal.css'; // Crearemos este archivo para los estilos

function SocioValidationModal({ onClose, onValidationSuccess }) {
  const [rut, setRut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!rut.trim()) {
      setError('Por favor, ingresa un RUT.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Este es el nuevo endpoint que crearemos en el backend
      const response = await api.post('/socios/validar', { rut });
      
      // El backend nos devuelve el nombre del socio si es válido
      const socioData = response.data;
      onValidationSuccess(socioData); // Llama a la función del padre con los datos
      onClose(); // Cierra el modal

    } catch (err) {
      console.error("Error de validación:", err);
      setError(err.response?.data?.error || 'RUT no encontrado o inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Validación de Socio/a</h2>
        <p>Ingresa tu RUT para acceder a los precios y beneficios de socio.</p>
        <form onSubmit={handleValidate}>
          <div className="form-group">
            <label htmlFor="rut-socio">RUT</label>
            <input
              type="text"
              id="rut-socio"
              placeholder="Ej: 12.345.678-9"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="boton-secundario">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="boton-principal">
              {loading ? 'Validando...' : 'Validar RUT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SocioValidationModal;
