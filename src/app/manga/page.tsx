"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const MangaSearchPage = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/manga/${encodeURIComponent(query.trim().toLowerCase().replace(/\s+/g, "-"))}`);
    }
  };

  const popularManga = [
    "one-piece", "naruto", "attack-on-titan", "jujutsu-kaisen",
    "demon-slayer", "my-hero-academia", "chainsaw-man", "solo-leveling",
    "berserk", "vagabond", "vinland-saga", "blue-lock",
    "haikyuu", "one-punch-man", "mob-psycho-100", "tokyo-revengers",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Manga</h1>
        <p className="text-gray-400">Search and read manga online</p>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
        <Input
          placeholder="Enter manga name (e.g. one-piece)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <Search className="h-4 w-4 mr-1" />
          Search
        </Button>
      </form>
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 text-center">Popular Manga</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {popularManga.map((slug) => (
            <a
              key={slug}
              href={`/manga/${slug}`}
              className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 text-center capitalize transition-colors"
            >
              {slug.replace(/-/g, " ")}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MangaSearchPage;
