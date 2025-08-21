import OpenAI from 'openai';

// This is a Vercel serverless function
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { message } = request.body;

  if (!message) {
    return response.status(400).json({ error: 'Message is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // A cost-effective and capable model
      messages: [
        {
          role: "system",
          content: "Eres un asistente virtual para un servicio de reserva de salas. Tu nombre es Al-An. Eres amable, servicial y te especializas en responder preguntas sobre las salas, disponibilidad, precios y el proceso de reserva. Si te preguntan algo fuera de este tema, amablemente redirige la conversación hacia la reserva de salas."
        },
        {
          role: "user",
          content: message
        }
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    return response.status(200).json({ reply: aiResponse });

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return response.status(500).json({ error: 'Failed to get response from AI' });
  }
}
