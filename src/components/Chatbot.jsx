import React from 'react';
import ChatBot from 'react-chatbotify';
import api from '../api';

const Chatbot = () => {
  const fetchSalones = async () => {
    try {
      const response = await api.get('/espacios');
      return response.data;
    } catch (err) {
      console.error("Error fetching salons for chatbot:", err);
      return [];
    }
  };

  const flow = {
    start: {
      message: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
      options: ['Quiero ver las salas', 'Necesito más información'],
      path: (params) => {
        switch (params.userInput) {
          case 'Quiero ver las salas':
            return 'show_salones';
          case 'Necesito más información':
            return 'info';
        }
        return 'start';
      },
    },
    info: {
        message: 'Puedes encontrar toda la información sobre nuestras salas en la página principal. Si tienes alguna pregunta específica, no dudes en consultarme.',
        end: true,
    },
    show_salones: {
      message: 'Claro, aquí tienes nuestras salas. Haz clic en la que te interese.',
      render: async () => {
        const salones = await fetchSalones();
        if (salones.length === 0) {
            return "No hay salones disponibles en este momento.";
        }
        const options = salones.map(salon => salon.nombre);
        return <ChatBot.Options options={options} />;
      },
      path: 'selected_salon',
    },
    selected_salon: {
        message: (params) => `Has seleccionado ${params.userInput}. ¡Perfecto! Para continuar con la reserva, por favor usa el formulario de la página. Próximamente podré hacerlo por ti.`,
        end: true
    }
  };

  return (
      <ChatBot flow={flow} />
  );
};

export default Chatbot;
