"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import ImageCard from "@/components/feed/ImageCard";
import Filters from "@/components/feed/Filters";
import { Flame, Clock, TrendingUp, Sparkles, Loader2, ChevronRight, Trophy } from "lucide-react";

function CollectionRow({ title, emoji, description, filter, color }: {
  title: string; emoji: string; description: string;
  filter: Record<string, string>; color: string;
}) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFeed({ ...filter, limit: "8" }).then(data => {
      setImages(data.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (!loading && images.length === 0) return null;

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            {emoji}
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f0" }}>{title}</h2>
            <p style={{ fontSize: 12, color: "#505040", marginTop: 1 }}>{description}</p>
          </div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: color, fontSize: 13, fontWeight: 600 }}>
          View all <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ width: 200, height: 260, flexShrink: 0, borderRadius: 12, background: "linear-gradient(90deg, #1a1a1a 25%, #202020 50%, #1a1a1a 75%)", backgroundSize: "800px 100%", animation: "shimmer 1.6s infinite" }} />
            ))
          : images.map((img, i) => (
              <div key={img.id} style={{ width: 200, flexShrink: 0 }}>
                <ImageCard image={img} index={i} />
              </div>
            ))
        }
      </div>
      <div style={{ height: 1, background: "#2a2a2a", marginTop: 24 }} />
    </div>
  );
}

function MasonryGrid({ images }: { images: any[] }) {
  const cols = 4;
  const columns: any[][] = Array.from({ length: cols }, () => []);
  images.forEach((img, i) => columns[i % cols].push(img));
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {col.map((img, i) => <ImageCard key={img.id} image={img} index={ci * 100 + i} />)}
        </div>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  const heights = [280, 360, 220, 300, 400, 250, 320, 280, 260, 340, 210, 290];
  const cols = 4;
  const columns = Array.from({ length: cols }, (_, ci) => heights.filter((_, i) => i % cols === ci));
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {col.map((h, i) => <div key={i} style={{ height: h, borderRadius: 12, background: "linear-gradient(90deg, #1a1a1a 25%, #202020 50%, #1a1a1a 75%)", backgroundSize: "800px 100%", animation: "shimmer 1.6s infinite" }} />)}
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "trending", icon: Flame, label: "Hot" },
  { id: "new", icon: Clock, label: "New" },
  { id: "top", icon: TrendingUp, label: "Top" },
];

const COLLECTIONS: { title: string; emoji: string; description: string; filter: Record<string, string>; color: string }[] = [
  { title: "🔥 Trending Today", emoji: "🔥", description: "Most liked images in the last 24 hours", filter: { limit: "8" }, color: "#f59e0b" },
  { title: "Portrait Masters", emoji: "👤", description: "Stunning photorealistic portraits", filter: { style: "photorealistic" }, color: "#06b6d4" },
  { title: "Anime World", emoji: "⛩️", description: "Best anime and manga style art", filter: { style: "anime" }, color: "#ec4899" },
  { title: "Digital Dreams", emoji: "🎨", description: "Digital art and concept illustrations", filter: { style: "digital art" }, color: "#8b5cf6" },
  { title: "Midjourney Masters", emoji: "✨", description: "Top Midjourney generations", filter: { model: "Midjourney" }, color: "#f59e0b" },
];

export default function FeedPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("trending");
  const [showCollections, setShowCollections] = useState(true);
  const loadingMoreRef = useRef(false);

  const sortParam = activeTab === "trending" ? "trending" : activeTab === "top" ? "top" : "new";

  useEffect(() => {
    setImages([]); setPage(1); setHasMore(true); setLoading(true);
    api.getFeed({ ...filters, sort: sortParam, page: "1", limit: "40" })
      .then(data => { setImages(data); setHasMore(data.length === 40); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, activeTab]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await api.getFeed({ ...filters, sort: sortParam, page: String(nextPage), limit: "40" });
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setImages(prev => {
          const ids = new Set(prev.map((i: any) => i.id));
          return [...prev, ...data.filter((i: any) => !ids.has(i.id))];
        });
        setPage(nextPage);
        setHasMore(data.length === 40);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); loadingMoreRef.current = false; }
  }, [page, filters, hasMore, sortParam]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 400) loadMore();
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {showCollections && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy style={{ width: 18, height: 18, color: "#f59e0b" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f0" }}>Featured Collections</span>
            </div>
            <button onClick={() => setShowCollections(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#505040", fontSize: 12 }}>Hide</button>
          </div>
          {COLLECTIONS.map(col => <CollectionRow key={col.title} {...col} />)}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!showCollections && (
            <button onClick={() => setShowCollections(true)} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#909080", cursor: "pointer" }}>
              Show Collections
            </button>
          )}
          <div style={{ display: "flex", gap: 4, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 4 }}>
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "none", transition: "all 0.2s",
                background: activeTab === id ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                color: activeTab === id ? "#0d0d0d" : "#909080",
                boxShadow: activeTab === id ? "0 2px 12px rgba(245,158,11,0.3)" : "none",
              }}>
                <Icon style={{ width: 13, height: 13 }} /> {label}
              </button>
            ))}
          </div>
        </div>
        <Filters onChange={setFilters} />
      </div>

      {loading ? <SkeletonGrid /> : (
        images.length === 0
          ? <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Sparkles style={{ width: 40, height: 40, color: "#505040", margin: "0 auto 16px" }} />
              <p style={{ fontSize: 18, fontWeight: 600, color: "#f5f5f0", marginBottom: 8 }}>No prompts yet</p>
              <p style={{ color: "#505040" }}>Be the first to upload!</p>
            </div>
          : <>
              <MasonryGrid images={images} />
              <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 20 }}>
                {loadingMore && <Loader2 style={{ width: 24, height: 24, color: "#f59e0b", animation: "spin 0.8s linear infinite" }} />}
                {!hasMore && images.length > 0 && <p style={{ color: "#505040", fontSize: 13 }}>✨ You've seen everything!</p>}
              </div>
            </>
      )}
    </div>
  );
}
