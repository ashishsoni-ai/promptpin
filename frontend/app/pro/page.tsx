"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Zap, Check, Sparkles, Crown, Loader2 } from "lucide-react";

const FREE_FEATURES = [
  "Browse unlimited images",
  "3 prompt copies per day",
  "Upload your own prompts",
  "Save to collections",
];

const PRO_FEATURES = [
  "Unlimited prompt copies",
  "Access premium prompts",
  "Unlimited AI enhance & remix",
  "Pro badge on your profile",
  "Priority in search ranking",
  "Early access to new features",
];

function ProPageContent() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const status = params.get("status");
    if (status === "success") toast.success("Welcome to Pro! It may take a few seconds to activate.");
    if (status === "cancelled") toast.info("Checkout cancelled");
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const s = await api.getBillingStatus(session.access_token);
          setIsPro(s.is_pro);
        } catch { /* not configured yet */ }
      }
      setChecked(true);
    })();
  }, [params]);

  const upgrade = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Sign in first");
      return supabase.auth.signInWithOAuth({ provider: "google" });
    }
    setBusy(true);
    try {
      const res = await api.createCheckout(session.access_token);
      window.location.href = res.url;
    } catch (e: any) { toast.error(e.message); setBusy(false); }
  };

  const manage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setBusy(true);
    try {
      const res = await api.openBillingPortal(session.access_token);
      window.location.href = res.url;
    } catch (e: any) { toast.error(e.message); setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 16 }}>
          <Crown style={{ width: 14, height: 14, color: "var(--accent)" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>PromptPin Pro</span>
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.5px" }}>
          Unlock every prompt
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
          Copy without limits, access premium prompts, and use AI tools as much as you want.
        </p>
      </div>

      {/* Plans */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {/* Free */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Free</h2>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: "var(--text)" }}>$0</span>
            <span style={{ color: "var(--muted)", fontSize: 14 }}> / forever</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text2)" }}>
                <Check style={{ width: 15, height: 15, color: "var(--muted)", flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Pro */}
        <div style={{ background: "var(--surface)", border: "1.5px solid var(--accent)", borderRadius: 20, padding: 28, position: "relative", boxShadow: "var(--glow-gold)" }}>
          <div style={{ position: "absolute", top: -12, right: 20, background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 999, padding: "3px 12px", fontSize: 11, fontWeight: 800, color: "#0d0d0d" }}>
            MOST POPULAR
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap style={{ width: 16, height: 16 }} /> Pro
          </h2>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: "var(--text)" }}>$6</span>
            <span style={{ color: "var(--muted)", fontSize: 14 }}> / month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {PRO_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text)" }}>
                <Check style={{ width: 15, height: 15, color: "var(--accent)", flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>
          {checked && isPro ? (
            <button onClick={manage} disabled={busy} className="btn-ghost" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
              {busy ? <Loader2 style={{ width: 15, height: 15, animation: "spin 0.8s linear infinite" }} /> : "Manage subscription"}
            </button>
          ) : (
            <button onClick={upgrade} disabled={busy} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15 }}>
              {busy
                ? <Loader2 style={{ width: 15, height: 15, animation: "spin 0.8s linear infinite" }} />
                : <><Sparkles style={{ width: 15, height: 15 }} /> Upgrade to Pro</>
              }
            </button>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>

      {/* Trust line */}
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 28 }}>
        Cancel anytime from the customer portal. Payments secured by Stripe.
      </p>
    </div>
  );
}

export default function ProPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Loading...</div>}>
      <ProPageContent />
    </Suspense>
  );
}
