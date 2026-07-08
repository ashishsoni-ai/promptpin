import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/ui/Navbar";
import Sidebar from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "PromptPin — Discover AI Image Prompts",
  description: "Browse, copy and share the world's best AI image generation prompts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <div style={{ display: "flex", paddingTop: 60 }}>
          <Sidebar />
          <main style={{ marginLeft: 68, flex: 1, minWidth: 0, minHeight: "100vh" }}>
            {children}
          </main>
        </div>
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  );
}
