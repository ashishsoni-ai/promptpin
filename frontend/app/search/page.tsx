"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { api } from "@/lib/api";
import ImageCard from "@/components/feed/ImageCard";
import Masonry from "react-masonry-css";

const breakpoints = { default: 4, 1280: 3, 768: 2, 640: 1 };

function SearchPageContent() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.search(q).then(setResults).finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4 text-zinc-100">
        Results for "<span className="text-amber-500">{q}</span>"
      </h1>
      {loading ? (
        <p className="text-zinc-400">Searching...</p>
      ) : (
        <Masonry breakpointCols={breakpoints} className="masonry-grid" columnClassName="masonry-grid-column">
          {results.map((img) => <ImageCard key={img.id} image={img} />)}
        </Masonry>
      )}
      {!loading && results.length === 0 && (
        <p className="text-zinc-500 text-center mt-20">No results found.</p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
