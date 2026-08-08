import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

import {
  createCharacterPrompt
} from "../config/character.config.js";

dotenv.config();

const app = express();

app.use(express.json());


// ======================================================
// OPENAI
// ======================================================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    app: "Yourbae AI"
  });
});


// ======================================================
// CHAT
// ======================================================

app.post("/api/chat", async (req, res) => {

  try {

    const {
      messages = [],
      characterId = "anzelma",
      systemPrompt
    } = req.body;


    // --------------------------------------------------
    // VALIDASI
    // --------------------------------------------------

    if (!Array.isArray(messages)) {

      return res.status(400).json({
        success: false,
        message: "Format messages tidak valid."
      });

    }


    // --------------------------------------------------
    // CHARACTER PROMPT
    // --------------------------------------------------

    const characterPrompt =
      createCharacterPrompt(characterId);


    const finalSystemPrompt =
      characterPrompt +
      (
        systemPrompt
          ? "\n\nKONTEKS TAMBAHAN:\n" + systemPrompt
          : ""
      );


    // --------------------------------------------------
    // HISTORY
    // --------------------------------------------------

    const recentMessages =
      messages.slice(-20);


    const validMessages =
      recentMessages
        .filter(message => {

          return (
            message &&
            (
              message.role === "user" ||
              message.role === "assistant"
            ) &&
            typeof message.content === "string"
          );

        })
        .map(message => ({

          role: message.role,
          content: message.content

        }));


    // --------------------------------------------------
    // OPENAI RESPONSES API
    // --------------------------------------------------

    const response =
      await client.responses.create({

        model:
          process.env.OPENAI_MODEL || "gpt-5",

        instructions:
          finalSystemPrompt,

        input:
          validMessages,

        max_output_tokens:
          1200

      });


    // --------------------------------------------------
    // JAWABAN
    // --------------------------------------------------

    const outputText =
      response.output_text || "";


    return res.json({

      success: true,

      characterId:
        characterId,

      message:
        outputText

    });


  } catch (error) {

    console.error(
      "[Yourbae API Error]",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Maaf, server AI sedang mengalami masalah."

    });

  }

});


// ======================================================
// VERCEL
// ======================================================

export default app;
