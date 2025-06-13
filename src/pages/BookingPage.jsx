// src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import '../App.css';
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
  const [esSocio, setEsSocio] = useState(false);
  const [costoCalculado, setCostoCalculado] = useState(0);
  const [duracionCalculada, setDuracionCalculada] = useState(0);

  // Tu lógica de cálculo de precios y manejo de estado se mantiene intacta
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
        const precioHora = getPrecioPorHora(salonSeleccionado, esSocio);
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
  }, [salonSeleccionado, horaInicio, horaTermino, esSocio]);

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
            {/* --- INICIO DE LA SECCIÓN CORREGIDA --- */}
            {/* Se usa un layout de 3 columnas con flexbox para centrar el título */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
              <div style={{ flex: 1 }}>{/* Espaciador izquierdo */}</div>
              <div style={{ flex: 'none', textAlign: 'center' }}>
                <h2>Paso 1: Seleccione un Espacio</h2>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <label htmlFor="user-type-selector" style={{ marginRight: '10px', fontSize: '1em', color: '#4b5563' }}>Tipo de Reserva:</label>
                <select 
                  id="user-type-selector"
                  value={esSocio ? 'socio' : 'publico'}
                  onChange={(e) => setEsSocio(e.target.value === 'socio')}
                  style={{ padding: '8px 12px', fontSize: '1em', borderRadius: '8px', border: '1px solid #ccc' }}
                >
                  <option value="publico">Público General</option>
                  <option value="socio">Socio/a Apialan AG</option>
                </select>
              </div>
            </div>
            {/* --- FIN DE LA SECCIÓN CORREGIDA --- */}

            <p>Haga clic en una tarjeta para ver su disponibilidad y comenzar su reserva.</p>
            <SalonList onSalonSelect={handleSelectSalon} esSocio={esSocio} />
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
            esSocio={esSocio}
          />
        );
      default:
        setCurrentStep(1);
        return <SalonList onSalonSelect={handleSelectSalon} esSocio={esSocio} />;
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
