interface AnimeJsonLdProps {
  name: string;
  description: string;
  image: string;
  rating?: string;
  genres?: string[];
  status?: string;
  type?: string;
  studio?: string;
  aired?: string;
}

export function AnimeJsonLd({ name, description, image, rating, genres, status, type, studio, aired }: AnimeJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name,
    description,
    image,
    genre: genres ?? [],
    ...(status && { status }),
    ...(type && { "additionalType": type }),
    ...(studio && { productionCompany: studio }),
    ...(aired && { datePublished: aired }),
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating,
        bestRating: "10",
        worstRating: "1",
      },
    }),
    potentialAction: {
      "@type": "WatchAction",
      target: [
        {
          "@type": "EntryPoint",
          urlTemplate: typeof window !== "undefined" ? window.location.href : "",
          actionPlatform: [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform",
          ],
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
