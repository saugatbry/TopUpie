"use client";

import React from "react";
import { Languages } from "lucide-react";
import { ROUTES } from "@/constants/routes";

import { usePathname } from "next/navigation";
import { ButtonLink } from "./common/button-link";

const WatchButton = () => {
  const pathName = usePathname();
  const slug = pathName.split("/")[2];

  return (
    <ButtonLink
      href={`${ROUTES.WATCH}?anime=${slug}&episode=1`}
      className="max-w-fit text-base"
      LeftIcon={Languages}
    >
      Start Watching
    </ButtonLink>
  );
};

export default WatchButton;
