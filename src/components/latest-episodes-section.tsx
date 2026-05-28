"use client";

import React from "react";
import Container from "./container";
import AnimeCard from "./anime-card";
import { AnimeCardGridSkeleton } from "./anime-card-skeleton";
import { ROUTES } from "@/constants/routes";
import BlurFade from "./ui/blur-fade";
import { LatestCompletedAnime } from "@/types/anime";

type Props = {
  latestEpisodes: LatestCompletedAnime[];
  loading: boolean;
};

const LatestEpisodesAnime = (props: Props) => {
  if (props.loading) return <LoadingSkeleton />;
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start z-20 ">
      <h5 className="text-2xl font-bold">Recent Releases</h5>
      <div className="grid lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 w-full gap-5 content-center">
        {props.latestEpisodes?.map((anime, idx) => (
          <BlurFade key={idx} delay={idx * 0.05} inView>
            <AnimeCard
              title={anime.name}
              subTitle={anime.type}
              poster={anime.poster}
              className="self-center justify-self-center"
              href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
              episodeCard
              sub={anime.episodes.sub}
              dub={anime.episodes.dub}
            />
          </BlurFade>
        ))}
      </div>
    </Container>
  );
};

const LoadingSkeleton = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start z-20 ">
      <div className="h-8 w-44 animate-pulse rounded-md bg-secondary" />
      <AnimeCardGridSkeleton count={14} />
    </Container>
  );
};

export default LatestEpisodesAnime;
