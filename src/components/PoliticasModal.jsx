import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './PoliticasModal.css';

const PoliticasModal = ({ onClose }) => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    fetch('/politicas.md')
      .then(response => response.text())
      .then(text => setMarkdown(text))
      .catch(error => console.error('Error al cargar las políticas:', error));
  }, []);

  return (
    <div className="modal-backdrop-politicas">
      <div className="modal-content-politicas">
        <div className="modal-header-politicas">
          <h2>Políticas de Uso de las Instalaciones</h2>
          <button onClick={onClose} className="modal-close-button-politicas">&times;</button>
        </div>
        <div className="modal-body-politicas">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PoliticasModal;