"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Upload, MessageCircle, Bell, User, Settings, Bot, Flame, Compass, Bookmark } from "lucide-react";
import { useState } from "react";
import ChatBot from "@/components/ui/ChatBot";
import DMPanel from "@/components/ui/DMPanel";

const NAV = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Compass, label: "Explore", href: "/search" },
  { icon: Flame, label: "Trending", href: "/?tab=trending" },
  { icon: Upload, label: "Upload", href: "/upload" },
  { icon: Bookmark, label: "Saved", href: "/saved" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: User, label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const path = usePathname();
  const [openPanel, setOpenPanel] = useState<"chat" | "dm" | null>(null);
  const toggle = (panel: "chat" | "dm") => setOpenPanel(prev => prev === panel ? null : panel);

  return (
    <>
      <aside style={{
        position: "fixed", left: 0, top: 60, bottom: 0, width: 68,
        background: "#141414", borderRight: "1px solid #2a2a2a",
        display: "flex", flexDirection: "column",
        alignItems: "center", padding: "12px 0", gap: 2, zIndex: 40,
      }}>
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} title={label} style={{
              width: 46, height: 46, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: active ? "#f59e0b" : "#505040",
              background: active ? "rgba(245,158,11,0.1)" : "transparent",
              transition: "all 0.15s", textDecoration: "none",
              border: active ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#202020"; (e.currentTarget as HTMLElement).style.color = "#f5f5f0"; }}}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#505040"; }}}>
              <Icon style={{ width: 20, height: 20 }} />
            </Link>
          );
        })}

        <div style={{ width: 28, height: 1, background: "#2a2a2a", margin: "8px 0" }} />

        {[
          { id: "chat" as const, Icon: Bot, label: "AI Assistant" },
          { id: "dm" as const, Icon: MessageCircle, label: "Messages" },
        ].map(({ id, Icon, label }) => (
          <button key={id} title={label} onClick={() => toggle(id)} style={{
            width: 46, height: 46, borderRadius: 10,
            border: openPanel === id ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: openPanel === id ? "#f59e0b" : "#505040",
            background: openPanel === id ? "rgba(245,158,11,0.1)" : "transparent",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { if (openPanel !== id) { (e.currentTarget as HTMLElement).style.background = "#202020"; (e.currentTarget as HTMLElement).style.color = "#f5f5f0"; }}}
          onMouseLeave={e => { if (openPanel !== id) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#505040"; }}}>
            <Icon style={{ width: 20, height: 20 }} />
          </button>
        ))}

        <div style={{ marginTop: "auto" }}>
          <Link href="/settings" title="Settings" style={{
            width: 46, height: 46, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#505040", textDecoration: "none", transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f5f5f0"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#505040"; }}>
            <Settings style={{ width: 18, height: 18 }} />
          </Link>
        </div>
      </aside>

      {openPanel === "chat" && <ChatBot onClose={() => setOpenPanel(null)} />}
      {openPanel === "dm" && <DMPanel onClose={() => setOpenPanel(null)} />}
    </>
  );
}
