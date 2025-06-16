// src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import '../App.css';
import SalonList from '../components/SalonList';
import IndicadorPasos from '../components/IndicadorPasos';
import Paso2_SeleccionFecha from '../components/Paso2_SeleccionFecha';
import Paso3_SeleccionHorario from '../components/Paso3_SeleccionHorario';
import Paso4_DatosYResumen from '../components/Paso4_DatosYResumen';
import SocioValidationModal from '../components/SocioValidationModal'; 

function BookingPage() {
  // --- Estados y lógica se mantienen igual que en tu versión ---
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [esSocioValidado, setEsSocioValidado] = useState(false);
  const [nombreSocio, setNombreSocio] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [costoCalculado, setCostoCalculado] = useState(0);
  const [duracionCalculada, setDuracionCalculada] = useState(0);

  const getPrecioPorHora = (salon, esSocio) => {
    if (!salon) return 0;
    if (esSocio) {
      if (salon.nombre.includes('Grande')) return 5000;
      if (salon.nombre.includes('Mediana')) return 4000;
      if (salon.nombre.includes('Pequeña')) return 3000;
    }
    return parseFloat(salon.precio_por_hora);
  };

  useEffect(() => {
    if (salonSeleccionado && horaInicio && horaTermino) {
      const hInicioNum = parseInt(horaInicio.split(':')[0]);
      const hTerminoNum = parseInt(horaTermino.split(':')[0]);
      if (hTerminoNum > hInicioNum) {
        const duracion = hTerminoNum - hInicioNum;
        const precioHora = getPrecioPorHora(salonSeleccionado, esSocioValidado);
        setDuracionCalculada(duracion);
        setCostoCalculado(duracion * precioHora);
      } else {
        setDuracionCalculada(0);
        setCostoCalculado(0);
      }
    } else {
      setDuracionCalculada(0);
      setCostoCalculado(0);
    }
  }, [salonSeleccionado, horaInicio, horaTermino, esSocioValidado]);
  
  const handleValidationSuccess = (socioData) => {
    setNombreSocio(socioData.nombre_completo);
    setEsSocioValidado(true);
  };
  
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
  const goToStep = (step) => { if (step < currentStep) setCurrentStep(step); };
  
  const handleSelectSalon = (salon) => {
    setSalonSeleccionado(salon);
    setFechaSeleccionada(null);
    setHoraInicio('');
    setHoraTermino('');
    if(salon){
      nextStep();
    } else {
      setCurrentStep(1);
    }
  };

  const handleReservationSuccess = () => {
    setSalonSeleccionado(null);
    setFechaSeleccionada(null);
    setHoraInicio('');
    setHoraTermino('');
    setCurrentStep(1);
    setEsSocioValidado(false);
    setNombreSocio('');
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="vista-seleccion-salon">
            {/* --- INICIO DE LA NUEVA INTERFAZ DE TÍTULO --- */}
            <div className="step-header">
              <div className="step-header-spacer"></div>
              <div className="step-header-title">
                <h2>Paso 1: Seleccione un Espacio</h2>
              </div>
              <div className="socio-validation-container">
                {esSocioValidado ? (
                  <div className="welcome-socio-banner-small">
                    ✓ Socio Verificado
                  </div>
                ) : (
                  <button onClick={() => setIsModalOpen(true)} className="socio-validate-button">
                    ¿Eres Socio/a?
                  </button>
                )}
              </div>
            </div>

            {esSocioValidado ? (
              <p className="welcome-socio-message">
                ¡Bienvenido/a, {nombreSocio}! Ya puedes ver tus precios preferenciales.
              </p>
            ) : (
              <p>Haga clic en una tarjeta para ver su disponibilidad y comenzar su reserva.</p>
            )}
            
            <SalonList onSalonSelect={handleSelectSalon} esSocio={esSocioValidado} />
          </div>
        );
      case 2:
        return <Paso2_SeleccionFecha salonSeleccionado={salonSeleccionado} fechaSeleccionada={fechaSeleccionada} setFechaSeleccionada={setFechaSeleccionada} nextStep={nextStep} prevStep={() => handleSelectSalon(null)} />;
      case 3:
        return <Paso3_SeleccionHorario salonSeleccionado={salonSeleccionado} fechaSeleccionada={fechaSeleccionada} horaInicio={horaInicio} setHoraInicio={setHoraInicio} horaTermino={horaTermino} setHoraTermino={setHoraTermino} costoCalculado={costoCalculado} duracionCalculada={duracionCalculada} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <Paso4_DatosYResumen salonSeleccionado={salonSeleccionado} fechaSeleccionada={fechaSeleccionada} horaInicio={horaInicio} horaTermino={horaTermino} costoCalculado={costoCalculado} duracionCalculada={duracionCalculada} onReservationSuccess={handleReservationSuccess} prevStep={prevStep} esSocio={esSocioValidado} />;
      default:
        return <SalonList onSalonSelect={handleSelectSalon} esSocio={esSocioValidado} />;
    }
  };

  return (
    <>
      {isModalOpen && (
        <SocioValidationModal 
          onClose={() => setIsModalOpen(false)} 
          onValidationSuccess={handleValidationSuccess} 
        />
      )}
      {currentStep > 1 && <IndicadorPasos currentStep={currentStep} totalSteps={totalSteps} goToStep={goToStep} />}
      {renderStep()}
    </>
  );
}

export default BookingPage;