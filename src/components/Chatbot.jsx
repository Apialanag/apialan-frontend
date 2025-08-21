import React from 'react';
import ChatBot from 'react-chatbotify';

const Chatbot = () => {
  // This function transforms the history from react-chatbotify format to Gemini format
  const transformHistory = (history) => {
    if (!history) return [];
    return history.map(item => ({
      role: item.type === 'user' ? 'user' : 'model',
      parts: [{ text: item.message }],
    }));
  };

  const callApi = async (params) => {
    const { userInput, history } = params;
    const transformedHistory = transformHistory(history);

    // Remove the last message from the history, as it's the current user input
    if (transformedHistory.length > 0) {
      transformedHistory.pop();
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send both the current message and the transformed history
        body: JSON.stringify({ message: userInput, history: transformedHistory }),
      });
      if (!response.ok) {
        // Try to parse error details from the backend
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Network response was not ok';
        throw new Error(errorMsg);
      }
      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.error('Error calling API:', error);
      return `Lo siento, estoy teniendo problemas para conectarme. (${error.message})`;
    }
  };

  const flow = {
    start: {
      message: '¡Hola! Soy Al-An, tu asistente virtual para reservas. ¿En qué puedo ayudarte hoy?',
      path: 'get_ai_response',
    },
    get_ai_response: {
      message: async (params) => {
        // Pass the entire params object to callApi
        return await callApi(params);
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
