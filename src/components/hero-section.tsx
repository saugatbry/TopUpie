"use client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";

import Container from "./container";
import { Button } from "./ui/button";
import parse from "html-react-parser";

import React from "react";
import { ArrowLeft, ArrowRight, Captions, Mic } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

import { ROUTES } from "@/constants/routes";
import { ButtonLink } from "./common/button-link";
import { SpotlightAnime } from "@/types/anime";
import { Badge } from "./ui/badge";

type IHeroSectionProps = {
  spotlightAnime: SpotlightAnime[];
  isDataLoading: boolean;
};

const HeroSection = (props: IHeroSectionProps) => {
  const [api, setApi] = React.useState<CarouselApi>();

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  if (props.isDataLoading) return <LoadingSkeleton />;
  if (!props.spotlightAnime || props.spotlightAnime.length === 0) return null;

  return (
    <div className="h-[calc(50vh+72px)] md:h-[calc(80vh+72px)] w-full relative -mt-[72px] overflow-hidden">
      <Carousel className="w-full h-full" setApi={setApi} opts={{ loop: true }} plugins={[autoplayPlugin.current]}>
        <CarouselContent className="h-full">
          {props.spotlightAnime.map((anime, index) => (
            <CarouselItem key={index} className="h-full pl-0">
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat relative flex items-end md:items-center"
                style={{ backgroundImage: `url(${anime.poster})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>

                <div className="relative z-20 w-full pb-10 md:py-10">
                  <Container>
                    <div className="space-y-2 lg:w-[40vw]">
                      <h1 className="text-2xl md:text-4xl font-black">{anime.name}</h1>

                      <div className="flex flex-row items-center space-x-2">
                        {anime.episodes.sub && (
                          <Badge className="bg-red-200 flex flex-row items-center space-x-0.5">
                            <Captions size={"16"} />
                            <span>{anime.episodes.sub}</span>
                          </Badge>
                        )}
                        {anime.episodes.dub && (
                          <Badge className="bg-green-200 flex flex-row items-center space-x-0.5">
                            <Mic size={"16"} />
                            <span>{anime.episodes.dub}</span>
                          </Badge>
                        )}
                      </div>

                      <p className="text-lg line-clamp-4">
                        {parse(anime.description as string)}
                      </p>
                      <div className="flex items-center gap-5 !mt-5">
                        <ButtonLink
                          href={`${ROUTES.ANIME_DETAILS}/${anime.id}`}
                          className="h-10 text-md bg-[#e9376b] text-white hover:bg-[#e9376b]"
                        >
                          Learn More
                        </ButtonLink>
                      </div>
                    </div>
                  </Container>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="absolute hidden md:flex items-center gap-5 right-10 bottom-24 z-50 isolate">
        <Button
          onClick={() => api?.scrollPrev()}
          className="rounded-full bg-transparent border border-white h-10 w-10 hover:bg-slate-500"
        >
          <ArrowLeft className="text-white shrink-0" />
        </Button>
        <Button
          onClick={() => api?.scrollNext()}
          className="rounded-full bg-transparent border border-white h-10 w-10 hover:bg-slate-500"
        >
          <ArrowRight className="text-white shrink-0" />
        </Button>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div className="h-[calc(50vh+72px)] md:h-[calc(80vh+72px)] w-full relative -mt-[72px] bg-slate-800 animate-pulse">
      <div className="h-full flex items-end md:items-center pb-10 md:py-10">
        <Container>
          <div className="space-y-2 lg:w-[40vw]">
            <div className="h-16 bg-slate-700 w-[75%]"></div>
            <div className="h-40 bg-slate-700 w-full"></div>
            <div className="flex items-center gap-5">
              <span className="h-10 w-[7.5rem] bg-slate-700"></span>
              <span className="h-10 w-[7.5rem] bg-slate-700"></span>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default HeroSection;
