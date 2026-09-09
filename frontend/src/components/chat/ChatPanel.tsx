"use client";

import { useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { api } from "@/services/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  grounded?: boolean;
};

const SUGGESTIONS = [
  "Pourquoi mon bénéfice a-t-il diminué cette semaine ?",
  "Quels produits dois-je surveiller ?",
  "Résume-moi mon activité de la semaine.",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await api.chat(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply.reply,
          grounded: reply.grounded,
        },
      ]);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le message.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <AppPageLayout
      className="chat-section"
      eyebrow="Intelligence"
      title="Assistant IA"
      description="Posez vos questions sur votre activité. Les réponses sont ancrées sur la dernière analyse calculée."
    >
      {error && <Alert variant="error">{error}</Alert>}

      <div className="chat-layout card card--glass">
        <div className="chat-messages" ref={listRef}>
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p className="muted">Commencez par une question ou choisissez une suggestion :</p>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="chat-suggestion"
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble chat-bubble--${msg.role}`}>
                <p>{msg.content}</p>
                {msg.role === "assistant" && msg.grounded !== undefined && (
                  <span className="chat-bubble__meta muted">
                    {msg.grounded ? "Réponse ancrée sur vos données" : "Réponse générale"}
                  </span>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
              <span className="typing-dots" aria-label="L'assistant répond…">
                <span /><span /><span />
              </span>
            </div>
          )}
        </div>

        <form className="chat-input-bar" onSubmit={handleSubmit}>
          <input
            className="chat-input-bar__field"
            type="text"
            placeholder="Posez votre question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            aria-label="Votre message"
          />
          <Button type="submit" disabled={!input.trim() || loading} loading={loading}>
            Envoyer
          </Button>
        </form>
      </div>
    </AppPageLayout>
  );
}
