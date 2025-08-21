import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// --- Backend API Client Setup ---
const RENDER_API_URL = process.env.RENDER_API_URL;
const backendApi = axios.create({
  baseURL: RENDER_API_URL,
});


// --- Tool Implementations ---
async function getSalones() {
  try {
    // This is a public endpoint, so we don't send the auth token.
    const response = await backendApi.get('/espacios');
    return response.data;
  } catch (error) {
    return { error: `Error al obtener los salones: ${error.message}` };
  }
}

async function verificarDisponibilidadDiaria({ espacio_id, fecha }, authToken) {
  try {
    const config = authToken ? { headers: { Authorization: authToken } } : {};
    config.params = { espacio_id, fecha };
    const response = await backendApi.get('/reservas', config);
    if (response.data.length === 0) {
      return { message: "No hay reservas para este día, por lo tanto todos los horarios de 10:00 a 19:00 están disponibles." };
    }
    return response.data;
  } catch (error) {
    return { error: `Error al obtener la disponibilidad: ${error.message}` };
  }
}

async function getCurrentDate() {
  // This tool helps the model understand relative dates like "today" or "tomorrow".
  // NOTE: This uses the server's date. For users in different timezones, this might be off.
  // For a more robust solution, the user's timezone should be passed from the frontend.
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    today: today.toISOString().split('T')[0], // YYYY-MM-DD
    tomorrow: tomorrow.toISOString().split('T')[0], // YYYY-MM-DD
  };
}


// --- Tool Definitions for Gemini ---
const toolDefinitions = [
  { name: "getSalones", description: "Obtiene la lista de todos los salones (salas) disponibles para reservar, incluyendo sus IDs." },
  { name: "verificarDisponibilidadDiaria", description: "Verifica la disponibilidad de un salón específico en una fecha concreta.", parameters: { type: "OBJECT", properties: { espacio_id: { type: "STRING" }, fecha: { type: "STRING", description: "La fecha en formato YYYY-MM-DD." } }, required: ["espacio_id", "fecha"] } },
  { name: "getCurrentDate", description: "Devuelve la fecha actual ('today') y la de mañana ('tomorrow') en formato YYYY-MM-DD. Úsala para resolver fechas relativas." }
];

const functionHandlers = { getSalones, verificarDisponibilidadDiaria, getCurrentDate };


// --- Main Handler ---
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!process.env.GEMINI_API_KEY || !process.env.RENDER_API_URL) {
    return response.status(500).json({ error: 'AI or API service not configured.' });
  }

  const authToken = request.headers.authorization;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    systemInstruction: `Eres Al-An, un asistente de reservas de salas. Eres amable y muy conciso.
    **Proceso Obligatorio de Razonamiento:**
    1.  Si el usuario pregunta por disponibilidad de una sala por su nombre (ej: 'sala grande'), TU PRIMERA ACCIÓN DEBE SER usar la herramienta 'getSalones' para obtener su ID. NO le pidas el ID al usuario.
    2.  Si el usuario usa una fecha relativa (ej: 'hoy', 'mañana'), TU PRIMERA ACCIÓN DEBE SER usar la herramienta 'getCurrentDate' para obtener la fecha exacta en formato YYYY-MM-DD.
    3.  Una vez que tengas el 'espacio_id' y la 'fecha' exacta, usa la herramienta 'verificarDisponibilidadDiaria'.
    4.  Responde al usuario basándote en la información de las herramientas. No inventes información.`,
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const { message, history = [] } = request.body;
  if (!message) return response.status(400).json({ error: 'Message is required' });

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
          const toolResult = await handler(call.args, authToken);
          responses.push({ functionResponse: { name: call.name, response: toolResult } });
        }
      }
      const nextResult = await chat.sendMessage(responses);
      return response.status(200).json({ reply: nextResult.response.text() });
    } else {
      return response.status(200).json({ reply: aiResponse.text() });
    }
  } catch (error) {
    console.error('Error in orchestrator:', error);
    return response.status(500).json({ error: 'Failed to process request with AI' });
  }
}
