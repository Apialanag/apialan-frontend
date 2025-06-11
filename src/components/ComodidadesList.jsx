    // src/components/ComodidadesList.jsx
    import React from 'react';
    import { FaWifi, FaTachometerAlt, FaVideo, FaFan, FaRegLightbulb, FaToilet, FaCoffee } from 'react-icons/fa';
    import './ComodidadesList.css';

    // Mapeo de nombres de comodidades a sus iconos correspondientes
    const iconMap = {
      'Proyector': <FaVideo />,
      'Buena iluminación': <FaRegLightbulb />,
      'Baños': <FaToilet />,
      'WIFI alta velocidad': <FaWifi />,
      'Aire Acondicionado': <FaFan />,
      'Kitchenette': <FaCoffee />
      // Añade más si es necesario
    };

    function ComodidadesList({ comodidades }) {
      return (
        <div className="comodidades-list">
          <h4>Comodidades Incluidas</h4>
          <ul>
            {comodidades.map((item, index) => (
              <li key={index}>
                <span className="comodidad-icon">{iconMap[item] || <FaTachometerAlt />}</span>
                <span className="comodidad-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    export default ComodidadesList;