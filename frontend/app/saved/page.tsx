"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import ImageCard from "@/components/feed/ImageCard";
import Masonry from "react-masonry-css";
import { Bookmark, LogIn } from "lucide-react";

const breakpoints = { default: 4, 1280: 3, 768: 2, 640: 1 };

export default function SavedPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSignedIn(false); setLoading(false); return; }
      try {
        const data = await api.getSavedImages(session.access_token);
        setImages(data);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 32, color: "var(--muted)" }}>Loading...</div>;

  if (!signedIn) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Sign in to see your saved prompts</p>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })} className="btn-primary">
        <LogIn style={{ width: 15, height: 15 }} /> Login with Google
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Bookmark style={{ width: 20, height: 20, color: "var(--accent)" }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>Saved prompts</h1>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>({images.length})</span>
      </div>
      {images.length === 0
        ? <p style={{ color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>
            Nothing saved yet — tap the bookmark icon on any card to save it here.
          </p>
        : <Masonry breakpointCols={breakpoints} className="masonry-grid" columnClassName="masonry-col">
            {images.map(img => <ImageCard key={img.id} image={img} />)}
          </Masonry>
      }
    </div>
  );
}
