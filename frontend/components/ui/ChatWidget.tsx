"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, MessageCircle, Sparkles, Send, ChevronDown, Bot, Users } from "lucide-react";
import { api } from "@/lib/api";

type Tab = "ai" | "dm";
type Message = { role: "user" | "assistant" | "system"; text: string; time: string };

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── AI Chat ──────────────────────────────────────────────────────────────────
function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hey! I can help you write, improve, or remix AI image prompts. What are you trying to create?", time: getTime() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", text: input, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        text: m.text,
      })).filter(m => m.role !== "system");

      const res = await api.chatPrompt(input, history);
      setMessages(prev => [...prev, { role: "assistant", text: res.reply, time: getTime() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error. Try again.", time: getTime() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%",
              padding: "9px 13px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? "linear-gradient(135deg, #7B5EA7, #9333ea)" : "var(--surface2)",
              border: m.role === "user" ? "none" : "1px solid var(--border)",
              fontSize: 13,
              lineHeight: 1.55,
              color: "var(--text)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {m.text}
            </div>
            <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 3, paddingInline: 2 }}>{m.time}</span>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent2)", animation: `bounce 1s ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask me to write a prompt..."
          className="input-base"
          style={{ fontSize: 13, borderRadius: 12, padding: "9px 14px" }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          background: "linear-gradient(135deg, #7B5EA7, #9333ea)",
          border: "none", borderRadius: 12, width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: input.trim() && !loading ? "pointer" : "not-allowed",
          opacity: input.trim() && !loading ? 1 : 0.5,
          flexShrink: 0,
        }}>
          <Send style={{ width: 15, height: 15, color: "white" }} />
        </button>
      </div>
    </div>
  );
}

// ── DM Chat ───────────────────────────────────────────────────────────────────
function DMChat({ currentUser }: { currentUser: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Poll for messages from the global community chat room
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("community_chat")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };

    fetchMessages();
    const channel = supabase
      .channel("community_chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_chat" }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const send = async () => {
    if (!input.trim() || !currentUser) return;
    const text = input.trim();
    setInput("");
    await supabase.from("community_chat").insert({
      user_id: currentUser.id,
      username: currentUser.email?.split("@")[0] ?? "user",
      text,
    });
  };

  if (!currentUser) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 12, textAlign: "center" }}>
        <Users style={{ width: 32, height: 32, color: "var(--muted)" }} />
        <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>Community Chat</p>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Sign in to chat with other creators</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "6px 14px 8px", borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>🌐 Community · {messages.length} messages</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) => {
          const isMe = m.user_id === currentUser.id;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              {!isMe && <span style={{ fontSize: 10, color: "var(--accent2)", marginBottom: 2, paddingLeft: 2 }}>{m.username}</span>}
              <div style={{
                maxWidth: "82%",
                padding: "8px 13px",
                borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isMe ? "linear-gradient(135deg, #7B5EA7, #9333ea)" : "var(--surface2)",
                border: isMe ? "none" : "1px solid var(--border)",
                fontSize: 13, lineHeight: 1.5, color: "var(--text)",
              }}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Say something..."
          className="input-base"
          style={{ fontSize: 13, borderRadius: 12, padding: "9px 14px" }}
        />
        <button onClick={send} disabled={!input.trim()} style={{
          background: "linear-gradient(135deg, #7B5EA7, #9333ea)",
          border: "none", borderRadius: 12, width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: input.trim() ? "pointer" : "not-allowed",
          opacity: input.trim() ? 1 : 0.5, flexShrink: 0,
        }}>
          <Send style={{ width: 15, height: 15, color: "white" }} />
        </button>
      </div>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("ai");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
  }, []);

  return (
    <>
      {/* Bounce keyframe */}
      <style>{`
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(16px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 100,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #7B5EA7, #9333ea)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(123,94,167,0.5)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open
          ? <ChevronDown style={{ width: 20, height: 20, color: "white" }} />
          : <MessageCircle style={{ width: 20, height: 20, color: "white" }} />
        }
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 28, zIndex: 99,
          width: 360, height: 480,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
          animation: "slideUp 0.2s ease",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 10, padding: 3 }}>
              {([
                { id: "ai", icon: Sparkles, label: "AI Assistant" },
                { id: "dm", icon: Users, label: "Community" },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: tab === id ? "var(--surface2)" : "transparent",
                  color: tab === id ? "var(--text)" : "var(--muted)",
                  boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                }}>
                  <Icon style={{ width: 12, height: 12 }} /> {label}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {tab === "ai" ? <AIChat /> : <DMChat currentUser={user} />}
          </div>
        </div>
      )}
    </>
  );
}