import { GET_ANIME_BANNER } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { useQuery } from "react-query";

interface IAnimeBanner {
  Media: {
    id: number;
    bannerImage: string;
  };
}

const getAnimeBanner = async (malId: number) => {
  const res = await api.post("https://graphql.anilist.co", {
    query: `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          id
          bannerImage
        }
      }
    `,
    variables: {
      idMal: malId,
    },
  });
  return res.data.data as IAnimeBanner;
};

export const useGetAnimeBanner = (malId: number) => {
  return useQuery({
    queryFn: () => getAnimeBanner(malId),
    queryKey: [GET_ANIME_BANNER, malId],
    enabled: !!malId,
  });
};
