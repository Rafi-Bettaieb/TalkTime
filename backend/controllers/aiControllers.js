const { GoogleGenerativeAI } = require("@google/generative-ai");
const asyncHandler = require("express-async-handler");

const generateSuggestions = asyncHandler(async (req, res) => {
  const { messageReceived } = req.body;

  if (!messageReceived) {
    res.status(400);
    throw new Error("Message content is required");
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are an AI assistant in a chat app. 
      The user just received this message: "${messageReceived}".
      Generate 3 distinct, short, and casual reply options for the user.
      Provide the response in this specific JSON format: ["Option 1", "Option 2", "Option 3"].
      Do not include markdown, code blocks, or explanations. Just the raw JSON array.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const suggestions = JSON.parse(cleanedText);

    res.json(suggestions);
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.json(["Okay", "Sounds good", "Talk later"]); 
  }
});

module.exports = { generateSuggestions };