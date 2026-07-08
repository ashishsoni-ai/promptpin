"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import ImageCard from "@/components/feed/ImageCard";
import { LogIn, Upload, Heart, Copy, Grid3X3, Settings } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"uploads" | "liked">("uploads");
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalCopies, setTotalCopies] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const imgs = await api.getUserImages(data.user.id).catch(() => []);
        setImages(imgs);
        setTotalLikes(imgs.reduce((sum: number, img: any) => sum + (img.likes_count ?? 0), 0));
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LogIn style={{ width: 32, height: 32, color: "var(--muted)" }} />
      </div>
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Sign in to view profile</p>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Login with Google to see your uploads and stats</p>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })}
        className="btn-primary" style={{ padding: "12px 28px", fontSize: 15 }}>
        <LogIn style={{ width: 16, height: 16 }} /> Login with Google
      </button>
    </div>
  );

  const avatar = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0];
  const cols = 3;
  const columns: any[][] = Array.from({ length: cols }, () => []);
  images.forEach((img, i) => columns[i % cols].push(img));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* Profile header */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, marginBottom: 28, position: "relative", overflow: "hidden" }}>
        {/* Background gradient */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 100, background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.08))", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, position: "relative" }}>
          {/* Avatar */}
          <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--accent)", flexShrink: 0, boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}>
            {avatar
              ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--accent), #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#0d0d0d" }}>
                  {name?.[0]?.toUpperCase()}
                </div>
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{name}</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>{user.email}</p>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { icon: Grid3X3, label: "Uploads", value: images.length },
                { icon: Heart, label: "Total Likes", value: totalLikes },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>{value}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon style={{ width: 11, height: 11 }} /> {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/upload" className="btn-primary" style={{ textDecoration: "none" }}>
              <Upload style={{ width: 14, height: 14 }} /> Upload
            </Link>
            <button className="btn-ghost" style={{ padding: "9px 12px" }}>
              <Settings style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {[
          { id: "uploads", label: "My Uploads", icon: Grid3X3 },
          { id: "liked", label: "Liked", icon: Heart },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as any)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 18px", borderRadius: 7, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all 0.2s",
            background: activeTab === id ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
            color: activeTab === id ? "#0d0d0d" : "var(--text2)",
          }}>
            <Icon style={{ width: 13, height: 13 }} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {images.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Grid3X3 style={{ width: 48, height: 48, color: "var(--muted)", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>No uploads yet</p>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>Share your first AI prompt with the community</p>
          <Link href="/upload" className="btn-primary" style={{ textDecoration: "none" }}>
            <Upload style={{ width: 14, height: 14 }} /> Upload your first prompt
          </Link>
        </div>
      ) : (
        <div className="masonry-grid">
          {columns.map((col, ci) => (
            <div key={ci} className="masonry-col">
              {col.map((img, i) => <ImageCard key={img.id} image={img} index={ci * 100 + i} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}