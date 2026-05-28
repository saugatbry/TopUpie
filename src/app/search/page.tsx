import Container from "@/components/container";
import React from "react";
import type { Metadata } from "next";
import SearchResults from "./search-results";

export const metadata: Metadata = {
  title: "Search Anime",
  description: "Search thousands of anime titles. Find your favourite anime to watch free in HD with sub and dub options.",
};

const page = () => {
  return (
    <Container>
      <SearchResults />
    </Container>
  );
};

export default page;

