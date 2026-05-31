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
import { api } from "@/lib/api";

const ANIVERSE_STREAM_API = "https://aniverseapi.vercel.app/api/stream";

type LangTab = "sub" | "dub" | "hindi";

interface StreamServer {
  server: string;
  embed: string;
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

  const [serverName, setServerName] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [watchedDetails, setWatchedDetails] = useState<Array<IWatchedAnime>>(
    [],
  );

  const [langTab, setLangTab] = useState<LangTab>("sub");
  const [streamServers, setStreamServers] = useState<StreamServer[]>([]);
  const [selectedEmbed, setSelectedEmbed] = useState<string>("");
  const [streamLoading, setStreamLoading] = useState(false);

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

  // Fetch stream servers from Aniverse API
  useEffect(() => {
    if (!animeTitle || !activeEpisode) return;

    const slug = slugify(animeTitle);
    const epNum = parseEpisodeNumber(activeEpisode);

    setStreamLoading(true);
    api
      .get(ANIVERSE_STREAM_API, {
        params: { id: slug, season: 1, ep: epNum },
      })
      .then((res) => {
        const servers: StreamServer[] = res.data?.results || [];
        setStreamServers(servers);
        if (servers.length > 0) {
          setSelectedEmbed(servers[0].embed);
        }
      })
      .catch(() => {
        setStreamServers([]);
        setSelectedEmbed("");
      })
      .finally(() => setStreamLoading(false));
  }, [animeTitle, activeEpisode]);

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

  const langTabs: { key: LangTab; label: string; icon: React.ReactNode }[] = [
    { key: "sub", label: "Sub", icon: <Captions className="h-4 w-4" /> },
    { key: "dub", label: "Dub", icon: <Mic className="h-4 w-4" /> },
    { key: "hindi", label: "Hindi Dub", icon: <Languages className="h-4 w-4" /> },
  ];

  return (
    activeEpisodeId &&
    serversData && (
      <>
        <div
          className={
            "relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden p-4"
          }
        >
          {selectedEmbed ? (
            <iframe
              src={selectedEmbed + (selectedEmbed.includes("?") ? "&" : "?") + "autoplay=1"}
              width="100%"
              height="100%"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms"
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {streamLoading ? "Loading player..." : "No player available"}
            </div>
          )}
        </div>
        <div className="flex flex-col p-2 bg-[#0f172a] gap-2">
          {/* Language Tabs */}
          <div className="flex space-x-2 items-center flex-wrap">
            <p className="text-sm text-gray-400">Language:</p>
            {langTabs.map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={langTab === tab.key ? "default" : "outline"}
                className={`flex items-center gap-1 ${langTab === tab.key ? (tab.key === "hindi" ? "bg-purple-600 hover:bg-purple-700" : tab.key === "sub" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600") : ""}`}
                onClick={() => setLangTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>
          {/* Server Options */}
          {streamServers.length > 0 && (
            <div className="flex space-x-2 items-center flex-wrap">
              <p className="text-sm text-gray-400">Servers:</p>
              {streamServers.map((s) => (
                <Button
                  key={s.server}
                  size="sm"
                  variant={selectedEmbed === s.embed ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setSelectedEmbed(s.embed)}
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
