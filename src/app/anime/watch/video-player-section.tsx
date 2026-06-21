"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAnimeStore } from "@/store/anime-store";
import { IWatchedAnime } from "@/types/watched-anime";
import { useGetAllEpisodes } from "@/query/get-all-episodes";
import { Captions, ExternalLink, Mic, StepForward } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const PROXY_BASE = "/api/proxy";

const VideoPlayerSection = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const episodeId = searchParams.get("episode");
  const animeParam = searchParams.get("anime");
  const { selectedEpisode, anime } = useAnimeStore();
  const animeId = anime?.anime?.info?.id || animeParam || "";
  const activeEpisode = episodeId || selectedEpisode;

  const { data: episodesData } = useGetAllEpisodes(animeId);

  const [directUrl, setDirectUrl] = useState<string>("");
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [loadingStream, setLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>("");

  const currentEpIndex = useMemo(() => {
    if (!episodesData?.episodes) return -1;
    return episodesData.episodes.findIndex(
      (ep) => ep.episodeId === activeEpisode,
    );
  }, [episodesData, activeEpisode]);

  const currentEpisode = useMemo(() => {
    if (currentEpIndex < 0 || !episodesData?.episodes) return null;
    return episodesData.episodes[currentEpIndex];
  }, [currentEpIndex, episodesData]);

  const nextEpisode = useMemo(() => {
    if (currentEpIndex < 0 || !episodesData?.episodes) return null;
    return episodesData.episodes[currentEpIndex + 1] || null;
  }, [currentEpIndex, episodesData]);

  const [preferDub, setPreferDub] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("preferDub") === "true";
    }
    return true;
  });

  const [watchedDetails, setWatchedDetails] = useState<Array<IWatchedAnime>>(
    [],
  );

  const hasDub = (episodesData?.dubCount ?? 0) > 0;
  const playbackType = preferDub && hasDub ? "dub" : "sub";
  const serverIds = currentEpisode?.embed_id;

  const resolveStream = useCallback(async (svId: string) => {
    if (!svId) {
      setStreamError("No stream data available");
      setStreamUrl("");
      setDirectUrl("");
      return;
    }

    setLoadingStream(true);
    setStreamError("");
    setStreamUrl("");
    setDirectUrl("");

    try {
      const serverRes = await api.get(
        `${PROXY_BASE}/servers?ids=${encodeURIComponent(svId)}`,
      );
      const raw = serverRes.data?.results || serverRes.data || serverRes;
      const list = Array.isArray(raw) ? raw : (raw?.data || []);
      setServers(list);

      const targetType = playbackType;
      const match = list.find((s: any) => s.type === targetType)
        || list[0];

      if (!match?.link_id) {
        setStreamError("No stream link found for any server");
        return;
      }

      setSelectedServer(match.name || svId);
      const streamRes = await api.get(
        `${PROXY_BASE}/stream?id=${encodeURIComponent(match.link_id)}`,
      );
      const streamData = streamRes.data?.results || streamRes.data || streamRes;
      const url = streamData?.url;
      if (url) {
        setDirectUrl(url);
        setStreamUrl(`/api/stream-proxy?id=${encodeURIComponent(match.link_id)}`);
      } else {
        setStreamError("Stream URL unavailable");
      }
    } catch {
      setStreamError("Failed to load stream");
    } finally {
      setLoadingStream(false);
    }
  }, [playbackType]);

  useEffect(() => {
    resolveStream(serverIds || "");
  }, [serverIds, resolveStream]);

  const switchServer = (name: string) => {
    const sv = servers.find((s) => s.name === name && s.type === playbackType)
      || servers.find((s) => s.name === name);
    if (sv?.link_id) {
      setLoadingStream(true);
      setStreamError("");
      setStreamUrl("");
      setDirectUrl("");
      setSelectedServer(name);
      api.get(`${PROXY_BASE}/stream?id=${encodeURIComponent(sv.link_id)}`)
        .then((res) => {
          const data = res.data?.results || res.data || res;
          if (data?.url) {
            setDirectUrl(data.url);
            setStreamUrl(`/api/stream-proxy?id=${encodeURIComponent(sv.link_id)}`);
          } else setStreamError("Stream URL unavailable");
        })
        .catch(() => setStreamError("Failed to load stream"))
        .finally(() => setLoadingStream(false));
    }
  };

  useEffect(() => {
    if (!Array.isArray(watchedDetails)) {
      localStorage.removeItem("watched");
      return;
    }

    const animeIdStore = anime?.anime?.info?.id;
    const animeName = anime?.anime?.info?.name;
    const animePoster = anime?.anime?.info?.poster;

    if (!animeIdStore || !activeEpisode) return;

    const existingAnime = watchedDetails.find(
      (watchedAnime) => watchedAnime.anime.id === animeIdStore,
    );

    if (!existingAnime) {
      const updatedWatchedDetails = [
        ...watchedDetails,
        {
          anime: {
            id: animeIdStore,
            title: animeName ?? "",
            poster: animePoster ?? "",
          },
          episodes: [activeEpisode],
        },
      ];
      localStorage.setItem("watched", JSON.stringify(updatedWatchedDetails));
      setWatchedDetails(updatedWatchedDetails);
    } else {
      const episodeAlreadyWatched =
        existingAnime.episodes.includes(activeEpisode);

      if (!episodeAlreadyWatched) {
        const updatedWatchedDetails = watchedDetails.map((watchedAnime) =>
          watchedAnime.anime.id === animeIdStore
            ? {
                ...watchedAnime,
                episodes: [...watchedAnime.episodes, activeEpisode],
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
  }, [streamUrl, activeEpisode, anime, watchedDetails]);

  const handleNextEpisode = () => {
    if (!nextEpisode) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("episode", nextEpisode.episodeId);
    router.push(`/anime/watch?${params.toString()}`);
  };

  const isStreamReady = streamUrl && !loadingStream && !streamError;
  const uniqueServers = [...new Set(servers.map((s) => s.name))];

  return (
    activeEpisode && (
      <>
        <div
          className={
            "relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden p-4"
          }
        >
          {isStreamReady ? (
            <iframe
              src={streamUrl}
              width="100%"
              height="100%"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {loadingStream ? (
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
                  <p>Loading player...</p>
                </div>
              ) : (
                <div className="text-center">
                  <p>{streamError || "Player unavailable"}</p>
                  {directUrl && (
                    <a
                      href={directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#e9376b] hover:underline mt-2 inline-block"
                    >
                      Open in new tab &rarr;
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {uniqueServers.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-[#0f172a] flex-wrap">
            <span className="text-xs text-gray-400">Server:</span>
            {uniqueServers.map((name) => (
              <button
                key={name}
                onClick={() => switchServer(name)}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  selectedServer === name
                    ? "bg-[#e9376b] text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="flex space-x-3 p-2 bg-[#0f172a] items-center flex-wrap gap-y-2">
          <p className="text-sm">Audio: </p>
          {!hasDub && (
            <Button
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-xs uppercase font-bold"
              disabled
            >
              <Captions className="mr-1 h-4 w-4" />
              Sub Only
            </Button>
          )}
          {hasDub && (
            <>
              <Button
                size="sm"
                className={`text-xs uppercase font-bold ${
                  !preferDub
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                onClick={() => {
                  localStorage.setItem("preferDub", "false");
                  setPreferDub(false);
                }}
              >
                <Captions className="mr-1 h-4 w-4" />
                Sub
              </Button>
              <Button
                size="sm"
                className={`text-xs uppercase font-bold ${
                  preferDub
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                onClick={() => {
                  localStorage.setItem("preferDub", "true");
                  setPreferDub(true);
                }}
              >
                <Mic className="mr-1 h-4 w-4" />
                Dub
              </Button>
            </>
          )}

          <div className="flex-1" />

          {directUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs rounded bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Open
            </a>
          )}

          {nextEpisode && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleNextEpisode}
            >
              <StepForward className="mr-1 h-4 w-4" />
              Play Next (Ep {nextEpisode.number})
            </Button>
          )}
        </div>
      </>
    )
  );
};

export default VideoPlayerSection;
