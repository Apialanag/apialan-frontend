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
    const response = await backendApi.get('/espacios');
    return response.data;
  } catch (error) {
    return { error: `Error al obtener los salones: ${error.message}` };
  }
}

async function verificarDisponibilidadDiaria({ espacio_id, fecha }) {
  try {
    const response = await backendApi.get('/reservas', { params: { espacio_id, fecha } });
    if (response.data.length === 0) {
      return { message: "No hay reservas para este día, por lo tanto todos los horarios de 10:00 a 19:00 están disponibles." };
    }
    return response.data;
  } catch (error) {
    return { error: `Error al obtener la disponibilidad: ${error.message}` };
  }
}

// --- Tool Definitions for Gemini ---
const toolDefinitions = [
  { name: "getSalones", description: "Obtiene la lista de todos los salones (salas) disponibles para reservar.", parameters: { type: "OBJECT", properties: {} } },
  { name: "verificarDisponibilidadDiaria", description: "Verifica la disponibilidad de un salón específico en una fecha concreta.", parameters: { type: "OBJECT", properties: { espacio_id: { type: "STRING" }, fecha: { type: "STRING", description: "Formato YYYY-MM-DD." } }, required: ["espacio_id", "fecha"] } }
];

const functionHandlers = { getSalones, verificarDisponibilidadDiaria };

// --- Robust History Processing ---
// This function ensures the history has a strictly alternating user/model structure.
const processHistory = (history) => {
  if (!Array.isArray(history)) return [];
  const processed = [];
  let lastRole = "model";
  for (const item of history) {
    if (!item || !item.role || !item.parts) continue;
    const currentRole = item.role;
    if (currentRole === lastRole) continue;
    processed.push(item);
    lastRole = currentRole;
  }
  return processed;
};


// --- Main Handler ---
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY || !process.env.RENDER_API_URL) {
    return response.status(500).json({ error: 'AI or API service not configured.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: "Eres Al-An, un asistente virtual para un servicio de reserva de salas. Eres amable, servicial y muy conciso. Ve directo al punto. No inventes información. Si necesitas datos, debes usar las herramientas que tienes a tu disposición.",
      tools: [{ functionDeclarations: toolDefinitions }],
    });

    const { message, history = [] } = request.body;
    if (!message) return response.status(400).json({ error: 'Message is required' });

    const cleanHistory = processHistory(history);
    const chat = model.startChat({ history: cleanHistory });
    const result = await chat.sendMessage(message);
    const aiResponse = result.response;
    const functionCalls = aiResponse.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const responses = [];
      for (const call of functionCalls) {
        const handler = functionHandlers[call.name];
        if (handler) {
          const toolResult = await handler(call.args);
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
