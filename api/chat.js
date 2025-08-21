import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return response.status(500).json({ error: 'AI service not configured on the server.' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const { message } = request.body;

  if (!message) {
    return response.status(400).json({ error: 'Message is required' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: "Eres un asistente virtual para un servicio de reserva de salas. Tu nombre es Al-An. Eres amable, servicial y te especializas en responder preguntas sobre las salas, disponibilidad, precios y el proceso de reserva. Si te preguntan algo fuera de este tema, amablemente redirige la conversación hacia la reserva de salas.",
    });

    const result = await model.generateContent(message);
    const aiResponse = result.response;
    const text = aiResponse.text();

    return response.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return response.status(500).json({ error: 'Failed to get response from AI' });
  }
}
