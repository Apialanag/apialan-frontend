// src/components/IndicadorPasos.jsx
import React from 'react';
import './IndicadorPasos.css';
import { FaCheck } from 'react-icons/fa'; // Necesitarás: npm install react-icons

function IndicadorPasos({ currentStep, totalSteps, goToStep }) {
  const steps = Array.from({ length: totalSteps }, (_, i) => ({
    number: i + 1,
    isCompleted: i + 1 < currentStep,
    isActive: i + 1 === currentStep,
  }));

  const stepLabels = ["Espacio", "Fecha", "Horario", "Datos"];

  return (
    <div className="indicador-container">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="step-wrapper">
            <div 
              className={`step-item ${step.isActive ? 'active' : ''} ${step.isCompleted ? 'completed' : ''}`}
              // Permitir hacer clic en pasos completados para volver
              onClick={() => step.isCompleted && goToStep(step.number)}
            >
              {step.isCompleted ? <FaCheck /> : step.number}
            </div>
            <div className="step-label">{stepLabels[index]}</div>
          </div>
          {index < steps.length - 1 && <div className={`step-connector ${step.isCompleted ? 'completed' : ''}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default IndicadorPasos;
