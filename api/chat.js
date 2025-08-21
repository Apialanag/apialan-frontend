import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Tool Implementations using native fetch ---
async function getSalones() {
  try {
    const response = await fetch('https://apialan-api.onrender.com/api/espacios');
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Critical Error in getSalones tool:", error);
    return { error: `Error al obtener los salones: ${error.message}` };
  }
}

async function verificarDisponibilidadDiaria({ espacio_id, fecha }, authToken) {
  try {
    const url = new URL(`https://apialan-api.onrender.com/api/reservas`);
    url.searchParams.append('espacio_id', espacio_id);
    url.searchParams.append('fecha', fecha);

    const headers = {};
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.length === 0) {
      return { message: "No hay reservas para este día, por lo tanto todos los horarios de 10:00 a 19:00 están disponibles." };
    }
    return data;
  } catch (error) {
    console.error("Error in verificarDisponibilidadDiaria tool:", error);
    return { error: `Error al obtener la disponibilidad: ${error.message}` };
  }
}

async function getCurrentDate() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    today: today.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
  };
}

// --- Tool Definitions & Handlers ---
const toolDefinitions = [
  { name: "getSalones", description: "Obtiene la lista de todos los salones (salas) disponibles para reservar, incluyendo sus IDs." },
  { name: "verificarDisponibilidadDiaria", description: "Verifica la disponibilidad de un salón específico en una fecha concreta.", parameters: { type: "OBJECT", properties: { espacio_id: { type: "STRING" }, fecha: { type: "STRING", description: "Formato YYYY-MM-DD." } }, required: ["espacio_id", "fecha"] } },
  { name: "getCurrentDate", description: "Devuelve la fecha actual ('today') y la de mañana ('tomorrow') en formato YYYY-MM-DD." }
];
const functionHandlers = { getSalones, verificarDisponibilidadDiaria, getCurrentDate };

// --- Main Handler ---
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return response.status(500).json({ error: 'AI service not configured.' });
  }

  const authToken = request.headers.authorization;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    systemInstruction: `Eres Al-An, un asistente de reservas de salas. Eres amable y muy conciso.
    **Proceso Obligatorio de Razonamiento:**
    1. Si el usuario pregunta por disponibilidad de una sala por su nombre, TU PRIMERA ACCIÓN DEBE SER usar la herramienta 'getSalones' para obtener su ID. NO le pidas el ID al usuario.
    2. Si el usuario usa una fecha relativa (ej: 'hoy', 'mañana'), TU PRIMERA ACCIÓN DEBE SER usar la herramienta 'getCurrentDate' para obtener la fecha exacta en formato YYYY-MM-DD.
    3. Una vez que tengas el 'espacio_id' y la 'fecha' exacta, usa la herramienta 'verificarDisponibilidadDiaria'.
    4. Responde al usuario basándote en la información de las herramientas. No inventes información.`,
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
