"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ChapterImage {
  page: number;
  url: string;
}

const MangaReaderPage = () => {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "Reading";

  const [images, setImages] = useState<ChapterImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    api
      .get("/api/manga/images", { params: { url } })
      .then((res) => setImages(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [url]);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">No chapter URL provided.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-white/5 p-3 flex items-center justify-between">
        <Link
          href={`/manga/${encodeURIComponent(url.split("/manga/")[1]?.split("/")[0] || "")}`}
          className="text-sm text-gray-400 hover:text-white truncate max-w-[200px]"
        >
          {title}
        </Link>
        {images.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span>
              {page} / {images.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= images.length}
              onClick={() => setPage((p) => Math.min(images.length, p + 1))}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center p-4">
        {loading && (
          <div className="flex items-center gap-2 py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading chapter...
          </div>
        )}
        {!loading && images.length === 0 && (
          <p className="text-gray-400 py-20">No images found for this chapter.</p>
        )}
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img.url}
            alt={`Page ${img.page}`}
            className="w-full max-w-3xl mb-2"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

export default MangaReaderPage;
