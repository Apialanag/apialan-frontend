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
  const [socioData, setSocioData] = useState(null);
  // nombreSocio se puede derivar de socioData.nombre_completo, así que no necesitamos un estado separado.
  // const [nombreSocio, setNombreSocio] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [costoCalculado, setCostoCalculado] = useState(0); // Reemplazado por desglosePrecio
  const [desglosePrecio, setDesglosePrecio] = useState({
    netoOriginal: 0, // Neto antes de cualquier cupón, pero después de descuento de socio
    montoDescuentoCupon: 0,
    netoConDescuento: 0, // Neto final después de cupón (sobre este se calcula el IVA)
    iva: 0,
    total: 0
  });
  const [duracionCalculada, setDuracionCalculada] = useState(0);

  // Estados para cupones
  const [codigoCuponInput, setCodigoCuponInput] = useState(''); // Para el input en Paso4
  const [cuponAplicado, setCuponAplicado] = useState(null); // { codigo, montoDescontado, mensaje, netoOriginalParaCalculo }
  const [errorCupon, setErrorCupon] = useState('');
  const [validandoCupon, setValidandoCupon] = useState(false);


  const IVA_RATE = 0.19; // Definir la tasa de IVA globalmente aquí o importarla

  const getPrecioNetoPorHora = (salon, esSocioParam) => {
    if (!salon) return 0;

    // Usar precio_neto_socio_por_hora si es socio y esa propiedad existe
    if (esSocioParam && salon.precio_neto_socio_por_hora) {
      return parseFloat(salon.precio_neto_socio_por_hora);
    }
    // Usar precio_neto_por_hora si no es socio o si no hay precio específico de socio
    if (salon.precio_neto_por_hora) {
      return parseFloat(salon.precio_neto_por_hora);
    }

    // Lógica de fallback MUY BÁSICA si los campos netos no vienen de la API (esto debería evitarse)
    // Esto asume que los precios hardcodeados (5000, 4000, 3000) eran precios TOTALES.
    // Y que salon.precio_por_hora también era TOTAL.
    // ESTA LÓGICA DE FALLBACK DEBERÍA SER REVISADA O ELIMINADA SI LA API YA ENVÍA LOS NETOS CORRECTAMENTE.
    console.warn("Usando lógica de fallback para precios netos. Asegúrate que la API envíe precios netos.");
    let precioTotalFallback = 0;
    if (esSocioParam) {
      if (salon.nombre.includes('Grande')) precioTotalFallback = 5000;
      else if (salon.nombre.includes('Mediana')) precioTotalFallback = 4000;
      else if (salon.nombre.includes('Pequeña')) precioTotalFallback = 3000;
      else precioTotalFallback = parseFloat(salon.precio_por_hora || 0); // Asume que precio_por_hora es el total normal
    } else {
      precioTotalFallback = parseFloat(salon.precio_por_hora || 0); // Asume que precio_por_hora es el total normal
    }
    return Math.round(precioTotalFallback / (1 + IVA_RATE));
  };

  useEffect(() => {
    if (salonSeleccionado && horaInicio && horaTermino) {
      const hInicioNum = parseInt(horaInicio.split(':')[0]);
      const hTerminoNum = parseInt(horaTermino.split(':')[0]);
      if (hTerminoNum > hInicioNum) {
        const duracion = hTerminoNum - hInicioNum;
        const precioNetoHora = getPrecioNetoPorHora(salonSeleccionado, !!socioData);
        const netoOriginalCalculado = duracion * precioNetoHora;

        let netoFinal = netoOriginalCalculado;
        let montoDescuentoAplicado = 0;

        if (cuponAplicado && cuponAplicado.montoDescontado > 0) {
          // Verificar si el cupón sigue siendo aplicable (ej. si el neto original cambió mucho)
          // Esta es una simplificación. Una lógica más robusta podría requerir revalidar el cupón
          // si el netoOriginalCalculado es muy diferente del cuponAplicado.netoOriginalParaCalculo.
          // Por ahora, si hay un cupón, recalculamos su efecto sobre el nuevo netoOriginalCalculado.
          // Idealmente, el backend daría el montoDescontado basado en el neto actual.
          // Si el cupón fue un %:
          // if (cuponAplicado.tipo === 'porcentaje') {
          //   montoDescuentoAplicado = netoOriginalCalculado * (cuponAplicado.valor / 100);
          // } else { // monto fijo
          //   montoDescuentoAplicado = cuponAplicado.valor;
          // }
          // Para simplificar, usamos el montoDescontado que ya tenemos del cupón,
          // pero esto podría ser impreciso si el neto base cambió mucho.
          // Lo correcto sería que el backend devuelva el neto final o el monto a descontar
          // basado en el neto actual de la reserva.
          // Asumimos que cuponAplicado.montoDescontado es el valor a restar.

          // Si el cupón se aplicó a un neto específico, y ese neto (netoOriginalCalculado) ha cambiado,
          // el cupón debería invalidarse o recalcularse.
          if (cuponAplicado.netoOriginalAlAplicar !== netoOriginalCalculado) {
            console.log("Neto original cambió, reseteando cupón.");
            setCuponAplicado(null); // Resetear cupón si el neto base cambió.
            setErrorCupon("El total de la reserva cambió. Por favor, aplica el cupón nuevamente si corresponde.");
            montoDescuentoAplicado = 0;
          } else {
            montoDescuentoAplicado = cuponAplicado.montoDescontado;
          }
          netoFinal = netoOriginalCalculado - montoDescuentoAplicado;
        }

        netoFinal = Math.max(0, netoFinal); // Asegurar que el neto no sea negativo

        const ivaCalculado = Math.round(netoFinal * IVA_RATE);
        const totalCalculado = netoFinal + ivaCalculado;

        setDuracionCalculada(duracion);
        setDesglosePrecio({
          netoOriginal: netoOriginalCalculado,
          montoDescuentoCupon: montoDescuentoAplicado,
          netoConDescuento: netoFinal,
          iva: ivaCalculado,
          total: totalCalculado,
        });
      } else {
        setDuracionCalculada(0);
        setDesglosePrecio({ netoOriginal: 0, montoDescuentoCupon: 0, netoConDescuento: 0, iva: 0, total: 0 });
      }
    } else {
      setDuracionCalculada(0);
      setDesglosePrecio({ netoOriginal: 0, montoDescuentoCupon: 0, netoConDescuento: 0, iva: 0, total: 0 });
    }
  }, [salonSeleccionado, horaInicio, horaTermino, socioData, cuponAplicado]); // Añadir cuponAplicado como dependencia
  
  const handleValidationSuccess = (datosSocio) => {
    setSocioData(datosSocio);
    setCuponAplicado(null); // Resetear cupón si cambia el estado de socio
    setErrorCupon('');
    setCodigoCuponInput('');
    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  
  const handleLogoutSocio = () => {
    setSocioData(null);
    setCuponAplicado(null); // Resetear cupón si se desloguea el socio
    setErrorCupon('');
    setCodigoCuponInput('');
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
  const goToStep = (step) => { if (step < currentStep) setCurrentStep(step); };
  
  const handleSelectSalon = (salon) => {
    setSalonSeleccionado(salon);
    setFechaSeleccionada(null);
    setHoraInicio('');
    setHoraTermino('');
    setCuponAplicado(null); // Resetear cupón si cambia el salón
    setErrorCupon('');
    setCodigoCuponInput('');
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
    setCuponAplicado(null); // Limpiar cupón después de una reserva exitosa
    setErrorCupon('');
    setCodigoCuponInput('');
    // No limpiar socioData aquí, podría querer hacer otra reserva como socio.
    setCurrentStep(1);
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
                {socioData ? (
                  <div className="socio-info-banner">
                    <span className="socio-name">✓ {socioData.nombre_completo}</span>
                    <button onClick={handleLogoutSocio} className="logout-socio-button" title="Desconectar RUT socio">
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsModalOpen(true)} className="socio-validate-button">
                    ¿Eres Socio/a?
                  </button>
                )}
              </div>
            </div>

            {socioData ? (
              <p className="welcome-socio-message">
                ¡Bienvenido/a! Ya puedes ver tus precios preferenciales.
              </p>
            ) : (
              <p>Haz clic en "¿Eres Socio/a?" si tienes un RUT de socio para ver precios especiales o selecciona un espacio para continuar.</p>
            )}
            
            <SalonList onSalonSelect={handleSelectSalon} esSocio={!!socioData} />
          </div>
        );
      case 2:
        return <Paso2_SeleccionFecha salonSeleccionado={salonSeleccionado} fechaSeleccionada={fechaSeleccionada} setFechaSeleccionada={setFechaSeleccionada} nextStep={nextStep} prevStep={() => handleSelectSalon(null)} />;
      case 3:
        return <Paso3_SeleccionHorario salonSeleccionado={salonSeleccionado} fechaSeleccionada={fechaSeleccionada} horaInicio={horaInicio} setHoraInicio={setHoraInicio} horaTermino={horaTermino} setHoraTermino={setHoraTermino} desglosePrecio={desglosePrecio} duracionCalculada={duracionCalculada} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return (
          <Paso4_DatosYResumen
            salonSeleccionado={salonSeleccionado}
            fechaSeleccionada={fechaSeleccionada}
            horaInicio={horaInicio}
            horaTermino={horaTermino}
            // costoCalculado={costoCalculado} // Reemplazado por desglosePrecio
            desglosePrecio={desglosePrecio}
            duracionCalculada={duracionCalculada}
            onReservationSuccess={handleReservationSuccess}
            prevStep={prevStep}
            esSocio={!!socioData}
            rutSocio={socioData ? socioData.rut : null}
            nombreSocioAutofill={socioData ? socioData.nombre_completo : ''}
            emailSocioAutofill={socioData ? socioData.email : ''}
            onSocioDataChange={setSocioData}
            // Props para cupones
            codigoCuponInput={codigoCuponInput}
            setCodigoCuponInput={setCodigoCuponInput}
            cuponAplicado={cuponAplicado}
            setCuponAplicado={setCuponAplicado}
            errorCupon={errorCupon}
            setErrorCupon={setErrorCupon}
            validandoCupon={validandoCupon}
            setValidandoCupon={setValidandoCupon}
            // IVA_RATE={IVA_RATE} // El cálculo final con IVA se hace aquí en BookingPage
            // setDesglosePrecio={setDesglosePrecio} // Para que Paso4 pueda influir en el desglose si es necesario
          />
        );
      default:
        return <SalonList onSalonSelect={handleSelectSalon} esSocio={!!socioData} />;
    }
  };

  return (
    <>
      {isModalOpen && (
        <SocioValidationModal 
          onClose={handleModalClose}
          onValidationSuccess={handleValidationSuccess} 
        />
      )}
      {currentStep > 1 && <IndicadorPasos currentStep={currentStep} totalSteps={totalSteps} goToStep={goToStep} />}
      {renderStep()}
    </>
  );
}

export default BookingPage;