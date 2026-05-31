"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAnimeStore } from "@/store/anime-store";

import { IWatchedAnime } from "@/types/watched-anime";
import { useGetEpisodeData } from "@/query/get-episode-data";
import { useGetEpisodeServers } from "@/query/get-episode-servers";
import { useGetAllEpisodes } from "@/query/get-all-episodes";
import { getFallbackServer } from "@/utils/fallback-server";
import { Captions, Mic, StepForward, Languages } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const MEGAPLAY_BASE = "https://megaplay.buzz";
const ANIVERSE_STREAM_API = "https://aniverseapi.vercel.app/api/stream";

function buildMegaPlayUrl(episodeId: string, language: string): string {
  const malMatch = /^([0-9]+)-([0-9]+)$/.exec(episodeId);
  if (malMatch) {
    return `${MEGAPLAY_BASE}/stream/mal/${malMatch[1]}/${malMatch[2]}/${language}`;
  }
  return `${MEGAPLAY_BASE}/stream/s-2/${encodeURIComponent(episodeId)}/${language}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseEpisodeNumber(episodeId: string): number {
  const parts = episodeId.split("-");
  const last = parts[parts.length - 1];
  const num = parseInt(last, 10);
  return isNaN(num) ? 1 : num;
}

const VideoPlayerSection = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const episodeId = searchParams.get("episode");
  const { selectedEpisode, anime } = useAnimeStore();
  const animeId = anime?.anime?.info?.id;
  const animeTitle = anime?.anime?.info?.name;

  const activeEpisode = episodeId || selectedEpisode;

  const { data: serversData } = useGetEpisodeServers(activeEpisode);
  const { data: episodesData } = useGetAllEpisodes(animeId ?? "");

  const currentEpIndex = useMemo(() => {
    if (!episodesData?.episodes) return -1;
    return episodesData.episodes.findIndex(
      (ep) => ep.episodeId === activeEpisode,
    );
  }, [episodesData, activeEpisode]);

  const nextEpisode = useMemo(() => {
    if (currentEpIndex < 0 || !episodesData?.episodes) return null;
    return episodesData.episodes[currentEpIndex + 1] || null;
  }, [currentEpIndex, episodesData]);

  const [preferDub, setPreferDub] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("preferDub") === "true";
    }
    return false;
  });

  const [serverName, setServerName] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [watchedDetails, setWatchedDetails] = useState<Array<IWatchedAnime>>(
    [],
  );

  // Hindi Dub state
  type Tab = "subdub" | "hindi";
  const [activeTab, setActiveTab] = useState<Tab>("subdub");
  const [hindiServers, setHindiServers] = useState<{ server: string; embed: string }[]>([]);
  const [selectedHindiEmbed, setSelectedHindiEmbed] = useState("");
  const [hindiAvailable, setHindiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const { serverName, key } = getFallbackServer(serversData);
    setServerName(serverName);
    setKey(key);
  }, [serversData]);

  const { data: episodeData } = useGetEpisodeData(
    selectedEpisode,
    serverName,
    key,
  );

  const hasDub = !!(serversData?.dub ?? []).length;
  const isUsingSub = !preferDub || !hasDub;

  // Fetch Hindi dub servers from Aniverse API when Hindi tab is active
  useEffect(() => {
    if (activeTab !== "hindi" || !animeTitle || !activeEpisode) return;

    const slug = slugify(animeTitle);
    const epNum = parseEpisodeNumber(activeEpisode);

    setHindiAvailable(null);
    setHindiServers([]);
    setSelectedHindiEmbed("");

    const tryFetch = async (season: number): Promise<boolean> => {
      try {
        const res = await fetch(`${ANIVERSE_STREAM_API}?id=${encodeURIComponent(slug)}&season=${season}&ep=${epNum}`);
        const data = await res.json();
        if (data?.results?.length > 0) {
          setHindiServers(data.results);
          setSelectedHindiEmbed(data.results[0].embed);
          setHindiAvailable(true);
          return true;
        }
      } catch {}
      return false;
    };

    tryFetch(1).then((found) => {
      if (!found) setHindiAvailable(false);
    });
  }, [activeTab, animeTitle, activeEpisode]);

  useEffect(() => {
    if (!Array.isArray(watchedDetails)) {
      localStorage.removeItem("watched");
      return;
    }

    const animeId = anime?.anime?.info?.id;
    const animeName = anime?.anime?.info?.name;
    const animePoster = anime?.anime?.info?.poster;

    if (!episodeData || !animeId || !selectedEpisode) return;

    const existingAnime = watchedDetails.find(
      (watchedAnime) => watchedAnime.anime.id === animeId,
    );

    if (!existingAnime) {
      const updatedWatchedDetails = [
        ...watchedDetails,
        {
          anime: {
            id: animeId,
            title: animeName ?? "",
            poster: animePoster ?? "",
          },
          episodes: [selectedEpisode],
        },
      ];
      localStorage.setItem("watched", JSON.stringify(updatedWatchedDetails));
      setWatchedDetails(updatedWatchedDetails);
    } else {
      const episodeAlreadyWatched =
        existingAnime.episodes.includes(selectedEpisode);

      if (!episodeAlreadyWatched) {
        const updatedWatchedDetails = watchedDetails.map((watchedAnime) =>
          watchedAnime.anime.id === animeId
            ? {
                ...watchedAnime,
                episodes: [...watchedAnime.episodes, selectedEpisode],
              }
            : watchedAnime,
        );

        localStorage.setItem(
          "watched",
          JSON.stringify(updatedWatchedDetails),
        );
        setWatchedDetails(updatedWatchedDetails);
      }
    }
    //eslint-disable-next-line
  }, [episodeData, selectedEpisode, anime]);

  const activeEpisodeId = episodeId || selectedEpisode;

  const megaPlaySrc = buildMegaPlayUrl(activeEpisodeId, isUsingSub ? "sub" : "dub") + "?autoplay=1";

  return (
    activeEpisodeId &&
    serversData && (
      <>
        <div
          className={
            "relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden p-4"
          }
        >
          {activeTab === "subdub" ? (
            <iframe
              src={megaPlaySrc}
              width="100%"
              height="100%"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms"
            ></iframe>
          ) : hindiAvailable === null ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Loading Hindi dub servers...
            </div>
          ) : hindiAvailable ? (
            <iframe
              src={selectedHindiEmbed + (selectedHindiEmbed.includes("?") ? "&" : "?") + "autoplay=1"}
              width="100%"
              height="100%"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms"
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Hindi dub not available for this episode
            </div>
          )}
        </div>
        <div className="flex flex-col p-2 bg-[#0f172a] gap-2">
          {/* Language Tabs */}
          <div className="flex space-x-2 items-center flex-wrap">
            <p className="text-sm text-gray-400">Language:</p>
            <Button
              size="sm"
              variant={activeTab === "subdub" && isUsingSub ? "default" : "outline"}
              className={`flex items-center gap-1 ${activeTab === "subdub" && isUsingSub ? "bg-red-500 hover:bg-red-600" : ""}`}
              onClick={() => { setActiveTab("subdub"); setPreferDub(false); localStorage.setItem("preferDub", "false"); }}
            >
              <Captions className="h-4 w-4" />
              Sub
            </Button>
            {hasDub && (
              <Button
                size="sm"
                variant={activeTab === "subdub" && preferDub ? "default" : "outline"}
                className={`flex items-center gap-1 ${activeTab === "subdub" && preferDub ? "bg-green-500 hover:bg-green-600" : ""}`}
                onClick={() => { setActiveTab("subdub"); setPreferDub(true); localStorage.setItem("preferDub", "true"); }}
              >
                <Mic className="h-4 w-4" />
                Dub
              </Button>
            )}
            <Button
              size="sm"
              variant={activeTab === "hindi" ? "default" : "outline"}
              className={`flex items-center gap-1 ${activeTab === "hindi" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
              onClick={() => setActiveTab("hindi")}
            >
              <Languages className="h-4 w-4" />
              Hindi Dub
            </Button>
          </div>
          {/* Hindi server options */}
          {activeTab === "hindi" && hindiServers.length > 0 && (
            <div className="flex space-x-2 items-center flex-wrap">
              <p className="text-sm text-gray-400">Servers:</p>
              {hindiServers.map((s) => (
                <Button
                  key={s.server}
                  size="sm"
                  variant={selectedHindiEmbed === s.embed ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setSelectedHindiEmbed(s.embed)}
                >
                  {s.server.replace("options-", "Server ")}
                </Button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1" />
            {nextEpisode && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("episode", nextEpisode.episodeId);
                  params.delete("type");
                  router.push(`/anime/watch?${params.toString()}`);
                }}
              >
                <StepForward className="mr-1 h-4 w-4" />
                Play Next (Ep {nextEpisode.number})
              </Button>
            )}
          </div>
        </div>
      </>
    )
  );
};

export default VideoPlayerSection;
