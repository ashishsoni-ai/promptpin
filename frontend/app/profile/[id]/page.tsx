"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import ImageCard from "@/components/feed/ImageCard";
import Masonry from "react-masonry-css";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const breakpoints = { default: 3, 768: 2, 640: 1 };

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const [p, imgs] = await Promise.all([
          api.getUserProfile(params.id, session?.access_token),
          api.getUserImages(params.id),
        ]);
        // Own profile lives at /profile
        if (p.is_me) { router.replace("/profile"); return; }
        setProfile(p);
        setImages(imgs);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const toggleFollow = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error("Sign in to follow creators");
    setFollowBusy(true);
    try {
      const res = await api.toggleFollow(params.id, session.access_token);
      setProfile((p: any) => ({
        ...p,
        is_following: res.following,
        followers: p.followers + (res.following ? 1 : -1),
      }));
      toast.success(res.following ? `Following ${profile.name}` : "Unfollowed");
    } catch (e: any) { toast.error(e.message); }
    finally { setFollowBusy(false); }
  };

  if (loading) return <div style={{ padding: 32, color: "var(--muted)" }}>Loading...</div>;

  if (!profile) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Creator not found</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      {/* Profile header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--border)", flexShrink: 0 }}>
          {profile.avatar
            ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--accent)", fontSize: 28 }}>
                {profile.name?.[0]?.toUpperCase() ?? "?"}
              </div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{profile.name}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            <strong style={{ color: "var(--text2)" }}>{profile.images_count}</strong> prompts
            {" · "}
            <strong style={{ color: "var(--text2)" }}>{profile.followers}</strong> followers
            {" · "}
            <strong style={{ color: "var(--text2)" }}>{profile.following}</strong> following
          </p>
        </div>
        <button
          onClick={toggleFollow}
          disabled={followBusy}
          className={profile.is_following ? "btn-ghost" : "btn-primary"}
          style={{ padding: "9px 20px" }}
        >
          {profile.is_following
            ? <><UserCheck style={{ width: 15, height: 15 }} /> Following</>
            : <><UserPlus style={{ width: 15, height: 15 }} /> Follow</>
          }
        </button>
      </div>

      {/* Images */}
      {images.length === 0
        ? <p style={{ color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>No prompts uploaded yet</p>
        : <Masonry breakpointCols={breakpoints} className="masonry-grid" columnClassName="masonry-col">
            {images.map(img => <ImageCard key={img.id} image={img} />)}
          </Masonry>
      }
    </div>
  );
}
