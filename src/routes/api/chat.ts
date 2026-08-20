import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
} from "@/lib/ai-gateway.server";

const MODES = {
  ask: `The student asked a question. Answer clearly and correctly, then briefly explain the reasoning so they actually learn it. Use short paragraphs, bullet points and bold key terms. For math/science, show the steps.`,
  vocab: `The student wants vocabulary help. For each word give: **the word** (part of speech), a simple kid-friendly definition, a clear example sentence, synonyms/antonyms, and a quick memory trick. Use markdown headings per word.`,
  essay: `The student wants essay help. Produce a well-structured essay or outline: a clear thesis, intro, body paragraphs with topic sentences and evidence, and a conclusion. Match the requested length, grade level and style. End with a short "How to make it yours" tip list so it's a learning aid, not just copied work.`,
} as const;

type Mode = keyof typeof MODES;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "AI is not configured." }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const body = (await request.json()) as { messages?: UIMessage[]; mode?: Mode };
        const messages = body.messages ?? [];
        const mode: Mode = body.mode && body.mode in MODES ? body.mode : "ask";

        const gateway = createLovableAiGatewayProvider(
          apiKey,
          getLovableAiGatewayRunId(request),
        );

        try {
          const result = streamText({
            model: gateway("google/gemini-3.7-flash"),
            system: `You are Scholar, a patient, encouraging study assistant for students of any grade.
Always be accurate, age-appropriate and encouraging. Use markdown. Never do a student's work dishonestly without also teaching: include brief explanations or study tips.
${MODES[mode]}`,
            messages: convertToModelMessages(messages),
          });

          return result.toUIMessageStreamResponse();
        } catch (error) {
          const message = error instanceof Error ? error.message : "AI request failed.";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
