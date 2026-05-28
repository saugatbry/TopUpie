import { useState, useEffect } from "react";
import { IWatchedAnime } from "@/types/watched-anime";
import { WatchHistory } from "./use-get-bookmark";

export const useHasAnimeWatched = (
  animeId: string,
  episodeId?: string,
  watchedEpisodes?: WatchHistory[],
) => {
  const [hasWatchedAnime, setHasWatchedAnime] = useState(false);
  const [hasWatchedEpisode, setHasWatchedEpisode] = useState(false);

  useEffect(() => {
    let watchedDetails: Array<IWatchedAnime> = [];
    try {
      const stored = localStorage.getItem("watched");
      if (stored) watchedDetails = JSON.parse(stored);
    } catch {
      localStorage.removeItem("watched");
    }

    if (!Array.isArray(watchedDetails)) {
      localStorage.removeItem("watched");
      return;
    }

    const anime = watchedDetails.find(
      (watchedAnime) => watchedAnime.anime.id === animeId,
    );

    if (anime) {
      setHasWatchedAnime(true); // Anime has been watched
      if (episodeId) {
        const episodeWatched = anime.episodes.includes(episodeId);
        setHasWatchedEpisode(episodeWatched); // Set to true if the episode is watched
      }
    } else {
      setHasWatchedAnime(false); // Anime has not been watched
      setHasWatchedEpisode(false); // Episode has not been watched
    }
  }, [animeId, episodeId]);

  if (watchedEpisodes && watchedEpisodes.length > 0) {
    if (episodeId) {
      const episodeWatched = watchedEpisodes.some(
        (episode) => episode.episodeId === episodeId,
      );
      return { hasWatchedAnime: true, hasWatchedEpisode: episodeWatched };
    }
  }

  return { hasWatchedAnime, hasWatchedEpisode };
};
