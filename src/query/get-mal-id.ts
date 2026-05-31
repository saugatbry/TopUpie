import { useQuery } from "react-query";
import { searchMalId } from "@/lib/jikan";

export const useGetMalId = (title: string) => {
  return useQuery({
    queryKey: ["mal-id", title],
    queryFn: () => searchMalId(title),
    enabled: !!title,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
};
