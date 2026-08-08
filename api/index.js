import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // HEALTH CHECK
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      status: "online",
      app: "Yourbae AI",
    });
  }

  // CHAT
  if (req.method === "POST") {
    try {
      const body = req.body || {};

      const messages = Array.isArray(body.messages)
        ? body.messages
        : [];

      if (messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Messages tidak boleh kosong.",
        });
      }

      const validMessages = messages
        .slice(-20)
        .filter(
          (message) =>
            message &&
            (message.role === "user" ||
              message.role === "assistant") &&
            typeof message.content === "string"
        )
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-5",
        instructions:
          "Kamu adalah Yourbae AI. Kamu ramah, natural, konsisten, dan responsif.",
        input: validMessages,
        max_output_tokens: 1200,
      });

      return res.status(200).json({
        success: true,
        message: response.output_text || "",
      });
    } catch (error) {
      console.error("Yourbae API Error:", error);

      return res.status(500).json({
        success: false,
        message: "Maaf, server Yourbae sedang mengalami masalah.",
      });
    }
  }

  return res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan.",
  });
  }
