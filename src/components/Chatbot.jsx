import React from 'react';
import ChatBot from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';
import SalonesDisponibles from './SalonesDisponibles';

const theme = {
  background: '#f5f8fb',
  fontFamily: 'Helvetica Neue',
  headerBgColor: '#00bfff',
  headerFontColor: '#fff',
  headerFontSize: '15px',
  botBubbleColor: '#00bfff',
  botFontColor: '#fff',
  userBubbleColor: '#fff',
  userFontColor: '#4a4a4a',
};

const Chatbot = () => {
  const steps = [
    {
      id: '1',
      message: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      trigger: '2',
    },
    {
      id: '2',
      options: [
        { value: 'reservar', label: 'Quiero ver las salas', trigger: '3' },
        { value: 'info', label: 'Necesito más información', trigger: '4' },
      ],
    },
    {
      id: '3',
      component: <SalonesDisponibles />,
      waitAction: true, // Espera a que el componente dispare triggerNextStep
      trigger: '5', // El trigger se define en el componente SalonesDisponibles
    },
    {
      id: '4',
      message: 'Puedes encontrar toda la información sobre nuestras salas en la página principal. Si tienes alguna pregunta específica, no dudes en consultarme.',
      end: true,
    },
    {
        id: '5',
        message: '¡Perfecto! Para continuar con la reserva, por favor usa el formulario de la página. Próximamente podré hacerlo por ti.',
        end: true,
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <ChatBot
        steps={steps}
        floating={true}
        headerTitle="Asistente Virtual"
        recognitionEnable={true}
      />
    </ThemeProvider>
  );
};

export default Chatbot;
