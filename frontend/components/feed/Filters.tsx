"use client";
import { useState } from "react";

const STYLES = ["All", "photorealistic", "anime", "digital art", "oil painting", "watercolor", "3d render", "abstract"];
const MODELS = ["All Models", "Midjourney", "Stable Diffusion", "DALL-E 3", "Firefly", "Leonardo", "Flux"];

export default function Filters({ onChange }: { onChange: (f: Record<string, string>) => void }) {
  const [style, setStyle] = useState("All");
  const [model, setModel] = useState("All Models");

  const update = (s: string, m: string) => {
    const f: Record<string, string> = {};
    if (s !== "All") f.style = s;
    if (m !== "All Models") f.model = m;
    onChange(f);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {STYLES.map(s => (
        <button key={s} onClick={() => { setStyle(s); update(s, model); }} style={{
          padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
          cursor: "pointer", transition: "all 0.2s", border: "none", whiteSpace: "nowrap",
          background: style === s ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#1a1a1a",
          color: style === s ? "#0d0d0d" : "#909080",
          boxShadow: style === s ? "0 2px 8px rgba(245,158,11,0.3)" : "none",
        }}>{s}</button>
      ))}
      <select value={model} onChange={e => { setModel(e.target.value); update(style, e.target.value); }}
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 7, padding: "5px 12px", fontSize: 12, color: "#909080", cursor: "pointer", outline: "none" }}>
        {MODELS.map(m => <option key={m}>{m}</option>)}
      </select>
    </div>
  );
}
