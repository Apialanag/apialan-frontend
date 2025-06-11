// src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import '../App.css'; // Usamos los estilos principales
import SalonList from '../components/SalonList';
import IndicadorPasos from '../components/IndicadorPasos';
import Paso2_SeleccionFecha from '../components/Paso2_SeleccionFecha';
import Paso3_SeleccionHorario from '../components/Paso3_SeleccionHorario';
import Paso4_DatosYResumen from '../components/Paso4_DatosYResumen';

function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  
  // Estados calculados, que viven en este componente padre
  const [costoCalculado, setCostoCalculado] = useState(0);
  const [duracionCalculada, setDuracionCalculada] = useState(0);

  // useEffect para calcular costo y duración. Es la "única fuente de verdad".
  useEffect(() => {
    if (salonSeleccionado && horaInicio && horaTermino) {
      const hInicioNum = parseInt(horaInicio.split(':')[0]);
      const hTerminoNum = parseInt(horaTermino.split(':')[0]);
      if (hTerminoNum > hInicioNum) {
        const duracion = hTerminoNum - hInicioNum;
        setDuracionCalculada(duracion);
        setCostoCalculado(duracion * parseFloat(salonSeleccionado.precio_por_hora));
      } else {
        setDuracionCalculada(0);
        setCostoCalculado(0);
      }
    } else {
      setDuracionCalculada(0);
      setCostoCalculado(0);
    }
  }, [salonSeleccionado, horaInicio, horaTermino]);

  const nextStep = () => { if (currentStep < totalSteps) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
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
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="vista-seleccion-salon">
            <h2>Paso 1: Seleccione un Espacio</h2>
            <p>Haga clic en una tarjeta para ver su disponibilidad y comenzar su reserva.</p>
            <SalonList onSalonSelect={handleSelectSalon} />
          </div>
        );
      case 2:
        return (
          <Paso2_SeleccionFecha 
            salonSeleccionado={salonSeleccionado}
            fechaSeleccionada={fechaSeleccionada}
            setFechaSeleccionada={setFechaSeleccionada}
            nextStep={nextStep}
            prevStep={() => handleSelectSalon(null)} 
          />
        );
      case 3:
        return (
          <Paso3_SeleccionHorario 
            salonSeleccionado={salonSeleccionado}
            fechaSeleccionada={fechaSeleccionada}
            horaInicio={horaInicio}
            setHoraInicio={setHoraInicio}
            horaTermino={horaTermino}
            setHoraTermino={setHoraTermino}
            costoCalculado={costoCalculado}
            duracionCalculada={duracionCalculada}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <Paso4_DatosYResumen 
            salonSeleccionado={salonSeleccionado}
            fechaSeleccionada={fechaSeleccionada}
            horaInicio={horaInicio}
            horaTermino={horaTermino}
            // *** CORRECCIÓN CLAVE: Pasamos los valores calculados como props ***
            costoCalculado={costoCalculado}
            duracionCalculada={duracionCalculada}
            onReservationSuccess={handleReservationSuccess}
            prevStep={prevStep}
          />
        );
      default:
        setCurrentStep(1);
        return <SalonList onSalonSelect={handleSelectSalon} />;
    }
  };

  return (
    <>
      {currentStep > 1 && <IndicadorPasos currentStep={currentStep} totalSteps={totalSteps} goToStep={goToStep} />}
      {renderStep()}
    </>
  );
}

export default BookingPage;

