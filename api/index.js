const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
  // =========================
  // HEALTH CHECK
  // =========================
  if (req.method === "GET" && req.url === "/api/health") {
    return res.status(200).json({
      success: true,
      status: "online",
      app: "Yourbae AI"
    });
  }

  // =========================
  // CHAT
  // =========================
  if (req.method === "POST" && req.url === "/api/chat") {
    try {
      const body = req.body || {};

      const messages = Array.isArray(body.messages)
        ? body.messages
        : [];

      if (messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Messages tidak boleh kosong."
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
          content: message.content
        }));

      const systemPrompt = `
Kamu adalah Yourbae AI.

Kamu adalah teman ngobrol yang ramah, hangat,
natural, perhatian, dan responsif.

Jawablah dalam bahasa yang digunakan pengguna.
Jangan terdengar seperti robot.
Tetap konsisten sebagai Yourbae.

Karakter ID: ${body.characterId || "anzelma"}
      `.trim();

      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-5",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...validMessages
        ],
        max_tokens: 1200
      });

      const reply =
        response.choices?.[0]?.message?.content ||
        "Maaf beb, aku belum mendapatkan jawaban.";

      return res.status(200).json({
        success: true,
        characterId: body.characterId || "anzelma",
        message: reply
      });

    } catch (error) {
      console.error("YOURBAE OPENAI ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Maaf beb, server Yourbae sedang mengalami masalah.",
        error: error.message
      });
    }
  }

  // =========================
  // NOT FOUND
  // =========================
  return res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan."
  });
};
