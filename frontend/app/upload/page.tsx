"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, Sparkles, ImagePlus, CheckCircle2, ArrowRight } from "lucide-react";

const STYLES = ["photorealistic", "anime", "digital art", "oil painting", "watercolor", "3d render", "sketch", "abstract"];
const MODELS = ["Flux", "Stable Diffusion", "Midjourney", "DALL-E 3", "Firefly", "Leonardo"];

// Simple client-side PNG generator parameters reader
function extractPNGMetadata(file: File): Promise<{ prompt?: string; model?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) return resolve({});
      const view = new DataView(buffer);
      
      // Check PNG signature
      if (view.byteLength < 8 || view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
        return resolve({});
      }
      
      let offset = 8;
      const textDecoder = new TextDecoder("utf-8");
      
      while (offset < view.byteLength) {
        if (offset + 8 > view.byteLength) break;
        const length = view.getUint32(offset);
        const type = textDecoder.decode(new Uint8Array(buffer, offset + 4, 4));
        
        if (type === "tEXt" || type === "iTXt") {
          const dataArray = new Uint8Array(buffer, offset + 8, length);
          const dataStr = textDecoder.decode(dataArray);
          // Automatic1111/ComfyUI parameters keyword
          if (dataStr.includes("parameters\0")) {
            const rawParams = dataStr.split("parameters\0")[1] || "";
            // The prompt is everything up to the first negative prompt or settings line
            const lines = rawParams.split("\n");
            let prompt = lines[0] || "";
            let model = "Stable Diffusion";
            
            // Clean up prompt
            if (prompt.length > 250) {
              prompt = prompt.substring(0, 250) + "...";
            }
            return resolve({ prompt: prompt.trim(), model });
          }
        }
        offset += 12 + length;
      }
      resolve({});
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [model, setModel] = useState(MODELS[0]);
  const [tags, setTags] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleFile = async (f: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) return toast.error("Only JPG, PNG or WEBP images are allowed");
    if (f.size > 10 * 1024 * 1024) return toast.error("Image must be under 10MB");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    
    // Attempt metadata extraction
    try {
      const meta = await extractPNGMetadata(f);
      if (meta.prompt) {
        setPrompt(meta.prompt);
        if (meta.model) setModel(meta.model);
        toast.success("AI prompt extracted from image metadata! ✨");
      }
    } catch (err) {
      console.warn("Failed to extract png metadata", err);
    }
  };

  const enhance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error("Login to use AI enhance");
    setEnhancing(true);
    try {
      const res = await api.enhancePrompt(prompt, style, session.access_token);
      setPrompt(res.enhanced);
      toast.success("Prompt enhanced!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEnhancing(false);
    }
  };

  const submit = async () => {
    if (!file || !prompt) return toast.error("Image and prompt required");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return toast.error("Please login first");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("prompt", prompt);
    form.append("style", style);
    form.append("model", model);
    form.append("tags", JSON.stringify(tags.split(",").map(t => t.trim()).filter(Boolean)));
    try {
      await api.uploadImage(form, session.access_token);
      toast.success("Uploaded successfully!");
      router.push("/");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto px-6 py-10 pb-24">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">Upload prompt</h1>
        <p className="text-zinc-400 text-sm mt-1">Publish your AI generation parameters so others can recreate and learn.</p>
      </div>

      <div className="space-y-6">
        {/* Drop Zone */}
        <div
          onClick={() => document.getElementById("file-input")?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => e.preventDefault()}
          className={`relative border-2 border-dashed rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${
            preview 
              ? "border-amber-500/50 bg-zinc-950/20" 
              : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-950/60"
          }`}
        >
          {preview ? (
            <div className="relative group">
              <img src={preview} alt="Upload preview" className="w-full max-h-[350px] object-cover block" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-xs font-bold text-white bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">Replace Image</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500">
                <ImagePlus className="w-6 h-6" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-zinc-200">Drag & drop your AI image here</p>
                <p className="text-xs text-zinc-500 mt-1">Supports PNG, JPG, WEBP up to 10MB</p>
                <p className="text-[10px] text-amber-500/80 font-bold tracking-wider mt-3 uppercase">💡 Tip: dropping SD images auto-extracts parameters</p>
              </div>
            </div>
          )}
          <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm font-bold text-zinc-200 mb-2">Prompt *</label>
          <textarea
            value={prompt} onChange={e => setPrompt(e.target.value)}
            rows={4} placeholder="Describe your image in detail..."
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl text-zinc-100 text-sm p-4 outline-none resize-none focus:border-amber-500/60 transition-colors placeholder:text-zinc-600"
          />
          <button onClick={enhance} disabled={enhancing || !prompt}
            className="mt-2 flex items-center gap-1.5 text-[13px] font-bold text-amber-500 disabled:opacity-40 hover:text-amber-400 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            {enhancing ? "Enhancing..." : "AI Enhance Prompt"}
          </button>
        </div>

        {/* Style + Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-zinc-200 mb-2">Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl text-zinc-100 text-sm px-4 py-3 outline-none focus:border-amber-500/60 transition-colors">
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-200 mb-2">Model</label>
            <select value={model} onChange={e => setModel(e.target.value)}
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl text-zinc-100 text-sm px-4 py-3 outline-none focus:border-amber-500/60 transition-colors">
              {MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-bold text-zinc-200 mb-2">Tags <span className="text-zinc-500 font-normal">(comma separated)</span></label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="cyberpunk, city, neon, night"
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl text-zinc-100 text-sm px-4 py-3 outline-none focus:border-amber-500/60 transition-colors placeholder:text-zinc-600" />
        </div>

        {/* Submit */}
        <button onClick={submit} disabled={uploading || !file || !prompt}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-950 font-extrabold text-[15px] rounded-2xl py-4 disabled:opacity-40 hover:opacity-90 transition-opacity">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Share Prompt"}
        </button>
      </div>
    </div>
  );
}
