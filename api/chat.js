import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak diizinkan.",
    });
  }

  try {
    const { messages = [], characterId = "anzelma" } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Messages tidak boleh kosong.",
      });
    }

    const validMessages = messages
      .slice(-20)
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions: `
Kamu adalah Yourbae AI.

Character ID: ${characterId}

Kamu adalah teman ngobrol yang ramah, hangat, natural, dan responsif.
Jawablah dalam bahasa yang digunakan pengguna.
Jangan mengatakan bahwa server sedang bermasalah kecuali memang terjadi error.
      `.trim(),
      input: validMessages,
      max_output_tokens: 1200,
    });

    return res.status(200).json({
      success: true,
      characterId,
      message: response.output_text || "Maaf, aku belum bisa menjawab.",
    });

  } catch (error) {
    console.error("OPENAI ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "OpenAI API error.",
      error: error?.message || String(error),
    });
  }
}
