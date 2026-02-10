const asyncHandler = require("express-async-handler");

const generateSuggestions = asyncHandler(async (req, res) => {
  const { messageReceived } = req.body;

  if (!messageReceived) {
    res.status(400);
    throw new Error("Message content is required");
  }

  const API_KEY = process.env.GROQ_API_KEY;
  const API_URL = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant for a chat app.
             Your job is to generate 3 short, casual, and distinct reply options (answers) for the user's message. 
             Follow these rules strictly:
              - Identify the intent of the user's message (question, joke, request, complaint, greeting, etc.) and craft replies that match that intent.
              - Do not use overly formal or robotic phrasing unless the user's message is formal.
              - You may include at most one appropriate emoji per reply if necessary.
              - Do not generate offensive, harmful, or inappropriate content.
              - If the user's message is emotional, aggressive, or sensitive, generate calm and respectful replies.
              - Do not assume personal information about the user.
              - Each reply must be casual, natural, and conversational.
              - Replies should sound like something a real person would text.
              - Keep each reply concise (ideally one sentence).
              - The 3 replies must be different in wording.
              - Do NOT include any explanations, introductions, or extra text.
              - Do NOT number the replies.
              - Output ONLY the 3 replies, each on its own line. No numbering, no intro`
          },
          {
            role: "user",
            content: messageReceived
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch from Groq");
    }

    const rawText = data.choices[0].message.content.trim();
    const suggestionsArray = rawText.split('\n').filter(line => line.trim() !== "");

    res.json(suggestionsArray);

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500);
    throw new Error("Failed to generate suggestions.");
  }
});

module.exports = { generateSuggestions };