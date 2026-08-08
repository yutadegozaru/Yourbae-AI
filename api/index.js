import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Test endpoint
    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json({
        success: true,
        status: "online",
        app: "Yourbae AI",
      });
    }

    // Chat endpoint
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();

        const messages = Array.isArray(body.messages)
          ? body.messages
          : [];

        const characterId = body.characterId || "anzelma";
        const systemPrompt = body.systemPrompt || "";

        if (messages.length === 0) {
          return Response.json(
            {
              success: false,
              message: "Messages tidak boleh kosong.",
            },
            { status: 400 }
          );
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

        const finalInstructions = `
Kamu adalah Yourbae AI.

Character ID: ${characterId}

${systemPrompt}

Tetap konsisten dengan karakter, ramah, natural, dan responsif.
        `.trim();

        const response = await client.responses.create({
          model: process.env.OPENAI_MODEL || "gpt-5",
          instructions: finalInstructions,
          input: validMessages,
          max_output_tokens: 1200,
        });

        return Response.json({
          success: true,
          characterId,
          message: response.output_text || "",
        });
      } catch (error) {
        console.error("Yourbae API Error:", error);

        return Response.json(
          {
            success: false,
            message: "Maaf, server Yourbae sedang mengalami masalah.",
          },
          { status: 500 }
        );
      }
    }

    return Response.json(
      {
        success: false,
        message: "Endpoint tidak ditemukan.",
      },
      { status: 404 }
    );
  },
};
