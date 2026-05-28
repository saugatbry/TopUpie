import { useState, useEffect } from "react";
import { IWatchedAnime } from "@/types/watched-anime";

export const useGetLastEpisodeWatched = (animeId: string) => {
  const [lastEpisodeWatched, setLastEpisodeWatched] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let watchedDetails: Array<IWatchedAnime> = [];
    try {
      const stored = localStorage.getItem("watched");
      if (stored) watchedDetails = JSON.parse(stored);
    } catch {
      localStorage.removeItem("watched");
    }

    const anime = watchedDetails.find(
      (watchedAnime) => watchedAnime.anime.id === animeId,
    );

    if (anime && anime.episodes.length > 0) {
      const lastWatched = anime.episodes[anime.episodes.length - 1]; // Get the last episode
      setLastEpisodeWatched(lastWatched);
    } else {
      setLastEpisodeWatched(null); // No episodes watched
    }
  }, [animeId]);

  return lastEpisodeWatched;
};
