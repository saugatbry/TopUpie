"use client";

import React from "react";
import { CirclePlay, Languages } from "lucide-react";
import { ROUTES } from "@/constants/routes";

import { usePathname } from "next/navigation";
import { ButtonLink } from "./common/button-link";

type Props = {
  provider: "subdub" | "hindi";
  malId?: string | null;
};

const WatchButton = ({ provider, malId }: Props) => {
  const pathName = usePathname();
  const slug = pathName.split("/")[2];

  if (provider === "hindi") {
    return (
      <ButtonLink
        href={`${ROUTES.WATCH}?anime=${slug}&episode=${slug}-s1-ep1&type=hindi`}
        className="max-w-fit text-base"
        LeftIcon={Languages}
      >
        Start Watching
      </ButtonLink>
    );
  }

  const animeId = malId || slug;
  const episodeId = malId ? `${malId}-1` : `${slug}-s1-ep1`;

  return (
    <ButtonLink
      href={`${ROUTES.WATCH}?anime=${animeId}&episode=${episodeId}&type=subdub`}
      className="max-w-fit text-base"
      LeftIcon={CirclePlay}
    >
      Start Watching
    </ButtonLink>
  );
};

export default WatchButton;
