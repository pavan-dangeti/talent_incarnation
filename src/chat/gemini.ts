import { GoogleGenAI } from "@google/genai";
import { MODEL_OUTPUT_JSON_SCHEMA, type Generate } from "./answer";

/** Chat needs a key and an explicit model name; no model id is hard-coded. */
export const chatConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_CHAT_MODEL);

export const geminiGenerate: Generate = async (system, user) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_CHAT_MODEL!,
    contents: user,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseJsonSchema: MODEL_OUTPUT_JSON_SCHEMA,
      maxOutputTokens: 1024,
      temperature: 0.2,
      abortSignal: AbortSignal.timeout(20_000),
    },
  });
  return response.text ?? "";
};
