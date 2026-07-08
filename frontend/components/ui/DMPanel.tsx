"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, UserPlus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Friend { id: string; name: string; avatar: string | null; }
interface Msg { id: string; sender_id: string; content: string; created_at: string; }

export default function DMPanel({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!user) return;
    // Load people you follow
    supabase.from("follows").select("following_id").eq("follower_id", user.id)
      .then(async ({ data }) => {
        if (!data?.length) return;
        const ids = data.map(d => d.following_id);
        const { data: users } = await supabase.from("users").select("id,name,avatar").in("id", ids);
        setFriends(users ?? []);
      });
  }, [user]);

  useEffect(() => {
    if (!selected || !user) return;
    // Load DMs
    const roomId = [user.id, selected.id].sort().join("_");
    supabase.from("direct_messages").select("*").eq("room_id", roomId).order("created_at").then(({ data }) => setMessages(data ?? []));

    // Realtime
    const channel = supabase.channel(`dm_${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `room_id=eq.${roomId}` },
        payload => setMessages(prev => [...prev, payload.new as Msg]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const searchUsers = async (q: string) => {
    setSearchQ(q);
    if (!q.trim()) return setSearchResults([]);
    const { data } = await supabase.from("users").select("id,name,avatar").ilike("name", `%${q}%`).limit(5);
    setSearchResults(data ?? []);
  };

  const followUser = async (target: Friend) => {
    if (!user) return;
    await supabase.from("follows").upsert({ follower_id: user.id, following_id: target.id });
    setFriends(prev => [...prev.filter(f => f.id !== target.id), target]);
    setSearchResults([]);
    setSearchQ("");
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !selected) return;
    const roomId = [user.id, selected.id].sort().join("_");
    await supabase.from("direct_messages").insert({ room_id: roomId, sender_id: user.id, receiver_id: selected.id, content: input.trim() });
    setInput("");
  };

  if (!user) return (
    <div style={{ position: "fixed", left: 72, top: 64, bottom: 0, width: 360, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 39 }}>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Sign in to use messages</p>
    </div>
  );

  return (
    <div style={{ position: "fixed", left: 72, top: 64, bottom: 0, width: 360, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", zIndex: 39, boxShadow: "4px 0 24px rgba(79,93,180,0.08)" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
          {selected ? (
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 14, fontWeight: 600, padding: 0 }}>← Back</button>
          ) : "Messages"}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {!selected ? (
        <>
          {/* Search to add friends */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--muted)" }} />
              <input value={searchQ} onChange={e => searchUsers(e.target.value)} placeholder="Find people to follow..." className="input-base" style={{ paddingLeft: 36, fontSize: 13 }} />
            </div>
            {searchResults.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", fontSize: 14 }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{u.name}</div>
                </div>
                <button onClick={() => followUser(u)} className="btn-primary" style={{ padding: "5px 10px", fontSize: 12 }}>
                  <UserPlus style={{ width: 12, height: 12 }} /> Follow
                </button>
              </div>
            ))}
          </div>

          {/* Friends list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {friends.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                Search for people above to start messaging
              </div>
            ) : friends.map(f => (
              <div key={f.id} onClick={() => setSelected(f)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", fontSize: 16, flexShrink: 0 }}>
                  {f.avatar ? <img src={f.avatar} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} /> : f.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Tap to message</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Chat header */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)" }}>
              {selected.avatar ? <img src={selected.avatar} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} /> : selected.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{selected.name}</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.length === 0 && <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No messages yet. Say hi!</p>}
            {messages.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.sender_id === user.id ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%", padding: "9px 14px",
                  borderRadius: m.sender_id === user.id ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.sender_id === user.id ? "var(--accent)" : "var(--bg2)",
                  color: m.sender_id === user.id ? "white" : "var(--text)",
                  fontSize: 14, lineHeight: 1.5,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="input-base" style={{ flex: 1 }} />
            <button onClick={sendMessage} disabled={!input.trim()} className="btn-primary" style={{ padding: "10px 14px" }}>
              <Send style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}