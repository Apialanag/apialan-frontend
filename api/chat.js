import { GoogleGenerativeAI } from '@google/generative-ai';
import backendApi from '../lib/backend_api.js';

// --- Tool Implementations ---
// These are the actual functions that call our Render API.

async function getSalones() {
  try {
    console.log("Executing tool: getSalones");
    const response = await backendApi.get('/espacios');
    // We return the data directly. Gemini will format it for the user.
    return response.data;
  } catch (error) {
    console.error("Error in getSalones tool:", error);
    // Return a descriptive error for the model to interpret.
    return { error: `Error al obtener los salones: ${error.message}` };
  }
}

async function verificarDisponibilidadDiaria({ espacio_id, fecha }) {
  try {
    console.log(`Executing tool: verificarDisponibilidadDiaria with id=${espacio_id}, fecha=${fecha}`);
    const response = await backendApi.get('/reservas', {
      params: { espacio_id, fecha }
    });
    if (response.data.length === 0) {
      return { message: "No hay reservas para este día, por lo tanto todos los horarios de 10:00 a 19:00 están disponibles." };
    }
    return response.data;
  } catch (error) {
    console.error("Error in verificarDisponibilidadDiaria tool:", error);
    return { error: `Error al obtener la disponibilidad: ${error.message}` };
  }
}

// --- Tool Definitions for Gemini ---
// This is the schema we show to the model so it knows what tools it has.

const toolDefinitions = [
  {
    name: "getSalones",
    description: "Obtiene la lista de todos los salones (salas) disponibles para reservar, junto con sus detalles como id, nombre, descripción y precios.",
    parameters: {
      type: "OBJECT",
      properties: {},
    }
  },
  {
    name: "verificarDisponibilidadDiaria",
    description: "Verifica la disponibilidad de un salón específico en una fecha concreta. Devuelve una lista de los horarios que ya han sido reservados para ese día.",
    parameters: {
      type: "OBJECT",
      properties: {
        espacio_id: {
          type: "STRING",
          description: "El ID del salón a verificar. Debes obtener este ID primero usando la herramienta getSalones."
        },
        fecha: {
          type: "STRING",
          description: "La fecha a consultar, en formato YYYY-MM-DD."
        }
      },
      required: ["espacio_id", "fecha"]
    }
  }
];

const functionHandlers = {
  getSalones,
  verificarDisponibilidadDiaria,
};

// --- Main Handler ---

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY || !process.env.RENDER_API_URL) {
    return response.status(500).json({ error: 'AI or API service not configured on the server.' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    systemInstruction: "Eres un asistente virtual para un servicio de reserva de salas. Tu nombre es Al-An. Eres amable, servicial y muy conciso. No inventes información. Si no sabes algo, di que no tienes esa información. Si necesitas datos como la lista de salones o la disponibilidad, debes usar las herramientas que tienes a tu disposición.",
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const { message, history = [] } = request.body;

  if (!message) {
    return response.status(400).json({ error: 'Message is required' });
  }

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const aiResponse = result.response;
    const functionCalls = aiResponse.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const responses = [];
      for (const call of functionCalls) {
        const handler = functionHandlers[call.name];
        if (handler) {
          const toolResult = await handler(call.args);
          responses.push({
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          });
        }
      }

      const nextResult = await chat.sendMessage(responses);
      const finalResponse = nextResult.response.text();
      return response.status(200).json({ reply: finalResponse });

    } else {
      return response.status(200).json({ reply: aiResponse.text() });
    }

  } catch (error) {
    console.error('Error in orchestrator:', error);
    return response.status(500).json({ error: 'Failed to process request with AI' });
  }
}
