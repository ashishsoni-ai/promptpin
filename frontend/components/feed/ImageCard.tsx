"use client";
import { useState } from "react";
import { Heart, Copy, Check, Zap, Wand2, Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const BORDER_COLORS = [
  "#f59e0b", "#ec4899", "#06b6d4", "#10b981",
  "#8b5cf6", "#f97316", "#3b82f6", "#ef4444",
  "#84cc16", "#a855f7", "#14b8a6", "#f43f5e",
];

function getCardColor(id: string): string {
  const chars = (id ?? "").replace(/-/g, "");
  const num = parseInt(chars.slice(-4), 16) || 0;
  return BORDER_COLORS[num % BORDER_COLORS.length];
}

function getLikeGlow(likes: number, color: string): string {
  if (likes >= 50) return `0 0 20px ${color}80, 0 0 40px ${color}40`;
  if (likes >= 20) return `0 0 14px ${color}60`;
  if (likes >= 5) return `0 0 8px ${color}40`;
  return "none";
}

const upsellToast = (msg: string, router: any) => {
  if (/pro|limit/i.test(msg)) {
    toast.error(msg, { action: { label: "Go Pro", onClick: () => router.push("/pro") } });
  } else {
    toast.error(msg);
  }
};

export default function ImageCard({ image, index = 0 }: { image: any; index?: number }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(image.likes_count ?? 0);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  const borderColor = getCardColor(image.id ?? String(index));
  const glowShadow = getLikeGlow(likes, borderColor);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error("Sign in to like");
    try {
      const res = await api.likeImage(image.id, session.access_token);
      setLiked(res.liked);
      setLikes((l: number) => l + (res.liked ? 1 : -1));
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); setCopying(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await api.copyPrompt(image.id, session?.access_token);
      await navigator.clipboard.writeText(res.prompt);
      setCopied(true); toast.success("Prompt copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) { upsellToast(e.message, router); }
    finally { setCopying(false); }
  };

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/upload?remix=${encodeURIComponent(image.prompt)}`);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error("Sign in to save");
    try {
      const res = await api.quickSave(image.id, session.access_token);
      setSaved(res.saved);
      toast.success(res.saved ? "Saved!" : "Removed from saved");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/image/${image.id}`)}
      style={{
        cursor: "pointer", borderRadius: 12, overflow: "hidden",
        background: "#1a1a1a",
        border: `1.5px solid ${hovered ? borderColor : borderColor + "55"}`,
        boxShadow: hovered
          ? `${glowShadow !== "none" ? glowShadow + ", " : ""}0 0 0 1px ${borderColor}30, 0 8px 30px rgba(0,0,0,0.5)`
          : glowShadow !== "none" ? glowShadow : "0 2px 12px rgba(0,0,0,0.3)",
        transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden", width: "100%" }}>
        <img
          src={image.image_url}
          alt={image.prompt?.slice(0, 60) || "AI image"}
          style={{ width: "100%", display: "block", transition: "transform 0.4s", transform: hovered ? "scale(1.04)" : "scale(1)" }}
          loading="lazy"
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${borderColor}, ${borderColor}66)` }} />
        {image.model && (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <span style={{ background: "rgba(13,13,13,0.85)", backdropFilter: "blur(8px)", color: borderColor, border: `1px solid ${borderColor}50`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
              {image.model}
            </span>
          </div>
        )}
        {image.is_premium && (
          <div style={{ position: "absolute", top: 10, right: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 6, padding: "2px 8px", display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#0d0d0d" }}>
            <Zap style={{ width: 9, height: 9 }} /> PRO
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(13,13,13,0.97) 0%, rgba(13,13,13,0.4) 55%, transparent 100%)",
          opacity: hovered ? 1 : 0, transition: "opacity 0.2s",
          padding: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8,
        }}>
          <p style={{ color: "rgba(245,245,240,0.85)", fontSize: 11, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: "italic" }}>
            "{image.prompt?.slice(0, 100)}{(image.prompt?.length ?? 0) > 100 ? "..." : ""}"
          </p>
          {image.style && (
            <span style={{ alignSelf: "flex-start", background: `${borderColor}20`, color: borderColor, border: `1px solid ${borderColor}40`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 500 }}>
              {image.style}
            </span>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleLike} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: liked ? "rgba(244,63,94,0.2)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${liked ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8, padding: "6px", cursor: "pointer",
              color: liked ? "#f43f5e" : "rgba(245,245,240,0.8)", fontSize: 12, transition: "all 0.2s",
            }}>
              <Heart style={{ width: 12, height: 12, fill: liked ? "#f43f5e" : "none" }} /> {likes}
            </button>
            <button onClick={handleCopy} disabled={copying} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: copied ? `${borderColor}20` : "rgba(255,255,255,0.07)",
              border: `1px solid ${copied ? borderColor + "60" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8, padding: "6px", cursor: "pointer",
              color: copied ? borderColor : "rgba(245,245,240,0.8)", fontSize: 12, transition: "all 0.2s",
            }}>
              {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={handleRemix} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 8, padding: "6px", cursor: "pointer",
              color: "#fbbf24", fontSize: 12, transition: "all 0.2s",
            }}>
              <Wand2 style={{ width: 12, height: 12 }} /> Remix
            </button>
          </div>
        </div>
      </div>
      <div style={{ padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${borderColor}25`, background: "#1a1a1a" }}>
        <div
          onClick={(e) => { e.stopPropagation(); const cid = image.users?.id ?? image.user_id; if (cid) router.push(`/profile/${cid}`); }}
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", minWidth: 0 }}
        >
          {image.users?.avatar ? (
            <img src={image.users.avatar} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: `linear-gradient(135deg, ${borderColor}, ${borderColor}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#0d0d0d", flexShrink: 0 }}>
              {(image.users?.name ?? "P").charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 11, color: "#909080", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {image.users?.name ?? "PromptPin"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: likes > 0 ? "#f43f5e" : "#505040" }}>
            <Heart style={{ width: 10, height: 10, fill: likes > 0 ? "#f43f5e" : "none" }} /> {likes}
          </span>
          <button
            onClick={handleSave}
            title={saved ? "Remove from saved" : "Save"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: saved ? borderColor : "#505040" }}
          >
            <Bookmark style={{ width: 12, height: 12, fill: saved ? borderColor : "none" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
