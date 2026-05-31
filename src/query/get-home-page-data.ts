import { GET_HOME_PAGE_DATA } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { IAnimeData } from "@/types/anime";
import { useQuery } from "react-query";
import { useProviderStore } from "@/store/provider-store";

const getHomePageData = async (provider: string) => {
  const res = await api.get(`/api/home?provider=${provider}`);
  return res.data.data as IAnimeData;
};

export const useGetHomePageData = () => {
  const provider = useProviderStore((s) => s.provider);
  return useQuery({
    queryFn: () => getHomePageData(provider),
    queryKey: [GET_HOME_PAGE_DATA, provider],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });
};
