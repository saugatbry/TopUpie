"use client";

import ContinueWatching from "@/components/continue-watching";
import FeaturedCollection from "@/components/featured-collection";
import HeroSection from "@/components/hero-section";
import LatestEpisodesAnime from "@/components/latest-episodes-section";
import AnimeSchedule from "@/components/anime-schedule";
import AnimeSections from "@/components/anime-sections";
import { useGetHomePageData } from "@/query/get-home-page-data";
import { IAnime, LatestCompletedAnime, SpotlightAnime } from "@/types/anime";

export default function Home() {
  const { data, isLoading, isError } = useGetHomePageData();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white gap-4">
        <h2 className="text-2xl font-bold">Failed to load anime data</h2>
        <p className="text-gray-400">The API might be rate-limited or unavailable. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#e9376b] text-white rounded-lg hover:bg-[#d62d5d]"
        >
          Refresh
        </button>
      </div>
    );
  }

  const hasData = data && data.spotlightAnimes && data.spotlightAnimes.length > 0;

  return (
    <div className="flex flex-col bg-[#121212]">
      <HeroSection
        spotlightAnime={(data?.spotlightAnimes ?? []) as SpotlightAnime[]}
        isDataLoading={isLoading}
      />
      {hasData && (
        <>
          <LatestEpisodesAnime
            loading={isLoading}
            latestEpisodes={(data?.latestEpisodeAnimes ?? []) as LatestCompletedAnime[]}
          />

          <ContinueWatching loading={isLoading} />

          <FeaturedCollection
            loading={isLoading}
            featuredAnime={[
              {
                title: "Most Favorite Anime",
                anime: (data?.mostFavoriteAnimes ?? []) as IAnime[],
              },
              {
                title: "Most Popular Anime",
                anime: (data?.mostPopularAnimes ?? []) as IAnime[],
              },
              {
                title: "Latest Completed Anime",
                anime: (data?.latestCompletedAnimes ?? []) as LatestCompletedAnime[],
              },
            ]}
          />
          <AnimeSections
            title={"Trending Anime"}
            trendingAnime={(data?.trendingAnimes ?? []) as IAnime[]}
            loading={isLoading}
          />

          <AnimeSchedule />

          <AnimeSections
            title={"Upcoming Animes"}
            trendingAnime={(data?.topUpcomingAnimes ?? []) as IAnime[]}
            loading={isLoading}
          />
        </>
      )}
      {!isLoading && !hasData && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-white gap-4">
          <p className="text-gray-400">No anime data available right now. Please try again later.</p>
        </div>
      )}
    </div>
  );
}
