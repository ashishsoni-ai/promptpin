"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Heart, Copy, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ImageCard from "@/components/feed/ImageCard";

export default function ImageDetailPage({ params }: { params: { id: string } }) {
  const [image, setImage] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.getImage(params.id).then(img => {
      setImage(img);
      setLikes(img.likes_count ?? 0);
      // Fetch similar by same style
      // Get similar by style + model combined
// Extract keywords from prompt for better matching
const keywords = img.prompt
  .toLowerCase()
  .split(/[\s,]+/)
  .filter((w: string) => w.length > 4)
  .slice(0, 3);

Promise.all([
  api.getFeed({ style: img.style }),
  api.search(keywords[0] ?? img.style),
  keywords[1] ? api.search(keywords[1]) : Promise.resolve([]),
]).then(([byStyle, byKeyword1, byKeyword2]) => {
  const combined = [...byKeyword1, ...byKeyword2, ...byStyle];
  const seen = new Set<string>();
  const unique = combined.filter((i: any) => {
    if (i.id === params.id || seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
  setSimilar(unique.slice(0, 8));
});
    });
  }, [params.id]);

  const handleLike = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error("Sign in to like");
    const res = await api.likeImage(image.id, session.access_token);
    setLiked(res.liked);
    setLikes((l: number) => l + (res.liked ? 1 : -1));
  };

  const handleCopy = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await api.copyPrompt(image.id, session?.access_token);
      await navigator.clipboard.writeText(res.prompt);
      setCopied(true);
      toast.success("Prompt copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      if (/pro|limit/i.test(e.message)) {
        toast.error(e.message, { action: { label: "Go Pro", onClick: () => router.push("/pro") } });
      } else {
        toast.error(e.message);
      }
    }
  };

  if (!image) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 60px" }}>
      {/* Back */}
      <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 14, fontWeight: 500, marginBottom: 24, padding: 0 }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
        {/* Image */}
        <div style={{ borderRadius: 20, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
          <img src={image.image_url} alt={image.prompt} style={{ width: "100%", display: "block" }} />
        </div>

        {/* Info panel */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, boxShadow: "var(--shadow)" }}>
            {/* Tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {image.style && <span className="tag">{image.style}</span>}
              {image.model && <span style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{image.model}</span>}
              {image.tags?.map((t: string) => <span key={t} className="tag">{t}</span>)}
            </div>

            {/* Prompt */}
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Prompt</h2>
            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, background: "var(--bg2)", padding: 14, borderRadius: 12, marginBottom: 20 }}>
              {image.prompt}
            </p>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCopy} className="btn-primary" style={{ flex: 1, justifyContent: "center", borderRadius: 12 }}>
                {copied ? <Check style={{ width: 15, height: 15 }} /> : <Copy style={{ width: 15, height: 15 }} />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
              <button onClick={handleLike} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border)",
                background: liked ? "#fff1f2" : "white", cursor: "pointer",
                color: liked ? "#f43f5e" : "var(--text2)", fontWeight: 600, fontSize: 14,
              }}>
                <Heart style={{ width: 15, height: 15, fill: liked ? "#f43f5e" : "none" }} />
                {likes}
              </button>
            </div>

            {/* Aspect ratio */}
            {image.aspect_ratio && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>
                Aspect ratio: <strong>{image.aspect_ratio}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Similar prompts */}
      {similar.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>
            Similar prompts
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {similar.map(img => <ImageCard key={img.id} image={img} />)}
          </div>
        </div>
      )}
    </div>
  );
}