// src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import { differenceInCalendarDays, isAfter, isSameDay, format } from 'date-fns'; // Importar para cálculo de numDias y isSameDay
import '../App.css';
import SalonList from '../components/SalonList';
import IndicadorPasos from '../components/IndicadorPasos';
import Paso2_SeleccionFecha from '../components/Paso2_SeleccionFecha';
import Paso3_SeleccionHorario from '../components/Paso3_SeleccionHorario';
import Paso4_DatosYResumen from '../components/Paso4_DatosYResumen';
import SocioValidationModal from '../components/SocioValidationModal';
import { getPrecioDetallado } from '../api'; // Importar la nueva función de API
import useDebounce from '../hooks/useDebounce'; // Importar el hook de debounce

function BookingPage() {
  // --- Estados y lógica se mantienen igual que en tu versión ---
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);
  const [rangoSeleccionado, setRangoSeleccionado] = useState(null);
  const [currentSelectionMode, setCurrentSelectionMode] = useState('single');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [socioData, setSocioData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [desglosePrecio, setDesglosePrecio] = useState({
    netoOriginal: 0,
    montoDescuentoCupon: 0,
    netoConDescuento: 0,
    iva: 0,
    total: 0,
  });
  const [duracionCalculada, setDuracionCalculada] = useState(0);

  // Estados para cupones
  const [codigoCuponInput, setCodigoCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [errorCupon, setErrorCupon] = useState('');
  const [validandoCupon, setValidandoCupon] = useState(false);

  // --- NUEVOS ESTADOS PARA LA LLAMADA API DE PRECIOS ---
  const [isPrecioLoading, setIsPrecioLoading] = useState(false);
  const [precioError, setPrecioError] = useState(null);

  // Objeto de dependencias para el cálculo de precio
  const detallesParaCalculo = {
    salonId: salonSeleccionado?.id,
    // Formatear las fechas a YYYY-MM-DD si existen
    fechaInicio: rangoSeleccionado?.startDate ? format(rangoSeleccionado.startDate, 'yyyy-MM-dd') : null,
    fechaTermino: rangoSeleccionado?.endDate ? format(rangoSeleccionado.endDate, 'yyyy-MM-dd') : null,
    horaInicio,
    horaTermino,
    esSocio: !!socioData,
    codigoCupon: cuponAplicado?.codigo || codigoCuponInput, // Enviar el código del cupón aplicado o el que se está intentando aplicar
    currentSelectionMode,
    discreteDates: currentSelectionMode === 'multiple-discrete' ? rangoSeleccionado?.discreteDates?.map(d => format(d, 'yyyy-MM-dd')) : undefined,
  };

  const debouncedDetallesParaCalculo = useDebounce(detallesParaCalculo, 500);

  // --- REEMPLAZO DEL USEEFFECT DE CÁLCULO DE PRECIO ---
  useEffect(() => {
    // Extraer las dependencias del objeto debounced
    const { salonId, fechaInicio, horaInicio, horaTermino, currentSelectionMode } = debouncedDetallesParaCalculo;

    // Condición para ejecutar la llamada: deben estar todos los datos mínimos necesarios.
    const puedeCalcular = salonId && fechaInicio && horaInicio && horaTermino && parseInt(horaTermino.split(':')[0]) > parseInt(horaInicio.split(':')[0]);

    if (!puedeCalcular) {
      setDesglosePrecio({ netoOriginal: 0, montoDescuentoCupon: 0, netoConDescuento: 0, iva: 0, total: 0 });
      setDuracionCalculada(0);
      setPrecioError(null); // Limpiar errores si los datos son inválidos para calcular
      return;
    }

    const fetchPrecio = async () => {
      setIsPrecioLoading(true);
      setPrecioError(null);
      try {
        const response = await getPrecioDetallado(debouncedDetallesParaCalculo);
        const { data } = response;

        // El backend ahora devuelve el desglose completo y redondeado
        setDesglosePrecio({
          netoOriginal: data.netoOriginal,
          montoDescuentoCupon: data.montoDescuentoCupon,
          netoConDescuento: data.netoConDescuento,
          iva: data.iva,
          total: data.total,
        });

        // La duración también podría venir del backend si la lógica es compleja,
        // pero por ahora la calculamos como antes.
        const hInicioNum = parseInt(horaInicio.split(':')[0]);
        const hTerminoNum = parseInt(horaTermino.split(':')[0]);
        setDuracionCalculada(hTerminoNum - hInicioNum);

        // Si la respuesta del backend sobre el cupón indica un error, lo mostramos
        if (data.errorCupon) {
          setErrorCupon(data.errorCupon);
          setCuponAplicado(null); // Limpiar el cupón aplicado en el frontend
        } else {
          setErrorCupon(''); // Limpiar errores si el cupón fue exitoso
          // Opcional: actualizar el estado del cupón aplicado con datos del backend
          if (data.cuponAplicado) {
            setCuponAplicado(data.cuponAplicado);
          }
        }

      } catch (error) {
        console.error("Error al obtener el precio detallado:", error);
        setPrecioError("No se pudo calcular el precio. Intente de nuevo.");
        // Mantener el precio en 0 si hay un error
        setDesglosePrecio({ netoOriginal: 0, montoDescuentoCupon: 0, netoConDescuento: 0, iva: 0, total: 0 });
      } finally {
        setIsPrecioLoading(false);
      }
    };

    fetchPrecio();

  }, [debouncedDetallesParaCalculo]); // La única dependencia es el objeto debounced

  // Calcular numDias aquí para que esté disponible en el scope de renderStep y useEffect de precios
  let numDias = 0; // Iniciar en 0, se calculará correctamente.
  if (rangoSeleccionado) {
    if (currentSelectionMode === 'single' && rangoSeleccionado.startDate) {
      const dayOfWeek = rangoSeleccionado.startDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No contar si es finde (aunque no debería poder seleccionarse)
        numDias = 1;
      }
    } else if (currentSelectionMode === 'range' && rangoSeleccionado.startDate && rangoSeleccionado.endDate && isAfter(rangoSeleccionado.endDate, rangoSeleccionado.startDate)) {
      let count = 0;
      let currentDateIter = new Date(rangoSeleccionado.startDate);
      while (currentDateIter <= rangoSeleccionado.endDate) {
        const dayOfWeek = currentDateIter.getDay(); // 0 (Dom) a 6 (Sáb)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Excluir Domingo y Sábado
          count++;
        }
        currentDateIter.setDate(currentDateIter.getDate() + 1);
      }
      numDias = count;
    } else if (currentSelectionMode === 'range' && rangoSeleccionado.startDate && rangoSeleccionado.endDate && isSameDay(rangoSeleccionado.startDate, rangoSeleccionado.endDate)) {
      // Rango de un solo día
      const dayOfWeek = rangoSeleccionado.startDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        numDias = 1;
      }
    } else if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado.discreteDates && rangoSeleccionado.discreteDates.length > 0) {
      // Para multiple-discrete, ya se asume que CustomCalendar no permite seleccionar fines de semana.
      numDias = rangoSeleccionado.discreteDates.length;
    }
  }
  if (numDias === 0 && rangoSeleccionado?.startDate) {
    // Fallback: si después de los cálculos numDias es 0 pero hay alguna fecha de inicio,
    // es probable que sea una selección de un solo día que es fin de semana (no debería ocurrir)
    // o un rango inválido. Para evitar división por cero o precio cero incorrecto,
    // podría ser mejor dejarlo en 0 y que el precio sea 0, o forzar a 1 si hay startDate.
    // Por seguridad en el cálculo de precio, si hay startDate, asumimos al menos 1 día (aunque no sea facturable).
    // La validación de si la selección es facturable es más compleja.
    // Por ahora, si hay una fecha de inicio, numDias será al menos 1 para evitar errores de cálculo,
    // aunque el precio de un día no facturable sería 0 si el salón no tiene precio para ese día.
    // La lógica actual de precio no distingue días no facturables.
    // Esto es un parche temporal para el cálculo de numDias.
      const startDayOfWeek = rangoSeleccionado.startDate.getDay();
      if (startDayOfWeek !== 0 && startDayOfWeek !== 6) numDias = 1; // Solo si el primer día es hábil.
      else numDias = 0; // Si el único día es finde, 0 días facturables.
  }
  // Asegurar que numDias no sea 0 si se va a proceder con un cálculo, para evitar división por cero si se usara numDias en denominador en otro lado.
  // Sin embargo, para multiplicación está bien si es 0.
  
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
    setRangoSeleccionado(null); // Resetear la selección de fechas
    setCurrentSelectionMode('single'); // Volver al modo por defecto
    setHoraInicio('');
    setHoraTermino('');
    setCuponAplicado(null);
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
    setRangoSeleccionado(null);
    setCurrentSelectionMode('single');
    setHoraInicio('');
    setHoraTermino('');
    setCuponAplicado(null);
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
        return <Paso2_SeleccionFecha
                  salonSeleccionado={salonSeleccionado}
                  rangoSeleccionado={rangoSeleccionado}
                  setRangoSeleccionado={setRangoSeleccionado}
                  currentSelectionMode={currentSelectionMode}
                  setCurrentSelectionMode={setCurrentSelectionMode}
                  nextStep={nextStep}
                  prevStep={() => handleSelectSalon(null)}
                />;
      case 3:
        return <Paso3_SeleccionHorario
                  salonSeleccionado={salonSeleccionado}
                  rangoSeleccionado={rangoSeleccionado}
                  currentSelectionMode={currentSelectionMode}
                  horaInicio={horaInicio} setHoraInicio={setHoraInicio}
                  horaTermino={horaTermino} setHoraTermino={setHoraTermino}
                  desglosePrecio={desglosePrecio}
                  duracionCalculada={duracionCalculada}
                  nextStep={nextStep}
                  prevStep={prevStep}
                  isPrecioLoading={isPrecioLoading}
                  precioError={precioError}
                />;
      case 4:
        // Se eliminan los logs de depuración de BookingPage antes de pasar props
        // TODO: Paso4_DatosYResumen necesitará también rangoSeleccionado y currentSelectionMode para mostrar resumen y calcular precio final.
        return (
          <Paso4_DatosYResumen
            salonSeleccionado={salonSeleccionado}
            rangoSeleccionado={rangoSeleccionado} // Pasar el objeto completo
            currentSelectionMode={currentSelectionMode} // Pasar el modo
            numDias={numDias} // Pasar el número de días calculado
            horaInicio={horaInicio}
            horaTermino={horaTermino}
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
        // El console.log anterior aquí era incorrecto, ya que este es el caso default.
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