"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface Msg { role: "user" | "assistant"; text: string; }

const SUGGESTIONS = [
  "Give me a cyberpunk city prompt",
  "How do I write better prompts?",
  "Suggest an anime portrait prompt",
  "What makes a great Midjourney prompt?",
];

export default function ChatBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! I'm your AI prompt assistant. Ask me to generate, improve or explain any AI image prompt 🎨" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Map history format to match what backend expects (role/text)
      const mappedHistory = messages.map(m => ({ role: m.role, text: m.text }));
      const res = await api.chatPrompt(text, mappedHistory);
      setMessages(prev => [...prev, { role: "assistant", text: res.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error. Try again." }]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      position: "fixed", left: 72, top: 64, bottom: 0,
      width: 360, background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      zIndex: 39, boxShadow: "4px 0 24px rgba(79,93,180,0.08)",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot style={{ width: 18, height: 18, color: "white" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>Prompt Assistant</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Powered by Groq LLaMA3</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles style={{ width: 14, height: 14, color: "var(--accent)" }} />
              </div>
            )}
            <div style={{
              maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? "var(--accent)" : "var(--bg2)",
              color: m.role === "user" ? "white" : "var(--text)",
              fontSize: 14, lineHeight: 1.6,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles style={{ width: 14, height: 14, color: "var(--accent)" }} />
            </div>
            <div style={{ background: "var(--bg2)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted)", animation: `bounce 1s ${i*0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 999, padding: "5px 12px", fontSize: 12, color: "var(--text2)", cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder="Ask about prompts..."
          className="input-base"
          style={{ flex: 1 }}
        />
        <button onClick={() => send(input)} disabled={!input.trim() || loading} className="btn-primary" style={{ padding: "10px 14px", borderRadius: 12 }}>
          <Send style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}