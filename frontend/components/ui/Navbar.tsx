"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Search, Upload, LogOut, Zap, Images, BookOpen, Trophy } from "lucide-react";

const TABS = [
  { label: "Images", href: "/", icon: Images },
  { label: "Prompts", href: "/search", icon: BookOpen },
  { label: "Trending", href: "/?tab=trending", icon: Trophy },
];

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const login = () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
  const logout = () => supabase.auth.signOut().then(() => setUser(null));
  const onSearch = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q)}`); };

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(13,13,13,0.95)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid #2a2a2a",
      height: 60, display: "flex", alignItems: "center",
      padding: "0 20px", gap: 16,
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
        <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b"/>
              <stop offset="100%" stopColor="#d97706"/>
            </linearGradient>
          </defs>
          <rect width="34" height="34" rx="10" fill="url(#lg)"/>
          <circle cx="17" cy="14" r="6" fill="white" opacity="0.95"/>
          <path d="M17 20 L17 29" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="17" cy="14" r="2.5" fill="url(#lg)"/>
        </svg>
        <span style={{ fontWeight: 800, fontSize: 18, color: "#f5f5f0", letterSpacing: "-0.3px" }}>
          Prompt<span style={{ color: "#f59e0b" }}>Pin</span>
        </span>
      </Link>

      <div style={{ display: "flex", gap: 2 }}>
        {TABS.map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 8, textDecoration: "none",
            fontSize: 13, fontWeight: 500, color: "#909080", transition: "all 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f0")}
          onMouseLeave={e => (e.currentTarget.style.color = "#909080")}>
            <Icon style={{ width: 14, height: 14 }} />{label}
          </Link>
        ))}
      </div>

      <form onSubmit={onSearch} style={{ flex: 1, maxWidth: 480, margin: "0 auto", position: "relative" }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#505040" }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search prompts, styles, models..."
          className="input-base" style={{ paddingLeft: 36, height: 38, borderRadius: 20 }} />
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        {user ? (
          <>
            <Link href="/upload" className="btn-primary" style={{ textDecoration: "none", padding: "7px 14px", fontSize: 13 }}>
              <Upload style={{ width: 13, height: 13 }} /> Upload
            </Link>
            <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", border: "2px solid #2a2a2a", cursor: "pointer", flexShrink: 0 }}
              onClick={() => router.push("/profile")}>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#f59e0b", fontSize: 13 }}>
                    {user.email?.[0]?.toUpperCase()}
                  </div>
              }
            </div>
            <button onClick={logout} className="btn-ghost" style={{ padding: "7px 10px" }}>
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </>
        ) : (
          <button onClick={login} className="btn-primary" style={{ padding: "7px 16px", fontSize: 13 }}>
            <Zap style={{ width: 13, height: 13 }} /> Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
