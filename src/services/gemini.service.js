const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateResponse = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate AI response');
  }
};

module.exports = {
  generateResponse
};
