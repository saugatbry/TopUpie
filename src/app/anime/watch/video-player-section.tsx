"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAnimeStore } from "@/store/anime-store";

import { IWatchedAnime } from "@/types/watched-anime";
import { useGetEpisodeData } from "@/query/get-episode-data";
import { useGetEpisodeServers } from "@/query/get-episode-servers";
import { useGetAllEpisodes } from "@/query/get-all-episodes";
import { getFallbackServer } from "@/utils/fallback-server";
import { Captions, Mic, StepForward } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const MEGAPLAY_BASE = "https://megaplay.buzz";

function buildMegaPlayUrl(episodeId: string, language: string): string {
  const malMatch = /^([0-9]+)-([0-9]+)$/.exec(episodeId);
  if (malMatch) {
    return `${MEGAPLAY_BASE}/stream/mal/${malMatch[1]}/${malMatch[2]}/${language}`;
  }
  return `${MEGAPLAY_BASE}/stream/s-2/${encodeURIComponent(episodeId)}/${language}`;
}

const VideoPlayerSection = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const episodeId = searchParams.get("episode");
  const { selectedEpisode, anime } = useAnimeStore();
  const animeId = anime?.anime?.info?.id;

  const { data: serversData } = useGetEpisodeServers(selectedEpisode);
  const { data: episodesData } = useGetAllEpisodes(animeId ?? "");

  const currentEpIndex = useMemo(() => {
    if (!episodesData?.episodes) return -1;
    return episodesData.episodes.findIndex(
      (ep) => ep.episodeId === (episodeId || selectedEpisode),
    );
  }, [episodesData, episodeId, selectedEpisode]);

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

  const [serverName, setServerName] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [watchedDetails, setWatchedDetails] = useState<Array<IWatchedAnime>>(
    [],
  );

  useEffect(() => {
    const { serverName, key } = getFallbackServer(serversData);
    setServerName(serverName);
    setKey(key);
  }, [serversData]);

  // useEffect(() => {
  //   const storedSkip = localStorage.getItem("autoSkip");
  //   if (!auth && storedSkip !== null) setAutoSkip(Boolean(storedSkip));
  //
  //   try {
  //     const stored = localStorage.getItem("watched");
  //     setWatchedDetails(JSON.parse(stored as string) || []);
  //   } catch {
  //     localStorage.removeItem("watched");
  //   }
  // }, []);

  const { data: episodeData } = useGetEpisodeData(
    selectedEpisode,
    serverName,
    key,
  );

  // function changeServer(serverName: string, key: string) {
  //   setServerName(serverName);
  //   setKey(key);
  //   const preference = { serverName, key };
  //   localStorage.setItem("serverPreference", JSON.stringify(preference));
  // }
  //
  // async function onHandleAutoSkipChange(value: boolean) {
  //   setAutoSkip(value);
  //   if (!auth) {
  //     localStorage.setItem("autoSkip", JSON.stringify(value));
  //     return;
  //   }
  //   const res = await pb.collection("users").update(auth.id, {
  //     autoSkip: value,
  //   });
  //   if (res) {
  //     setAuth({ ...auth, autoSkip: value });
  //   }
  // }
  const hasDub = !!(serversData?.dub ?? []).length;
  const isUsingSub = !preferDub || !hasDub;

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

  // /**
  // Temporary fallback player for now
  // **/
  const activeEpisodeId = episodeId || selectedEpisode;

  return (
    activeEpisodeId &&
    serversData && (
      <>
        <div
          className={
            "relative w-full h-auto aspect-video min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] max-h-[500px] lg:max-h-[calc(100vh-150px)] bg-black overflow-hidden p-4"
          }
        >
          <iframe
            src={
              buildMegaPlayUrl(activeEpisodeId, isUsingSub ? "sub" : "dub") +
              "?autoplay=1"
            }
            width="100%"
            height="100%"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms"
          ></iframe>
        </div>
        <div className="flex space-x-3 p-2 bg-[#0f172a] items-center flex-wrap gap-y-2">
          <p>Sub/Dub: </p>
          {!!(serversData.sub ?? []).length && (
            <Button
              className={`${isUsingSub && "bg-red-500 hover:bg-red-600"}`}
              size="icon"
              onClick={() => {
                localStorage.setItem("preferDub", "false");
                setPreferDub(false);
              }}
            >
              <Captions className={`${isUsingSub && "text-white"}`} />
            </Button>
          )}

          {hasDub && (
            <Button
              className={`${preferDub && "bg-green-500 hover:bg-green-600"}`}
              size="icon"
              onClick={() => {
                localStorage.setItem("preferDub", "true");
                setPreferDub(true);
              }}
            >
              <Mic className={`${preferDub && "text-white"}`} />
            </Button>
          )}

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
      </>
    )
  );

  // if (
  //   !selectedEpisode ||
  //   !anime?.anime ||
  //   isLoadingServers ||
  //   isLoading ||
  //   !serversData ||
  //   !episodeData
  // )
  //   return (
  //     <div className="h-auto aspect-video lg:max-h-[calc(100vh-150px)] min-h-[20vh] sm:min-h-[30vh] md:min-h-[40vh] lg:min-h-[60vh] w-full animate-pulse bg-slate-700 rounded-md"></div>
  //   );
  //
  // return (
  //   <div>
  //     <KitsunePlayer
  //       key={episodeData.sources?.[0].url}
  //       episodeInfo={episodeData}
  //       serversData={serversData}
  //       animeInfo={{
  //         id: anime.anime.info.id,
  //         title: anime.anime.info.name,
  //         image: anime.anime.info.poster,
  //       }}
  //       subOrDub={key as "sub" | "dub"}
  //       autoSkip={autoSkip}
  //     />
  //     <div className="flex flex-row bg-[#0f172a]  items-start justify-between w-full p-5">
  //       <div>
  //         <div className="flex flex-row items-center space-x-5">
  //           <Captions className="text-red-300" />
  //           <p className="font-bold text-sm">SUB</p>
  //           {(serversData.sub ?? []).map((s, i) => (
  //             <Button
  //               size="sm"
  //               key={i}
  //               className={`uppercase font-bold ${serverName === s.serverName && key === "sub" && "bg-red-300"}`}
  //               onClick={() => changeServer(s.serverName, "sub")}
  //             >
  //               {s.serverName}
  //             </Button>
  //           ))}
  //         </div>
  //         {!!(serversData.dub ?? []).length && (
  //           <div className="flex flex-row items-center space-x-5 mt-2">
  //             <Mic className="text-green-300" />
  //             <p className="font-bold text-sm">DUB</p>
  //             {(serversData.dub ?? []).map((s, i) => (
  //               <Button
  //                 size="sm"
  //                 key={i}
  //                 className={`uppercase font-bold ${serverName === s.serverName && key === "dub" && "bg-green-300"}`}
  //                 onClick={() => changeServer(s.serverName, "dub")}
  //               >
  //                 {s.serverName}
  //               </Button>
  //             ))}
  //           </div>
  //         )}
  //       </div>
  //       <div className="flex flex-row items-center space-x-2 text-sm">
  //         <Switch
  //           checked={autoSkip}
  //           onCheckedChange={(e) => onHandleAutoSkipChange(e)}
  //           id="auto-skip"
  //         />
  //         <p>Auto Skip</p>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default VideoPlayerSection;
