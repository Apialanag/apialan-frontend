// src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import '../App.css';
import SalonList from '../components/SalonList';
import IndicadorPasos from '../components/IndicadorPasos';
import Paso2_SeleccionFecha from '../components/Paso2_SeleccionFecha';
import Paso3_SeleccionHorario from '../components/Paso3_SeleccionHorario';
import Paso4_DatosYResumen from '../components/Paso4_DatosYResumen';
// 1. Importamos el nuevo modal que creamos
import SocioValidationModal from '../components/SocioValidationModal'; 

function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  
  // --- Estados para el nuevo flujo ---
  const [esSocioValidado, setEsSocioValidado] = useState(false);
  const [nombreSocio, setNombreSocio] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [costoCalculado, setCostoCalculado] = useState(0);
  const [duracionCalculada, setDuracionCalculada] = useState(0);

  // Tu lógica de precios no cambia, pero ahora usa 'esSocioValidado'
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
  
  // Función que se llamará desde el modal cuando la validación sea exitosa
  const handleValidationSuccess = (socioData) => {
    setNombreSocio(socioData.nombre_completo); // Guardamos el nombre del socio
    setEsSocioValidado(true);
  };
  
  // Las demás funciones de navegación y éxito se mantienen igual
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
    setEsSocioValidado(false);
    setNombreSocio('');
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="vista-seleccion-salon">
            {/* --- INICIO DE LA NUEVA INTERFAZ DE VALIDACIÓN --- */}
            {esSocioValidado ? (
              <div className="welcome-socio-banner">
                ¡Bienvenido/a, {nombreSocio}! Tienes precios preferenciales.
              </div>
            ) : (
              <p className="socio-link">
                ¿Eres socio/a? <button onClick={() => setIsModalOpen(true)}>Valida tu RUT aquí para acceder a tus beneficios.</button>
              </p>
            )}

            <h2 style={{ marginTop: esSocioValidado ? '1rem' : '0' }}>Paso 1: Seleccione un Espacio</h2>
            <p>Haga clic en una tarjeta para ver su disponibilidad y comenzar su reserva.</p>
            <SalonList onSalonSelect={handleSelectSalon} esSocio={esSocioValidado} />
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
            costoCalculado={costoCalculado}
            duracionCalculada={duracionCalculada}
            onReservationSuccess={handleReservationSuccess}
            prevStep={prevStep}
            // Importante: le pasamos el estado de validación
            esSocio={esSocioValidado}
          />
        );
      default:
        setCurrentStep(1);
        return <SalonList onSalonSelect={handleSelectSalon} esSocio={esSocioValidado} />;
    }
  };

  return (
    <>
      {/* El modal se renderiza aquí si isModalOpen es true */}
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