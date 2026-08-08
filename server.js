// ======================================================
// server.js
// Yourbae AI Backend
// ======================================================

import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

import {
    createCharacterPrompt
} from "./config/character.config.js";

dotenv.config();

const app = express();

const PORT =
    process.env.PORT || 3000;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());


// ======================================================
// OPENAI CLIENT
// ======================================================

const client = new OpenAI({

    apiKey:
        process.env.OPENAI_API_KEY

});


// ======================================================
// CHAT API
// ======================================================

app.post(
    "/api/chat",
    async (req, res) => {

        try {

            const {

                messages = [],

                characterId = "anzelma",

                systemPrompt

            } = req.body;


            // --------------------------------------------------
            // Validasi messages
            // --------------------------------------------------

            if (!Array.isArray(messages)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Format messages tidak valid."

                });

            }


            // --------------------------------------------------
            // Buat personality prompt
            // --------------------------------------------------

            const characterPrompt =
                createCharacterPrompt(
                    characterId
                );


            // --------------------------------------------------
            // Jika frontend mengirim systemPrompt,
            // gabungkan dengan personality karakter.
            // --------------------------------------------------

            const finalSystemPrompt =

                characterPrompt +

                (
                    systemPrompt
                        ? "\n\nKONTEKS TAMBAHAN:\n" +
                          systemPrompt
                        : ""
                );


            // --------------------------------------------------
            // Ambil maksimal 20 pesan terakhir
            // --------------------------------------------------

            const recentMessages =
                messages.slice(-20);


            // --------------------------------------------------
            // Pastikan hanya role yang valid
            // --------------------------------------------------

            const validMessages =
                recentMessages
                    .filter(message => {

                        return (

                            message &&

                            (
                                message.role === "user" ||
                                message.role === "assistant"
                            ) &&

                            typeof message.content ===
                                "string"

                        );

                    })
                    .map(message => ({

                        role:
                            message.role,

                        content:
                            message.content

                    }));


            // --------------------------------------------------
            // Panggil OpenAI
            // --------------------------------------------------

            const response =
                await client.responses.create({

                    model:
                        process.env.OPENAI_MODEL ||
                        "gpt-5",

                    instructions:
                        finalSystemPrompt,

                    input:
                        validMessages,

                    max_output_tokens:
                        1200

                });


            // --------------------------------------------------
            // Ambil jawaban AI
            // --------------------------------------------------

            const outputText =
                response.output_text || "";


            // --------------------------------------------------
            // Response ke frontend
            // --------------------------------------------------

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

    }
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            status: "online",

            app:
                "Yourbae AI"

        });

    }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Yourbae AI running on port ${PORT}`
        );

    }
);
