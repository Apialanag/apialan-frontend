import React from 'react';
import ChatBot from 'react-chatbotify';

const Chatbot = () => {
  const callApi = async (message) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.error('Error calling API:', error);
      return 'Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta de nuevo más tarde.';
    }
  };

  const flow = {
    start: {
      message: '¡Hola! Soy Al-An, tu asistente virtual para reservas. ¿En qué puedo ayudarte hoy?',
      path: 'get_ai_response',
    },
    get_ai_response: {
      message: async (params) => {
        return await callApi(params.userInput);
      },
      path: 'get_ai_response', // Loop back to here to continue the conversation
    },
  };

  const settings = {
    header: {
      title: "Asistente Virtual Al-An",
    },
    tooltip: {
        text: "¡Hola! ¿Necesitas ayuda?",
    },
    chatInput: {
        enabledPlaceholderText: "Escribe tu pregunta aquí...",
    }
  };

  return (
      <ChatBot flow={flow} settings={settings} />
  );
};

export default Chatbot;
