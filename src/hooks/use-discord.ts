import { useQuery } from "@tanstack/react-query";
import { DISCORD, fetchDiscord } from "@/lib/noble-data";

export function useDiscord() {
  const query = useQuery({
    queryKey: ["discord"],
    queryFn: fetchDiscord,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return {
    discord: query.data ?? DISCORD,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
