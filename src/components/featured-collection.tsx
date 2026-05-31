import React from "react";
import Container from "./container";
import FeaturedCollectionCard from "./featured-collection-card";
import { IAnime, LatestCompletedAnime } from "@/types/anime";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  featuredAnime: [
    mostFavorite: { title: string; anime: IAnime[] },
    mostPopular: { title: string; anime: IAnime[] },
    latestCompleted: { title: string; anime: LatestCompletedAnime[] }
  ];
  loading: boolean;
};

const FeaturedCollection = ({ featuredAnime, loading }: Props) => {
  if (loading) return <LoadingSkeleton />;
  return (
    <Container className="flex flex-col gap-5 items-center lg:items-start py-5">
      <h5 className="text-2xl font-bold">Featured Collection</h5>
      <div className="grid w-full gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {featuredAnime.map((category, idx) => (
          <FeaturedCollectionCard
            title={category.title}
            key={idx}
            anime={category.anime}
          />
        ))}
      </div>
    </Container>
  );
};

const LoadingSkeleton = () => {
  return (
    <Container className="flex flex-col gap-5 py-10 items-center lg:items-start ">
      <div className="h-8 w-44 animate-pulse rounded-md bg-secondary" />
      <div className="grid w-full gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </Container>
  );
};

export default FeaturedCollection;

