import { GoogleGenAI } from "@google/genai";
import { MODEL_OUTPUT_JSON_SCHEMA, type Generate } from "./answer";
import { QUICK_RETRY, withRetry } from "./retry";

/** Chat needs a key and an explicit model name; no model id is hard-coded. */
export const chatConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_CHAT_MODEL);

/** One call to the model, with no retry. The evaluation script wraps this with its own policy. */
export const geminiGenerateOnce: Generate = async (system, user) => {
  // The SDK's own retries are turned off so that retry behaviour is defined in one place.
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { retryOptions: { attempts: 1 } },
  });
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

/**
 * What the chat page uses: a 503 or a per-minute rate limit gets one quick
 * retry before the user is shown the error message. Timeouts are not retried
 * here, because the user has already waited 20 seconds.
 */
export const geminiGenerate: Generate = (system, user) =>
  withRetry(() => geminiGenerateOnce(system, user), QUICK_RETRY, {
    onRetry: ({ reason, waitMs }) => console.warn(`chat: model call failed (${reason}); retrying in ${waitMs} ms`),
  });
