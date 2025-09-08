// src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react';
import { isAfter, isSameDay } from 'date-fns'; // Importar para cálculo de numDias y isSameDay
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
  // Nuevo estado para la selección de fechas y modo
  const [rangoSeleccionado, setRangoSeleccionado] = useState(null); // Será { startDate, endDate, discreteDates } o null
  const [currentSelectionMode, setCurrentSelectionMode] = useState('single'); // 'single', 'range', 'multiple-discrete'
  // fechaSeleccionada (estado antiguo) se elimina o se deriva de rangoSeleccionado si es necesario en otro lugar.
  // Por ahora, lo eliminaremos y los componentes hijos usarán rangoSeleccionado.
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [socioData, setSocioData] = useState(null);
  // nombreSocio se puede derivar de socioData.nombre_completo, así que no necesitamos un estado separado.
  // const [nombreSocio, setNombreSocio] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [desglosePrecio, setDesglosePrecio] = useState({
    netoOriginal: 0,
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

  const getPrecioNetoPorHoraSabado = (salon, esSocioParam) => {
    if (!salon) return 0;

    const preciosSabado = {
      'Sala Chica': { general: 12000, socio: 8000 },
      'Sala Mediana': { general: 18000, socio: 10000 },
      'Salón Grande': { general: 28000, socio: 12000 },
    };

    const nombreSalon = salon.nombre;
    let precioTotal = 0;

    if (preciosSabado[nombreSalon]) {
      precioTotal = esSocioParam ? preciosSabado[nombreSalon].socio : preciosSabado[nombreSalon].general;
    } else {
      // Fallback por si el nombre del salón no coincide
      return getPrecioNetoPorHora(salon, esSocioParam);
    }

    // Convertir el precio total (IVA incluido) a neto
    return Math.round(precioTotal / (1 + IVA_RATE));
  };

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

  let numDias = 0;
  if (rangoSeleccionado) {
      let diasAProcesar = [];
      if (currentSelectionMode === 'single' && rangoSeleccionado.startDate) {
          diasAProcesar = [rangoSeleccionado.startDate];
      } else if (currentSelectionMode === 'range' && rangoSeleccionado.startDate && rangoSeleccionado.endDate) {
          let currentDate = new Date(rangoSeleccionado.startDate);
          while (currentDate <= rangoSeleccionado.endDate) {
              diasAProcesar.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
          }
      } else if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado.discreteDates) {
          diasAProcesar = rangoSeleccionado.discreteDates;
      }

      diasAProcesar.forEach(dia => {
          if (dia.getDay() !== 0) { // Excluir Domingos
              numDias++;
          }
      });
  }

  useEffect(() => {
    if (salonSeleccionado && horaInicio && horaTermino && rangoSeleccionado) {
      const hInicioNum = parseInt(horaInicio.split(':')[0]);
      const hTerminoNum = parseInt(horaTermino.split(':')[0]);

      if (hTerminoNum > hInicioNum) {
        const duracionPorDia = hTerminoNum - hInicioNum;
        let totalNetoCalculado = 0;
        let diasHabiles = 0;

        let diasAProcesar = [];
        if (currentSelectionMode === 'single' && rangoSeleccionado.startDate) {
            diasAProcesar = [rangoSeleccionado.startDate];
        } else if (currentSelectionMode === 'range' && rangoSeleccionado.startDate && rangoSeleccionado.endDate) {
            let currentDate = new Date(rangoSeleccionado.startDate);
            while (currentDate <= rangoSeleccionado.endDate) {
                diasAProcesar.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else if (currentSelectionMode === 'multiple-discrete' && rangoSeleccionado.discreteDates) {
            diasAProcesar = rangoSeleccionado.discreteDates;
        }

        diasAProcesar.forEach(dia => {
            const dayOfWeek = dia.getDay();
            if (dayOfWeek !== 0) { // Excluir Domingos
                diasHabiles++;
                const esSabado = dayOfWeek === 6;
                const precioNetoHora = esSabado
                    ? getPrecioNetoPorHoraSabado(salonSeleccionado, !!socioData)
                    : getPrecioNetoPorHora(salonSeleccionado, !!socioData);
                totalNetoCalculado += duracionPorDia * precioNetoHora;
            }
        });

        const netoOriginalCalculadoParaCupon = totalNetoCalculado;
        let netoFinalTrasCupon = netoOriginalCalculadoParaCupon;
        let montoDescuentoCuponActual = 0;

        // console.log('[BookingPage] Antes del if cuponAplicado:', { cuponAplicado, netoOriginalCalculadoParaCupon });

        if (cuponAplicado && cuponAplicado.montoDescontado > 0) {
          // console.log('[BookingPage] Dentro if cuponAplicado. netoOriginalAlAplicar vs netoOriginalCalculadoParaCupon:', cuponAplicado.netoOriginalAlAplicar, netoOriginalCalculadoParaCupon);
          if (cuponAplicado.netoOriginalAlAplicar !== netoOriginalCalculadoParaCupon) {
            console.warn("[BookingPage] Neto original de la reserva cambió desde que se aplicó el cupón. Invalidando cupón.");
            setCuponAplicado(null); // Invalida el cupón
            setErrorCupon("El total de la reserva cambió. Por favor, aplica el cupón nuevamente si corresponde.");
            // montoDescuentoCuponActual es 0 (ya inicializado)
            // netoFinalTrasCupon es netoOriginalCalculadoParaCupon (ya inicializado)
          } else {
            // console.log('[BookingPage] Cupón sigue válido. Aplicando descuento del backend.');
            netoFinalTrasCupon = cuponAplicado.netoConDescuentoDelCupon;
            montoDescuentoCuponActual = cuponAplicado.montoDescontado;
            setErrorCupon(''); // Limpiar cualquier error de cupón anterior si ahora es válido
          }
        }

        netoFinalTrasCupon = Math.max(0, netoFinalTrasCupon);
        // console.log('[BookingPage] Valores calculados:', { netoOriginalCalculadoParaCupon, montoDescuentoCuponActual, netoFinalTrasCupon });

        const ivaCalculado = Math.round(netoFinalTrasCupon * IVA_RATE);
        const totalCalculado = netoFinalTrasCupon + ivaCalculado;
        // console.log('[BookingPage] IVA y Total:', { ivaCalculado, totalCalculado });

        const nuevoDesglose = {
          netoOriginal: netoOriginalCalculadoParaCupon,
          montoDescuentoCupon: montoDescuentoCuponActual,
          netoConDescuento: netoFinalTrasCupon,
          iva: ivaCalculado,
          total: totalCalculado,
        };
        // console.log('[BookingPage] setDesglosePrecio con:', nuevoDesglose);
        setDuracionCalculada(duracionPorDia); // CORRECCIÓN AQUÍ
        setDesglosePrecio(nuevoDesglose);

      } else { // Duración inválida
        // console.log('[BookingPage] Duración inválida o datos incompletos. Reseteando desglose.');
        setDuracionCalculada(0);
        setDesglosePrecio({ netoOriginal: 0, montoDescuentoCupon: 0, netoConDescuento: 0, iva: 0, total: 0 });
      }
    } else { // Faltan datos para calcular
      setDuracionCalculada(0);
      setDesglosePrecio({ netoOriginal: 0, montoDescuentoCupon: 0, netoConDescuento: 0, iva: 0, total: 0 });
    }
  }, [salonSeleccionado, horaInicio, horaTermino, socioData, cuponAplicado, rangoSeleccionado, currentSelectionMode, setCuponAplicado, setErrorCupon]);
  
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
            prevStep={prevStep}
            esSocio={!!socioData}
            rutSocio={socioData ? socioData.rut : null}
            nombreSocioAutofill={socioData ? socioData.nombre_completo : ''}
            emailSocioAutofill={socioData ? socioData.email : ''}
            // --- Nuevas props para autocompletar datos de facturación ---
            rutEmpresaAutofill={socioData ? socioData.rut_empresa : ''}
            razonSocialAutofill={socioData ? socioData.razon_social : ''}
            giroAutofill={socioData ? socioData.giro : ''}
            direccionComercialAutofill={socioData ? socioData.direccion_comercial : ''}
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