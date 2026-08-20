import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  BookOpenText,
  GraduationCap,
  Loader2,
  PenLine,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scholar AI — Homework Help, Vocabulary & Essay Writing" },
      {
        name: "description",
        content:
          "Scholar AI is a study assistant that answers school questions, explains vocabulary words, and helps you build well-structured essays.",
      },
      { property: "og:title", content: "Scholar AI — Your School Study Assistant" },
      {
        property: "og:description",
        content:
          "Ask any school question, learn vocabulary with examples, and build essays with clear structure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const MODES = [
  {
    id: "ask" as const,
    label: "Ask a question",
    short: "Ask",
    icon: GraduationCap,
    placeholder: "Ask anything — math, science, history, reading…",
    prompts: [
      "Explain photosynthesis for a 7th grader",
      "How do I solve 3x + 7 = 22?",
      "What caused World War I?",
    ],
  },
  {
    id: "vocab" as const,
    label: "Vocabulary",
    short: "Vocab",
    icon: BookOpenText,
    placeholder: "Type words to define, e.g. 'resilient, candid, ephemeral'",
    prompts: [
      "Define: resilient, candid, ephemeral",
      "10 SAT words with example sentences",
      "Quiz me on 5 words about weather",
    ],
  },
  {
    id: "essay" as const,
    label: "Essay builder",
    short: "Essay",
    icon: PenLine,
    placeholder: "Topic, length and grade level — e.g. '5-paragraph essay on recycling, 9th grade'",
    prompts: [
      "5-paragraph essay on why recycling matters (9th grade)",
      "Outline a persuasive essay about school uniforms",
      "Thesis ideas for an essay on The Great Gatsby",
    ],
  },
];

type ModeId = (typeof MODES)[number]["id"];

function textOf(message: { parts?: Array<{ type: string; text?: string }> }) {
  return (message.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}

function Home() {
  const [mode, setMode] = useState<ModeId>("ask");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const active = MODES.find((m) => m.id === mode)!;
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    sendMessage({ text: value }, { body: { mode } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-hero flex size-9 items-center justify-center rounded-xl text-primary-foreground shadow-soft">
              <Sparkles className="size-4.5" />
            </span>
            <div className="leading-tight">
              <h1 className="text-lg font-semibold text-foreground">Scholar AI</h1>
              <p className="text-[11px] text-muted-foreground">Your study buddy for school</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              <RotateCcw className="size-3.5" />
              New chat
            </button>
          )}
        </div>
        <div className="mx-auto flex w-full max-w-3xl gap-1.5 overflow-x-auto px-4 pb-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const on = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  on
                    ? "border-transparent bg-primary text-primary-foreground shadow-soft"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="size-4" />
                {m.short}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        {messages.length === 0 ? (
          <section className="pt-4 text-center">
            <h2 className="text-balance text-3xl font-semibold text-foreground">
              Homework help that actually explains it
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Ask questions, master vocabulary, and build strong essays — with clear steps so you
              learn along the way.
            </p>
            <div className="mt-7 space-y-2.5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Try {active.label.toLowerCase()}
              </p>
              {active.prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-all hover:border-accent hover:shadow-soft"
                >
                  <span>{p}</span>
                  <ArrowUp className="size-4 shrink-0 rotate-45 text-accent" />
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const mine = message.role === "user";
              const body = textOf(message);
              return (
                <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-card-foreground shadow-soft"
                    }`}
                  >
                    {mine ? (
                      <p className="whitespace-pre-wrap">{body}</p>
                    ) : body ? (
                      <div className="prose-chat">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> Thinking…
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error.message || "Something went wrong. Please try again."}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/90 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 py-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={active.placeholder}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            className="bg-hero flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-soft transition-opacity disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
          </button>
        </form>
        <p className="pb-3 text-center text-[11px] text-muted-foreground">
          Scholar AI can make mistakes — always check your work.
        </p>
      </div>
    </div>
  );
}
