"use client";

import Container from "@/components/container";
import { proxyMappingService as mappingService } from "@/services/client-proxy";
import { useState } from "react";
import Link from "next/link";

export default function ResolvePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResolve = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const num = parseInt(trimmed, 10);
      if (isNaN(num)) {
        setError("Please enter a numeric MAL or AniList ID.");
        return;
      }

      const [malRes, aniRes] = await Promise.all([
        mappingService.malToAniList(num).catch(() => null),
        mappingService.aniListToMal(num).catch(() => null),
      ]);

      if ((malRes as any)?.data) {
        setResult({ type: "mal", id: num, mapped: (malRes as any).data });
      } else if ((aniRes as any)?.data) {
        setResult({ type: "anilist", id: num, mapped: (aniRes as any).data });
      } else {
        setError("No mapping found for this ID.");
      }
    } catch {
      setError("Failed to resolve ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-10 max-w-lg">
      <h1 className="text-3xl font-bold mb-2">ID Resolver</h1>
      <p className="text-gray-400 mb-6">
        Convert between MAL and AniList anime IDs.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter MAL or AniList ID..."
          className="flex-1 rounded-lg bg-secondary border border-slate-700 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#e9376b]"
          onKeyDown={(e) => e.key === "Enter" && handleResolve()}
        />
        <button
          onClick={handleResolve}
          disabled={loading}
          className="px-5 py-2 bg-[#e9376b] text-white rounded-lg font-medium hover:bg-[#d62d5d] disabled:opacity-50 transition-colors"
        >
          {loading ? "Resolving..." : "Resolve"}
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {result && (
        <div className="rounded-xl bg-secondary p-5 space-y-3">
          <p className="text-sm text-gray-400">
            Source: <span className="font-medium text-white">{result.type.toUpperCase()}</span> ID{" "}
            <span className="font-medium text-white">{result.id}</span>
          </p>
          {result.mapped.anime?.slug || result.mapped.slug ? (
            <Link
              href={`/anime/${result.mapped.anime?.slug || result.mapped.slug}`}
              className="text-[#e9376b] hover:underline"
            >
              View Anime Page &rarr;
            </Link>
          ) : null}
          <pre className="text-xs text-gray-400 overflow-auto max-h-60">
            {JSON.stringify(result.mapped, null, 2)}
          </pre>
        </div>
      )}
    </Container>
  );
}
